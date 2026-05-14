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

/* ---- Super Broadcast Global Announcement Modal Popup ---- */
async function initAnnouncementPopup() {
    const currentPath = window.location.pathname;
    const allowedPages = ['/', '/index.html', '/dashboard.html'];

    // Constrain popups strictly to primary navigation nodes (landing & dashboard)
    if (!allowedPages.some(page => currentPath.endsWith(page))) {
        return; 
    }

    // Secure single broadcast dispatch per-session limit
    if (sessionStorage.getItem('announcement_shown')) {
        return; 
    }

    try {
        const res = await fetch('/api/announcements/active');
        const data = await res.json();

        if (!data) return;

        let ann = null;
        // Bulletproof parsing: handles arrays, direct bare objects, and nested schemas
        if (Array.isArray(data)) {
            if (data.length === 0) return;
            ann = data[0];
        } else if (data.title && data.message) {
            ann = data; // Raw direct active announcement object
        } else if (data.announcement) {
            ann = data.announcement; // Legacy nested model
        }

        if (!ann) return; // Safe-exit if no announcement is available or empty {} was provided

        // Flag successfully displayed event to lock downstream boots during session
        sessionStorage.setItem('announcement_shown', 'true');

        // Create dynamic backdrop with strong glassmorphic blur
        const backdrop = document.createElement('div');
        backdrop.id = 'announcement-backdrop';
        backdrop.className = 'fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 opacity-0 transition-opacity duration-500 pointer-events-auto';
        backdrop.style.zIndex = '9900'; // Ultra-high, but layered slightly beneath focus modals (z-9999)

        // Large Dynamic Tailwind Card Container
        const content = document.createElement('div');
        content.className = 'bg-white rounded-3xl shadow-[0_30px_60px_-12px_rgba(0,0,0,0.25)] max-w-md w-full overflow-hidden transform scale-95 opacity-0 transition-all duration-500 relative border border-slate-100';

        // Absolute Close Wrapper (Top Right X)
        const closeBtn = document.createElement('button');
        closeBtn.className = 'absolute top-4 right-4 w-9 h-9 bg-white/60 hover:bg-white text-slate-800 hover:text-orange-600 shadow-sm rounded-full flex items-center justify-center transition-all z-20 group border border-slate-100/50';
        closeBtn.innerHTML = '<i class="fa-solid fa-xmark text-base group-hover:scale-110 transition-transform"></i>';
        
        const dismissAnn = () => {
            backdrop.classList.remove('opacity-100');
            content.classList.remove('scale-100', 'opacity-100');
            setTimeout(() => backdrop.remove(), 500);
        };
        
        closeBtn.onclick = dismissAnn;

        // Render media frame if image_url supplied
        let imageBlock = '';
        if (ann.image_url) {
            imageBlock = `
                <div class="relative aspect-video overflow-hidden">
                    <img src="${ann.image_url}" alt="Broadcast banner" class="w-full h-full object-cover hover:scale-105 transition duration-700">
                    <div class="absolute inset-0 bg-gradient-to-t from-slate-900/20 to-transparent"></div>
                </div>
            `;
        }

        // Call to Action mapping
        const learnMoreBtn = ann.action_url 
            ? `<a href="${ann.action_url}" target="_blank" class="flex-1 text-center py-3.5 px-6 bg-slate-900 hover:bg-orange-600 text-white font-black text-sm rounded-xl shadow-lg shadow-slate-900/10 hover:shadow-orange-500/20 transition-all duration-300 flex items-center justify-center gap-2">Learn More <i class="fa-solid fa-arrow-up-right-from-square text-[10px] opacity-70"></i></a>` 
            : '';

        content.innerHTML = `
            ${imageBlock}
            <div class="p-7">
                <div class="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-orange-600 bg-orange-50 w-fit px-3 py-1 rounded-full mb-4 border border-orange-100/50">
                    <i class="fa-solid fa-bullhorn animate-bounce"></i> System Broadcast
                </div>
                <h3 class="text-xl font-black text-slate-800 leading-snug mb-3">${ann.title}</h3>
                <p class="text-slate-500 text-sm leading-relaxed mb-6 whitespace-pre-line font-medium">${ann.message}</p>
                
                <div class="flex gap-3 mt-2">
                    ${learnMoreBtn}
                    <button id="ann-dismiss-action" class="py-3.5 px-6 ${ann.action_url ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'flex-1 bg-slate-900 hover:bg-orange-600 text-white shadow-lg'} font-extrabold text-sm rounded-xl transition-all duration-300">Dismiss</button>
                </div>
            </div>
        `;

        content.appendChild(closeBtn);
        backdrop.appendChild(content);
        document.body.appendChild(backdrop);
        
        // Wire button action dismissal listeners
        backdrop.querySelector('#ann-dismiss-action').onclick = dismissAnn;

        // Safe trigger layout transition
        requestAnimationFrame(() => {
            backdrop.classList.add('opacity-100');
            content.classList.add('scale-100', 'opacity-100');
        });

    } catch (error) {
        console.error('[Super Broadcast Modal Dispatch Crash]:', error);
    }
}

/* ---- Auto-Init on DOM Ready ---- */
document.addEventListener('DOMContentLoaded', () => {
    UI.initScrollReveal();
    UI.initNavbarScroll();
    UI.animateCounters();
    initAnnouncementPopup(); // Run standalone system popup immediately

    // Boot up global cross-page persistent Focus Timer Engine
    if (typeof GlobalPomodoro !== 'undefined') {
        GlobalPomodoro.init();
    }

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

/* ============================================
   GLOBAL POMODORO FOCUS CENTER (Persistent)
   ============================================ */
class GlobalPomodoro {
    static init() {
        this.timerId = null;
        
        // Strict durations constant map
        this.DURATIONS = {
            focus: 25 * 60,
            break: 5 * 60
        };

        // Fetch keys from browser physical storage
        this.loadState();

        // Auto-resume background thread if state warrants
        if (this.isRunning) {
            const curr = Date.now();
            if (this.targetTime && this.targetTime > curr) {
                this.timeRemaining = Math.max(0, Math.ceil((this.targetTime - curr) / 1000));
                this.startTimerLoop();
            } else if (this.targetTime) {
                // Time limits elapsed during sleep/closed browser
                this.triggerCompletion(true);
            }
        }

        // Sync DOM rendering classes if widgets reside on current page
        this.syncDashboardUI();
        
        // Quiet permission request for alerts during focus blocks
        if ("Notification" in window && Notification.permission === "default" && this.isRunning) {
            setTimeout(() => { Notification.requestPermission(); }, 4000);
        }
    }

    static loadState() {
        this.currentMode = localStorage.getItem('pomoMode') || 'focus';
        this.isRunning = localStorage.getItem('pomoIsRunning') === 'true';
        const target = localStorage.getItem('pomoTargetTime');
        this.targetTime = target ? parseInt(target, 10) : null;

        const storedRem = localStorage.getItem('pomoRemainingSeconds');
        
        if (this.isRunning && this.targetTime) {
            const curr = Date.now();
            this.timeRemaining = Math.max(0, Math.ceil((this.targetTime - curr) / 1000));
        } else {
            this.timeRemaining = storedRem ? parseInt(storedRem, 10) : this.DURATIONS[this.currentMode];
        }
    }

    static saveState() {
        localStorage.setItem('pomoMode', this.currentMode);
        localStorage.setItem('pomoIsRunning', this.isRunning ? 'true' : 'false');
        localStorage.setItem('pomoRemainingSeconds', this.timeRemaining.toString());
        
        if (this.isRunning && this.targetTime) {
            localStorage.setItem('pomoTargetTime', this.targetTime.toString());
        } else {
            localStorage.removeItem('pomoTargetTime');
        }
    }

    static setMode(mode) {
        if (this.isRunning) this.pause();
        
        this.currentMode = mode;
        this.timeRemaining = this.DURATIONS[mode];
        this.isRunning = false;
        this.targetTime = null;
        
        this.saveState();
        this.syncDashboardUI();
    }

    static toggle() {
        if (this.isRunning) {
            this.pause();
        } else {
            this.start();
        }
    }

    static start() {
        if (this.timeRemaining <= 0) this.timeRemaining = this.DURATIONS[this.currentMode];
        
        this.isRunning = true;
        // Program timestamp baseline: locks completion coordinates precisely in OS clock space
        this.targetTime = Date.now() + (this.timeRemaining * 1000);
        
        this.saveState();
        this.startTimerLoop();
        this.syncDashboardUI();
    }

    static pause() {
        clearInterval(this.timerId);
        this.isRunning = false;
        
        // Read absolute seconds at freeze coordinates
        if (this.targetTime) {
            this.timeRemaining = Math.max(0, Math.ceil((this.targetTime - Date.now()) / 1000));
        }
        this.targetTime = null;
        
        this.saveState();
        this.syncDashboardUI();
    }

    static reset() {
        this.pause();
        this.timeRemaining = this.DURATIONS[this.currentMode];
        this.saveState();
        this.syncDashboardUI();
    }

    static startTimerLoop() {
        clearInterval(this.timerId);
        this.timerId = setInterval(() => {
            if (this.targetTime) {
                const diff = Math.ceil((this.targetTime - Date.now()) / 1000);
                
                if (diff <= 0) {
                    this.triggerCompletion();
                } else {
                    this.timeRemaining = diff;
                    this.tickVisualUpdate();
                }
            } else {
                this.timeRemaining--;
                if (this.timeRemaining <= 0) {
                    this.triggerCompletion();
                } else {
                    this.tickVisualUpdate();
                }
            }
        }, 1000);
    }

    static triggerCompletion(wasOffline = false) {
        clearInterval(this.timerId);
        this.isRunning = false;
        this.timeRemaining = 0;
        this.targetTime = null;
        
        this.saveState();
        this.syncDashboardUI();
        
        this.playChime();
        this.dispatchAlert(wasOffline);
        
        // Elegant opposite mode swap Delay
        setTimeout(() => {
            const nextStage = this.currentMode === 'focus' ? 'break' : 'focus';
            this.setMode(nextStage);
        }, wasOffline ? 1000 : 3500);
    }

    static tickVisualUpdate() {
        const timeEl = document.getElementById('pomo-time');
        const ringEl = document.getElementById('pomo-ring');
        if (!timeEl || !ringEl) return;

        const mins = Math.floor(this.timeRemaining / 60);
        const secs = this.timeRemaining % 60;
        timeEl.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

        // Dash Calculations
        const limit = this.DURATIONS[this.currentMode];
        const fract = Math.max(0, Math.min(1, this.timeRemaining / limit));
        const offsetVal = 264 - (264 * fract);
        ringEl.setAttribute('stroke-dashoffset', offsetVal.toString());
    }

    static syncDashboardUI() {
        // Sync Clock text
        this.tickVisualUpdate();
        
        const root = document.getElementById('pomodoro-card');
        if (!root) return; // Safeguard abort on non-dashboard views

        const glow = document.getElementById('pomo-glow');
        const ring = document.getElementById('pomo-ring');
        const tag = document.getElementById('pomo-label');
        const fBtn = document.getElementById('btn-pomo-focus');
        const bBtn = document.getElementById('btn-pomo-break');
        const actionBtn = document.getElementById('btn-pomo-action');
        const actionLbl = document.getElementById('pomo-action-lbl');
        const actionIcon = document.querySelector('#btn-pomo-action i');
        const statText = document.getElementById('pomo-status');

        if (!ring || !tag || !fBtn || !bBtn || !actionBtn) return;

        // Running/Paused logic labels
        if (this.isRunning) {
            if (actionIcon) actionIcon.className = 'fa-solid fa-pause text-[9px]';
            if (actionLbl) actionLbl.textContent = 'Pause';
            if (statText) statText.textContent = 'In progress...';
        } else {
            if (actionIcon) actionIcon.className = 'fa-solid fa-play text-[9px]';
            if (actionLbl) actionLbl.textContent = 'Start';
            if (statText) statText.textContent = this.timeRemaining === 0 ? 'Finished!' : 'Paused';
        }

        // Dynamic palette configurations
        if (this.currentMode === 'focus') {
            root.style.borderLeftColor = '#f97316';
            glow.className = 'absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none transition-all duration-500';
            ring.style.stroke = '#f97316';
            tag.textContent = 'Focus Session';
            tag.className = 'text-[10px] font-black uppercase tracking-widest text-orange-500 transition-colors duration-300';
            
            fBtn.className = 'flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all bg-white text-slate-800 shadow-sm';
            bBtn.className = 'flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all text-slate-500 hover:text-slate-700';
            actionBtn.className = `px-4 py-1.5 ${this.isRunning ? 'bg-slate-800 hover:bg-slate-900 shadow-slate-900/20' : 'bg-orange-600 hover:bg-orange-700 shadow-orange-600/20'} text-white font-black text-[10px] uppercase tracking-wider rounded-lg shadow-md hover:shadow-lg transition flex items-center gap-1.5`;
        } else {
            root.style.borderLeftColor = '#14b8a6';
            glow.className = 'absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none transition-all duration-500';
            ring.style.stroke = '#14b8a6';
            tag.textContent = 'Short Break';
            tag.className = 'text-[10px] font-black uppercase tracking-widest text-teal-500 transition-colors duration-300';
            
            fBtn.className = 'flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all text-slate-500 hover:text-slate-700';
            bBtn.className = 'flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all bg-white text-slate-800 shadow-sm';
            actionBtn.className = `px-4 py-1.5 ${this.isRunning ? 'bg-slate-800 hover:bg-slate-900 shadow-slate-900/20' : 'bg-teal-600 hover:bg-teal-700 shadow-teal-600/20'} text-white font-black text-[10px] uppercase tracking-wider rounded-lg shadow-md hover:shadow-lg transition flex items-center gap-1.5`;
        }
    }

    static playChime() {
        try {
            const actx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = actx.createOscillator();
            const gain = actx.createGain();
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, actx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(440, actx.currentTime + 0.7);
            
            gain.gain.setValueAtTime(0.25, actx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + 0.9);
            
            osc.connect(gain);
            gain.connect(actx.destination);
            osc.start();
            osc.stop(actx.currentTime + 0.9);
        } catch(ex) { }
    }

    static dispatchAlert(offline = false) {
        const head = this.currentMode === 'focus' ? '🔥 Focus Complete!' : '🍃 Break Concluded!';
        const msg = this.currentMode === 'focus' 
            ? 'Exceptional learning commitment! Take a 5-minute physical break.' 
            : 'Time to jump back into the curriculum! Ready for your next slot?';

        const displayTitle = offline ? `${head} (While Away)` : head;

        if (typeof UI !== 'undefined' && typeof UI.showToast === 'function') {
            UI.showToast('⏰ ' + head, 'info');
        }

        if ("Notification" in window && Notification.permission === "granted") {
            new Notification(displayTitle, {
                body: msg,
                icon: '/favicon.ico'
            });
        }
    }
}

// Window level global handles for HTML events compatibility
window.setPomodoroMode = (m) => GlobalPomodoro.setMode(m);
window.togglePomodoro = () => GlobalPomodoro.toggle();
window.resetPomodoro = () => GlobalPomodoro.reset();