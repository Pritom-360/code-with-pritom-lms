/* ============================================
   UI Class — Core UI Controller
   ============================================ */
class UI {

    /* ---- Toast Notifications ---- */
    static showToast(message, type = 'success') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const icons = {
            success: 'fa-circle-check',
            error: 'fa-circle-exclamation',
            info: 'fa-circle-info',
            warning: 'fa-triangle-exclamation'
        };

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-icon"><i class="fa-solid ${icons[type] || icons.info}"></i></div>
            <div class="toast-message">${message}</div>
        `;

        container.appendChild(toast);

        // Auto-dismiss
        setTimeout(() => {
            toast.classList.add('toast-exit');
            setTimeout(() => toast.remove(), 400);
        }, 4000);
    }

    /* ---- Auth Modal (Landing Page) ---- */
    static openModal(tab = 'login') {
        const backdrop = document.getElementById('modal-backdrop');
        const container = document.getElementById('modal-container');
        if (!backdrop || !container) return;

        backdrop.classList.add('active');
        container.classList.add('active');
        document.body.style.overflow = 'hidden';
        this.switchTab(tab);
    }

    static closeModal() {
        const backdrop = document.getElementById('modal-backdrop');
        const container = document.getElementById('modal-container');
        if (!backdrop || !container) return;

        backdrop.classList.remove('active');
        container.classList.remove('active');
        document.body.style.overflow = '';
    }

    static switchTab(tab) {
        const loginForm = document.getElementById('loginForm');
        const regForm = document.getElementById('regForm');
        const tabLogin = document.getElementById('tab-login');
        const tabReg = document.getElementById('tab-register');

        if (!loginForm || !regForm) return;

        if (tab === 'login') {
            loginForm.classList.remove('hidden');
            regForm.classList.add('hidden');
            tabLogin.classList.add('active');
            tabReg.classList.remove('active');
        } else {
            loginForm.classList.add('hidden');
            regForm.classList.remove('hidden');
            tabReg.classList.add('active');
            tabLogin.classList.remove('active');
        }

        // Clear any status messages
        const statusEls = document.querySelectorAll('.auth-status');
        statusEls.forEach(el => { el.textContent = ''; el.className = 'auth-status'; });
    }

    /* ---- Dashboard Tab Switching ---- */
    static switchDashboardTab(tabName) {
        // Hide all tab content
        document.querySelectorAll('.tab-content').forEach(section => {
            section.classList.add('hidden');
        });

        // Show selected
        const target = document.getElementById(`tab-${tabName}`);
        if (target) {
            target.classList.remove('hidden');
            target.style.opacity = '0';
            target.style.transform = 'translateY(12px)';
            requestAnimationFrame(() => {
                target.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
                target.style.opacity = '1';
                target.style.transform = 'translateY(0)';
            });
        }

        // Update sidebar links
        document.querySelectorAll('.sidebar-link').forEach(btn => {
            btn.classList.remove('active');
        });
        const activeBtn = document.getElementById(`btn-tab-${tabName}`);
        if (activeBtn) activeBtn.classList.add('active');
    }

    /* ---- Loading State for Buttons ---- */
    static toggleLoading(buttonId, isLoading) {
        const btn = document.getElementById(buttonId);
        if (!btn) return;

        if (isLoading) {
            btn.dataset.originalText = btn.innerHTML;
            btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin" style="margin-right:8px"></i> Processing...`;
            btn.disabled = true;
            btn.style.opacity = '0.6';
            btn.style.pointerEvents = 'none';
        } else {
            btn.innerHTML = btn.dataset.originalText || btn.innerHTML;
            btn.disabled = false;
            btn.style.opacity = '1';
            btn.style.pointerEvents = '';
        }
    }

    /* ---- Password Toggle ---- */
    static togglePassword(inputId, toggleBtn) {
        const input = document.getElementById(inputId);
        if (!input) return;

        if (input.type === 'password') {
            input.type = 'text';
            toggleBtn.innerHTML = '<i class="fa-solid fa-eye-slash"></i>';
        } else {
            input.type = 'password';
            toggleBtn.innerHTML = '<i class="fa-solid fa-eye"></i>';
        }
    }

    /* ---- Mobile Navigation ---- */
    static openMobileNav() {
        const nav = document.getElementById('mobile-nav');
        const overlay = document.getElementById('mobile-nav-overlay');
        if (nav) nav.classList.add('open');
        if (overlay) overlay.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    static closeMobileNav() {
        const nav = document.getElementById('mobile-nav');
        const overlay = document.getElementById('mobile-nav-overlay');
        if (nav) nav.classList.remove('open');
        if (overlay) overlay.classList.remove('open');
        document.body.style.overflow = '';
    }

    /* ---- Dashboard Sidebar (Mobile) ---- */
    static toggleSidebar() {
        const sidebar = document.getElementById('dashboard-sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        if (!sidebar) return;

        sidebar.classList.toggle('open');
        if (overlay) overlay.classList.toggle('open');
    }

    static closeSidebar() {
        const sidebar = document.getElementById('dashboard-sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        if (sidebar) sidebar.classList.remove('open');
        if (overlay) overlay.classList.remove('open');
    }

    /* ---- Scroll-Reveal Observer ---- */
    static initScrollReveal() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15 });

        document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    }

    /* ---- Navbar Scroll Effect ---- */
    static initNavbarScroll() {
        const navbar = document.getElementById('navbar');
        if (!navbar) return;

        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        }, { passive: true });
    }

    /* ---- Smooth Scroll to Element ---- */
    static scrollTo(selector) {
        const el = document.querySelector(selector);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            this.closeMobileNav();
        }
    }

    /* ---- Animated Counter ---- */
    static animateCounters() {
        const counters = document.querySelectorAll('[data-count]');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const target = parseInt(entry.target.getAttribute('data-count'));
                    const suffix = entry.target.getAttribute('data-suffix') || '';
                    let current = 0;
                    const duration = 2000;
                    const step = target / (duration / 16);

                    const counter = setInterval(() => {
                        current += step;
                        if (current >= target) {
                            current = target;
                            clearInterval(counter);
                        }
                        entry.target.textContent = Math.floor(current).toLocaleString() + suffix;
                    }, 16);

                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });

        counters.forEach(el => observer.observe(el));
    }

    /* ---- Page Loader ---- */
    static hidePageLoader() {
        const loader = document.getElementById('page-loader');
        if (loader) {
            loader.classList.add('hidden');
            setTimeout(() => loader.remove(), 500);
        }
    }
}

/* ---- Auto-Init on DOM Ready ---- */
document.addEventListener('DOMContentLoaded', () => {
    UI.initScrollReveal();
    UI.initNavbarScroll();
    UI.animateCounters();

    // Hide page loader after a small delay
    setTimeout(() => UI.hidePageLoader(), 300);
});

/* ============================================
   WORKSHOP DATA & CONTROLLER (Async)
   ============================================ */
class WorkshopManager {
    static async fetchData() {
        try {
            // Add cache busting to ensure fresh data
            const response = await fetch(`data/workshop.json?t=${new Date().getTime()}`);
            this.workshops = await response.json();
            return this.workshops;
        } catch (error) {
            console.error('Failed to load workshop data:', error);
            return [];
        }
    }

    static getWorkshops() {
        return this.workshops || [];
    }

    static getWorkshopById(id) {
        return (this.workshops || []).find(w => w.id === id);
    }

    // Find Live or Nearest Upcoming
    static getFeaturedWorkshop() {
        const workshops = this.workshops || [];
        const now = new Date();

        // 1. Check for LIVE (Current Time is within slot)
        // OR if status is explicitly 'live' regardless of time (for manual override)
        const live = workshops.find(w => {
            const start = new Date(w.startTime);
            const end = new Date(w.endTime);
            return (now >= start && now <= end) || w.status === 'live';
        });
        if (live) return { ...live, displayStatus: 'live' };

        // 2. Check for Upcoming (Nearest Future)
        const upcoming = workshops
            .filter(w => new Date(w.startTime) > now && w.status !== 'archived')
            .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))[0];

        return upcoming ? { ...upcoming, displayStatus: 'upcoming' } : null;
    }

    static getArchivedWorkshops() {
        const now = new Date();
        // Archived manually OR past endTime
        return (this.workshops || []).filter(w => w.status === 'archived' || (new Date(w.endTime) < now && w.status !== 'upcoming'));
    }
}