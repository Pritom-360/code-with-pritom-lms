/* ============================================
   Auth Class — Authentication Controller
   ============================================ */
class Auth {
    static API_URL = '/api/auth';

    /* ---- Session Helpers ---- */
    static isLoggedIn() {
        return !!localStorage.getItem('user');
    }

    static getUser() {
        try {
            return JSON.parse(localStorage.getItem('user'));
        } catch {
            return null;
        }
    }

    static setUser(userData) {
        localStorage.setItem('user', JSON.stringify(userData));
    }

    /* ---- Core Auth Request ---- */
    static async authenticate(payload, buttonId) {
        UI.toggleLoading(buttonId, true);

        try {
            const response = await fetch(this.API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            // 1. Intercept Active OTP Verification Gateways
            if (data.requiresVerification) {
                UI.showToast(data.message, 'info');
                if (typeof window.openOtpModal === 'function') {
                    window.openOtpModal(data.email);
                }
                return; // Block default redirection routines
            }

            if (data.success) {
                localStorage.setItem('user', JSON.stringify(data.user)); // role সহ পুরো অবজেক্ট সেভ করবে
                console.log('Logged in user role:', data.user.role); // ডিবাগ করার জন্য
                if (data.user.role === 'admin') {
                    window.location.href = 'admin.html';
                } else {
                    window.location.href = 'dashboard.html';
                }
            } else {
                throw new Error(data.message || 'Something went wrong');
            }
        } catch (error) {
            UI.showToast(error.message || 'Network error. Please try again.', 'error');
        } finally {
            UI.toggleLoading(buttonId, false);
        }
    }

    /* ---- Background Sync (Silent) — Once Per Day ---- */
    static async syncSessionSilently() {
        const user = this.getUser();
        if (!user) return;

        // Check if sync was done today
        const lastSyncKey = 'cwp-last-sync';
        const lastSyncDate = localStorage.getItem(lastSyncKey);
        const today = new Date().toDateString();

        if (lastSyncDate === today) {
            // Already synced today, skip
            console.log('[Auth] Already synced today. Skipping...');
            return;
        }

        try {
            console.log('[Auth] Running daily sync...');
            const response = await fetch(this.API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'sync', email: user.email })
            });

            const data = await response.json();

            if (data.success && data.user) {
                const localAccess = (user.access || '').toString();
                const remoteAccess = (data.user.access || '').toString();
                const localRole = user.role || '';
                const remoteRole = data.user.role || '';

                if (localAccess !== remoteAccess || localRole !== remoteRole) {
                    console.log('[Auth] Account state drift detected. Updating local user session...');
                    this.setUser(data.user);

                    // Mark sync as done for today
                    localStorage.setItem(lastSyncKey, today);

                    // Dispatch event so any page can react
                    window.dispatchEvent(new CustomEvent('access-updated', { detail: data.user }));

                    // Re-render courses if the function exists
                    if (typeof window.renderCourses === 'function') {
                        window.renderCourses();
                    }
                    UI.showToast('🎉 New course unlocked! Refreshing...', 'success');
                } else {
                    // Mark sync as done for today even if no changes
                    localStorage.setItem(lastSyncKey, today);
                }
            }
        } catch (e) {
            console.log('[Auth] Sync failed silently:', e.message);
        }
    }

    /* ---- Logout ---- */
    static logout() {
        localStorage.removeItem('user');
        window.location.href = 'index.html';
    }

    /* ---- Form Validation ---- */
    static validateEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    static validatePassword(password) {
        return password.length >= 6;
    }

    static validateName(name) {
        return name.trim().length >= 2;
    }
}