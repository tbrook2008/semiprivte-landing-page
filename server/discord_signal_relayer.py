#!/usr/bin/env python3
"""
SemiPrivate Discord Signal Relayer (Read-Only)

This standalone script periodically reads trades from the running bot's SQLite database
in STRICT READ-ONLY mode and posts real-time trade signals / alerts to a Discord channel
via a Discord Webhook.

IMPORTANT: This script is 100% read-only and never writes to trader.sqlite or interferes
with running trading processes.
"""

import os
import sys
import time
import sqlite3
import json
import urllib.request
import urllib.parse
from datetime import datetime

# Path to the live bot's SQLite database
DB_PATH = os.environ.get("TRADER_DB_PATH", "/Users/tbrook/Desktop/topstep-trader-bot-v2/data/trader.sqlite")

# Discord Webhook URL (Set DISCORD_WEBHOOK_URL env var or replace below)
DISCORD_WEBHOOK_URL = os.environ.get("DISCORD_WEBHOOK_URL", "")

# Poll interval in seconds
POLL_INTERVAL = int(os.environ.get("POLL_INTERVAL", "5"))


def connect_readonly_db(db_path: str):
    """Establishes a strict read-only SQLite connection using URI mode."""
    if not os.path.exists(db_path):
        print(f"[Relayer Warning] Database file not found at: {db_path}")
        return None
    try:
        # SQLite URI read-only mode string
        db_uri = f"file:{os.path.abspath(db_path)}?mode=ro"
        conn = sqlite3.connect(db_uri, uri=True)
        conn.row_factory = sqlite3.Row
        return conn
    except Exception as e:
        print(f"[Relayer Error] Failed to open read-only DB: {e}")
        return None


def send_discord_webhook(webhook_url: str, embed_payload: dict):
    """Sends a rich Embed payload to a Discord Webhook endpoint."""
    if not webhook_url:
        print("[Relayer Simulation Mode] (No Webhook URL configured)")
        print(json.dumps(embed_payload, indent=2))
        return True

    try:
        data = json.dumps({"embeds": [embed_payload]}).encode('utf-8')
        req = urllib.request.Request(
            webhook_url,
            data=data,
            headers={
                'Content-Type': 'application/json',
                'User-Agent': 'SemiPrivate-SignalRelayer/1.0'
            }
        )
        with urllib.request.urlopen(req) as response:
            return response.status in (200, 204)
    except Exception as e:
        print(f"[Relayer Error] Failed sending to Discord Webhook: {e}")
        return False


def format_trade_embed(trade: dict) -> dict:
    """Formats a database trade record into a sleek, institutional Discord Embed."""
    trade_id = trade['id']
    symbol = trade['symbol']
    direction = trade['direction'].upper()
    qty = trade['qty']
    entry_price = trade.get('entry_price') or 0.0
    exit_price = trade.get('exit_price') or 0.0
    pnl = trade.get('pnl')
    status = trade.get('status', 'submitted').upper()
    timestamp = trade.get('timestamp') or datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")

    # Determine color: Green for Long/Profit (#4EEBAD), Red for Short/Loss (#FF4D4F), Gold default (#B59A6D)
    if pnl is not None:
        color = 0x4EEBAD if pnl >= 0 else 0xFF4D4F
        title_prefix = "🎉 TRADE CLOSED" if pnl >= 0 else "⚠️ TRADE CLOSED"
    else:
        color = 0x4EEBAD if direction == "BUY" else 0xFF4D4F
        title_prefix = "🚨 NEW SIGNAL EXECUTED"

    fields = [
        {"name": "Instrument", "value": f"`{symbol}`", "inline": True},
        {"name": "Direction", "value": f"`{direction}`", "inline": True},
        {"name": "Quantity", "value": f"`{qty}`", "inline": True},
    ]

    if entry_price > 0:
        fields.append({"name": "Entry Price", "value": f"`${entry_price:,.2f}`", "inline": True})
    if exit_price > 0:
        fields.append({"name": "Exit Price", "value": f"`${exit_price:,.2f}`", "inline": True})
    if pnl is not None:
        pnl_str = f"+${pnl:,.2f}" if pnl >= 0 else f"-${abs(pnl):,.2f}"
        fields.append({"name": "Realized PnL", "value": f"**`{pnl_str}`**", "inline": True})

    fields.append({"name": "Status", "value": f"`{status}`", "inline": True})
    fields.append({"name": "Execution Time", "value": f"`{timestamp}`", "inline": True})

    embed = {
        "title": f"{title_prefix} | {symbol}",
        "description": f"SemiPrivate Quantitative Signal Stream — Trade #{trade_id}",
        "color": color,
        "fields": fields,
        "footer": {
            "text": "SemiPrivate Quantitative Trading Systems • Confidential Signal Relay",
            "icon_url": "https://semiprivte.com/favicon.ico"
        },
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }

    return embed


def run_relayer_loop():
    """Main execution loop for read-only signal monitoring."""
    print("=" * 60)
    print("  SemiPrivate Read-Only Discord Signal Relayer Started")
    print(f"  Target DB: {DB_PATH}")
    print(f"  Poll Rate: Every {POLL_INTERVAL} seconds")
    print("=" * 60)

    last_seen_id = 0

    # Initial check for highest existing ID so we don't spam old historical trades on startup
    conn = connect_readonly_db(DB_PATH)
    if conn:
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT MAX(id) as max_id FROM trades")
            row = cursor.fetchone()
            if row and row['max_id']:
                last_seen_id = row['max_id']
                print(f"[Relayer Init] Starting monitoring from Trade ID #{last_seen_id}")
            conn.close()
        except Exception as e:
            print(f"[Relayer Init Warning] Could not read max ID: {e}")

    while True:
        try:
            conn = connect_readonly_db(DB_PATH)
            if conn:
                cursor = conn.cursor()
                cursor.execute(
                    "SELECT * FROM trades WHERE id > ? ORDER BY id ASC LIMIT 10",
                    (last_seen_id,)
                )
                new_trades = cursor.fetchall()
                
                for trade in new_trades:
                    trade_dict = dict(trade)
                    trade_id = trade_dict['id']
                    print(f"[Signal Relay] Processing new trade #{trade_id} - {trade_dict['symbol']} {trade_dict['direction']}")
                    
                    embed = format_trade_embed(trade_dict)
                    send_discord_webhook(DISCORD_WEBHOOK_URL, embed)
                    
                    last_seen_id = trade_id
                
                conn.close()
        except Exception as e:
            print(f"[Relayer Error] Loop exception: {e}")

        time.sleep(POLL_INTERVAL)


if __name__ == "__main__":
    run_relayer_loop()
