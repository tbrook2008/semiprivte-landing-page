// Client Portal Modal Handling & Interactive Telemetry
document.addEventListener('DOMContentLoaded', () => {
    // Intersection observer for scroll animations
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const animatedElements = document.querySelectorAll('.fade-in-up');
    animatedElements.forEach(el => observer.observe(el));
    
    // Navbar scroll effect
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                navbar.style.padding = '15px 0';
                navbar.style.backgroundColor = 'rgba(7, 7, 7, 0.98)';
            } else {
                navbar.style.padding = '30px 0';
                navbar.style.backgroundColor = 'transparent';
            }
        });
    }

    // Client Portal Modal Handling
    const modal = document.getElementById('login-modal') || document.getElementById('portal-modal');
    const navPortalBtn = document.getElementById('nav-portal-btn') || document.querySelector('.nav-portal-btn');
    const heroPortalBtn = document.getElementById('hero-portal-btn');
    const modalCloseBtn = document.getElementById('modal-close') || document.querySelector('.modal-close');
    const portalForm = document.getElementById('portal-form');
    const formFeedback = document.getElementById('form-feedback');

    function openModal() {
        if (!modal) return;
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        if (!modal) return;
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }

    if (navPortalBtn) navPortalBtn.addEventListener('click', openModal);
    if (heroPortalBtn) heroPortalBtn.addEventListener('click', openModal);
    if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);

    if (modal) {
        // Backdrop click to close
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });

        // ESC keypress to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('active')) {
                closeModal();
            }
        });
    }

    // Form submission handler
    if (portalForm) {
        portalForm.addEventListener('submit', (e) => {
            e.preventDefault();
            portalForm.style.display = 'none';
            if (formFeedback) {
                formFeedback.classList.remove('hidden');
            }
        });
    }

    // ==========================================
    // Chart.js Equity Curves Initialization (R1)
    // ==========================================
    const chartInstances = {};

    function createGradient(ctx) {
        const gradient = ctx.createLinearGradient(0, 0, 0, 200);
        gradient.addColorStop(0, 'rgba(181, 154, 109, 0.35)');
        gradient.addColorStop(1, 'rgba(181, 154, 109, 0.0)');
        return gradient;
    }

    const commonChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
            duration: 1000,
            easing: 'easeOutQuart'
        },
        interaction: {
            mode: 'index',
            intersect: false
        },
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: '#121212',
                titleColor: '#f2f2f2',
                bodyColor: '#b59a6d',
                borderColor: '#333333',
                borderWidth: 1,
                padding: 12,
                displayColors: false,
                callbacks: {
                    label: function(context) {
                        return ' Equity: $' + context.parsed.y.toLocaleString();
                    }
                }
            }
        },
        scales: {
            x: {
                grid: {
                    color: 'rgba(255, 255, 255, 0.03)',
                    drawBorder: false
                },
                ticks: {
                    color: '#777',
                    font: { family: "'Inter', sans-serif", size: 11 }
                }
            },
            y: {
                grid: {
                    color: 'rgba(255, 255, 255, 0.05)',
                    drawBorder: false
                },
                ticks: {
                    color: '#777',
                    font: { family: "'Inter', sans-serif", size: 11 },
                    callback: function(val) {
                        return '$' + (val / 1000) + 'k';
                    }
                }
            }
        }
    };

    // Instantiate Chart for Ivan Trader
    const canvasIvan = document.getElementById('chart-ivan');
    if (canvasIvan && typeof Chart !== 'undefined') {
        const ctxIvan = canvasIvan.getContext('2d');
        chartInstances['chart-ivan'] = new Chart(ctxIvan, {
            type: 'line',
            data: {
                labels: ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
                datasets: [{
                    label: 'Ivan Trader Equity',
                    data: [100000, 104200, 108500, 106100, 112400, 118400],
                    borderColor: '#b59a6d',
                    borderWidth: 2.5,
                    backgroundColor: createGradient(ctxIvan),
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#b59a6d',
                    pointBorderColor: '#070707',
                    pointHoverRadius: 6
                }]
            },
            options: commonChartOptions
        });
    }

    // Instantiate Chart for Topstep Bot V2
    const canvasTopstep = document.getElementById('chart-topstep');
    if (canvasTopstep && typeof Chart !== 'undefined') {
        const ctxTopstep = canvasTopstep.getContext('2d');
        chartInstances['chart-topstep'] = new Chart(ctxTopstep, {
            type: 'line',
            data: {
                labels: ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
                datasets: [{
                    label: 'Topstep Bot V2 Equity',
                    data: [150000, 158500, 153200, 166400, 172100, 186200],
                    borderColor: '#b59a6d',
                    borderWidth: 2.5,
                    backgroundColor: createGradient(ctxTopstep),
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#b59a6d',
                    pointBorderColor: '#070707',
                    pointHoverRadius: 6
                }]
            },
            options: commonChartOptions
        });
    }

    // ==========================================
    // Interactive Strategy Card Toggles (R5)
    // ==========================================
    const cardToggleBtns = document.querySelectorAll('.card-toggles .toggle-btn');
    cardToggleBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const button = e.currentTarget;
            const card = button.closest('.system-card');
            if (!card) return;

            const targetTab = button.getAttribute('data-tab');

            // 1. Update toggle buttons active state within card
            const buttons = card.querySelectorAll('.toggle-btn');
            buttons.forEach(b => b.classList.remove('active'));
            button.classList.add('active');

            // 2. Hide all tab contents in card and activate target
            const tabContents = card.querySelectorAll('.tab-content');
            tabContents.forEach(tc => tc.classList.remove('active'));

            const activeTabContent = card.querySelector(`.tab-${targetTab}`);
            if (activeTabContent) {
                activeTabContent.classList.add('active');

                // 3. Trigger chart resize & update if overview tab reactivated
                if (targetTab === 'overview') {
                    const canvas = activeTabContent.querySelector('canvas');
                    if (canvas && canvas.id && chartInstances[canvas.id]) {
                        setTimeout(() => {
                            chartInstances[canvas.id].resize();
                            chartInstances[canvas.id].update();
                        }, 50);
                    }
                }
            }
        });
    });
});
