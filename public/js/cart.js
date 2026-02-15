/**
 * Code With Pritom — Shopping Cart & Checkout Logic
 */

const Cart = {
    state: {
        items: [],
        promoCode: null,
        step: 1,
        billing: {},
        payment: {}
    },

    init() {
        this.loadCart();
        this.updateUI();
    },

    loadCart() {
        const savedCart = localStorage.getItem('cwp_cart');
        if (savedCart) this.state.items = JSON.parse(savedCart);
        // Ensure single item restriction even on load
        if (this.state.items.length > 1) {
            this.state.items = [this.state.items[0]];
            this.saveCart();
        }
    },

    saveCart() {
        localStorage.setItem('cwp_cart', JSON.stringify(this.state.items));
        this.updateUI();
    },

    // Flexible Add Method
    add(id, title, price, image = null) {
        // Handle object passed as first arg
        if (typeof id === 'object') {
            const course = id;
            id = course.id;
            title = course.title;
            price = course.price;
            image = course.image;
        }

        // CRITICAL BUG FIX: Restricted to ONE item only.
        // Clear existing cart before adding new course.
        this.state.items = [];
        this.state.promoCode = null; // Reset promo code when course changes

        const priceNum = typeof price === 'string'
            ? parseFloat(price.replace('$', '').replace('৳', '').replace('TK', '').replace('Taka', '').trim())
            : price;

        this.state.items.push({
            id: id,
            title: title,
            price: priceNum,
            image: image || 'images/brand.png'
        });

        this.saveCart();
        if (window.UI) UI.showToast('Course selected for checkout', 'success');
        this.openCart();
    },

    // Alias for compatibility
    addItem(course) {
        this.add(course);
    },

    remove(id) {
        this.state.items = this.state.items.filter(item => item.id != id);
        this.saveCart();
        if (this.state.items.length === 0) this.closeCheckout();
    },

    clear() {
        this.state.items = [];
        this.state.promoCode = null;
        this.saveCart();
    },

    getSubtotal() {
        return this.state.items.reduce((sum, item) => sum + item.price, 0);
    },

    getDiscountAmount() {
        if (!this.state.promoCode) return 0;
        const subtotal = this.getSubtotal();
        if (this.state.promoCode.type === 'percent') {
            return (subtotal * this.state.promoCode.discount) / 100;
        }
        return this.state.promoCode.discount;
    },

    getTotal() {
        const total = this.getSubtotal() - this.getDiscountAmount();
        return total > 0 ? total : 0;
    },

    // Cart Panel
    openCart() {
        // If on dedicated cart page, do nothing special
        if (document.getElementById('cart-page-content')) return;

        const panel = document.getElementById('cart-panel');
        const overlay = document.getElementById('cart-overlay');

        if (panel && overlay) {
            panel.classList.add('open');
            overlay.classList.add('open');
            document.body.style.overflow = 'hidden';
            this.updateUI();
        } else {
            // Fallback: Redirect to cart page
            window.location.href = 'cart.html';
        }
    },

    closeCart() {
        const panel = document.getElementById('cart-panel');
        const overlay = document.getElementById('cart-overlay');
        if (panel) panel.classList.remove('open');
        if (overlay) overlay.classList.remove('open');
        document.body.style.overflow = '';
    },

    toggleCart() {
        const panel = document.getElementById('cart-panel');
        if (panel && panel.classList.contains('open')) {
            this.closeCart();
        } else {
            this.openCart();
        }
    },

    // Checkout Flow (Redirect System)
    openCheckout() {
        this.closeCart();

        if (this.state.items.length === 0) {
            if (window.UI) UI.showToast('Your cart is empty', 'error');
            return;
        }

        // If on cart page, just switch step (handled locally or allow reload)
        if (window.location.href.includes('cart.html')) {
            this.setStep(2);
            return;
        }

        // Redirect to dedicated checkout page, start at billing
        window.location.href = 'cart.html?step=2';
    },

    closeCheckout() {
        // Just return to dashboard or previous step
        if (window.location.href.includes('cart.html')) {
            if (this.state.step > 1) {
                this.setStep(1);
            } else {
                window.location.href = 'dashboard.html';
            }
        }
    },

    setStep(step) {
        if (step > this.state.step) {
            if (this.state.step === 2 && !this.validateBilling()) return;
        }
        this.state.step = step;
        this.updateCheckoutUI();
    },

    updateCheckoutUI() {
        document.querySelectorAll('.checkout-section').forEach(el => el.classList.remove('active'));
        const activeSection = document.getElementById(`checkout-step-${this.state.step}`);
        if (activeSection) activeSection.classList.add('active');

        document.querySelectorAll('.checkout-step').forEach((el, index) => {
            const stepNum = index + 1;
            el.classList.remove('active', 'completed');
            if (stepNum < this.state.step) el.classList.add('completed');
            if (stepNum === this.state.step) el.classList.add('active');
        });
    },

    validateBilling() {
        const reqFields = ['bill-name', 'bill-phone', 'bill-email', 'bill-address'];
        let valid = true;
        reqFields.forEach(id => {
            const el = document.getElementById(id);
            if (el && !el.value) {
                el.classList.add('border-red-500');
                valid = false;
            } else if (el) {
                el.classList.remove('border-red-500');
            }
        });

        if (!valid && window.UI) UI.showToast('Please fill all required fields', 'error');

        if (valid) {
            this.state.billing = {
                name: document.getElementById('bill-name').value,
                email: document.getElementById('bill-email').value,
                phone: document.getElementById('bill-phone').value,
                address: document.getElementById('bill-address').value
            };
        }
        return valid;
    },

    async applyPromo() {
        const codeInput = document.getElementById('promo-code-input');
        const code = codeInput ? codeInput.value.trim() : '';
        const feedbackEl = document.getElementById('promo-feedback');
        const applyBtn = codeInput ? codeInput.nextElementSibling || document.querySelector('[onclick="Cart.applyPromo()"]') : null;

        if (!code) {
            if (window.UI) UI.showToast('Please enter a coupon code.', 'error');
            return;
        }

        // Determine courseId from cart items (single or first item)
        const courseId = this.state.items.length > 0 ? this.state.items[0].id : null;

        if (!courseId) {
            if (window.UI) UI.showToast('No course in cart to apply coupon to.', 'error');
            if (feedbackEl) feedbackEl.innerHTML = `<p class="text-sm text-red-500"><i class="fa-solid fa-times-circle mr-1"></i> Add a course to cart first.</p>`;
            return;
        }

        // Show loading state
        if (applyBtn) {
            applyBtn.disabled = true;
            applyBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i>';
        }
        if (feedbackEl) feedbackEl.innerHTML = `<p class="text-sm text-slate-400"><i class="fa-solid fa-circle-notch fa-spin mr-1"></i> Verifying coupon...</p>`;

        try {
            const response = await fetch(`https://arup-vivobook-asuslaptop-x509dj-d509dj.taila8249c.ts.net/webhook/verify-coupon?coupon_name=${encodeURIComponent(code)}&course_code=${encodeURIComponent(courseId)}`
            );
            const data = await response.json();

            // Normalize — API may return an array
            const result = Array.isArray(data) ? data[0] : data;

            if (result && result.valid === true && result.discount_percent !== undefined) {
                const discountPercent = parseFloat(result.discount_percent);

                if (isNaN(discountPercent) || discountPercent <= 0) {
                    if (window.UI) UI.showToast('Invalid coupon for this course.', 'error');
                    if (feedbackEl) feedbackEl.innerHTML = `<p class="text-sm text-red-500"><i class="fa-solid fa-times-circle mr-1"></i> Coupon not valid for this course.</p>`;
                    return;
                }

                // Apply discount as a percent type promo
                this.state.promoCode = {
                    code: code.toUpperCase(),
                    type: 'percent',
                    discount: discountPercent
                };

                const discountLabel = discountPercent === 100 ? 'FREE' : `${discountPercent}% off`;
                if (window.UI) UI.showToast(`Coupon applied! ${discountLabel}`, 'success');

                if (feedbackEl) {
                    feedbackEl.innerHTML = `<p class="text-sm text-green-600 font-bold"><i class="fa-solid fa-check-circle mr-1"></i> Coupon "${code.toUpperCase()}" applied — ${discountLabel}!</p>`;
                }

                this.updateCheckoutSummary();
            } else {
                // API said valid: false, or no discount
                const errorMsg = result?.message || 'Invalid or expired promo code';
                if (window.UI) UI.showToast(errorMsg, 'error');
                if (feedbackEl) feedbackEl.innerHTML = `<p class="text-sm text-red-500"><i class="fa-solid fa-times-circle mr-1"></i> ${errorMsg}</p>`;
            }
        } catch (error) {
            console.error('[Coupon] Verification failed:', error);
            if (window.UI) UI.showToast('Failed to verify coupon. Please try again.', 'error');
            if (feedbackEl) feedbackEl.innerHTML = `<p class="text-sm text-red-500"><i class="fa-solid fa-times-circle mr-1"></i> Network error. Please try again.</p>`;
        } finally {
            // Restore button
            if (applyBtn) {
                applyBtn.disabled = false;
                applyBtn.innerHTML = 'Apply';
            }
        }
    },

    copyBkash() {
        navigator.clipboard.writeText('01853343176');
        if (window.UI) UI.showToast('Copied!', 'success');
    },

    updateCheckoutSummary() {
        const sub = this.getSubtotal();
        const disc = this.getDiscountAmount();
        const total = this.getTotal();

        document.querySelectorAll('.checkout-subtotal').forEach(el => el.textContent = '৳' + sub.toFixed(2));
        document.querySelectorAll('.checkout-total').forEach(el => el.textContent = '৳' + total.toFixed(2));

        // Update discount row in checkout modal (classroom page)
        const discRow = document.getElementById('checkout-discount-row');
        if (discRow) {
            if (disc > 0) {
                discRow.classList.remove('hidden');
                document.getElementById('checkout-discount-amount').textContent = '-৳' + disc.toFixed(2);
            } else {
                discRow.classList.add('hidden');
            }
        }

        // Update discount row in cart.html sidebar
        const cartPageDiscRow = document.getElementById('cart-page-discount-row');
        if (cartPageDiscRow) {
            if (disc > 0) {
                cartPageDiscRow.classList.remove('hidden');
                const cartPageDiscAmt = document.getElementById('cart-page-discount-amount');
                if (cartPageDiscAmt) cartPageDiscAmt.textContent = '-৳' + disc.toFixed(2);
            } else {
                cartPageDiscRow.classList.add('hidden');
            }
        }

        this.handleFreeMode(total === 0);
    },

    handleFreeMode(isFree) {
        const freeSection = document.getElementById('free-order-section');
        const paidSection = document.getElementById('bkash-section');
        const submitBtn = document.getElementById('btn-place-order');

        if (freeSection && paidSection) {
            if (isFree) {
                freeSection.classList.remove('hidden');
                paidSection.classList.add('hidden');
                if (submitBtn) {
                    submitBtn.innerHTML = 'Confirm Order (Free) <i class="fa-solid fa-gift ml-2"></i>';
                    submitBtn.classList.remove('bg-green-600', 'hover:bg-green-700');
                    submitBtn.classList.add('bg-orange-600', 'hover:bg-orange-700');
                }
            } else {
                freeSection.classList.add('hidden');
                paidSection.classList.remove('hidden');
                if (submitBtn) {
                    submitBtn.innerHTML = 'Confirm Payment <i class="fa-solid fa-check ml-2"></i>';
                    submitBtn.classList.add('bg-green-600', 'hover:bg-green-700');
                    submitBtn.classList.remove('bg-orange-600', 'hover:bg-orange-700');
                }
            }
        }
    },

    updateUI() {
        const count = this.state.items.length;
        const badges = document.querySelectorAll('.cart-badge');
        badges.forEach(b => {
            b.textContent = count;
            b.style.display = count > 0 ? 'flex' : 'none';
        });

        const cartList = document.getElementById('cart-items-list');
        if (cartList) {
            cartList.innerHTML = this.state.items.map(i => `
                <div class="flex justify-between p-4 border-b">
                    <div>
                        <div class="font-bold text-sm text-slate-800">${i.title}</div>
                        <div class="text-xs text-slate-500">৳${i.price}</div>
                    </div>
                    <button onclick="Cart.remove('${i.id}')" class="text-red-500 hover:text-red-700 transition">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            `).join('');

            const subEl = document.getElementById('cart-subtotal');
            if (subEl) subEl.textContent = '৳' + this.getSubtotal().toFixed(2);
        }

        const checkList = document.getElementById('checkout-cart-list');
        if (checkList) {
            checkList.innerHTML = this.state.items.map(i => `
                <div class="flex justify-between py-2 border-b last:border-0 border-gray-100">
                    <span class="text-sm">${i.title}</span>
                    <span class="font-bold text-sm">৳${i.price}</span>
                </div>
            `).join('');
        }
    },

    async submitOrder() {
        const total = this.getTotal();
        const txn = document.getElementById('bkash-txn-input') ? document.getElementById('bkash-txn-input').value : '';

        // ===== FREE / 100% DISCOUNT BYPASS =====
        if (total === 0) {
            const btn = document.getElementById('btn-place-order');
            if (btn) {
                btn.disabled = true;
                btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin mr-2"></i> Enrolling...';
            }

            try {
                const userEmail = this.state.billing?.email ||
                    document.getElementById('bill-email')?.value ||
                    (window.Auth ? Auth.getUser()?.email : null);

                const courseItems = this.state.items;

                if (!userEmail) {
                    if (window.UI) UI.showToast('Email is required for enrollment.', 'error');
                    if (btn) { btn.disabled = false; btn.innerHTML = 'Confirm Order (Free) <i class="fa-solid fa-gift ml-2"></i>'; }
                    return;
                }

                let allSuccess = true;
                for (const item of courseItems) {
                    try {
                        const response = await fetch('https://arup-vivobook-asuslaptop-x509dj-d509dj.taila8249c.ts.net/webhook/grant-free-access', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                email: userEmail,
                                course_code: item.id
                            })
                        });

                        if (!response.ok) {
                            console.error(`[Free Access] Failed for course ${item.id}:`, response.status);
                            allSuccess = false;
                        }
                    } catch (err) {
                        console.error(`[Free Access] Error granting access for ${item.id}:`, err);
                        allSuccess = false;
                    }
                }

                if (allSuccess) {
                    this.clear();
                    if (window.UI) UI.showToast('🎉 Enrollment Successful! Redirecting...', 'success');
                    alert('🎉 Enrollment Successful!\nYou now have access to your course.');

                    const firstCourseId = courseItems[0]?.id;
                    if (firstCourseId) {
                        window.location.href = `classroom.html?course_id=${firstCourseId}`;
                    } else {
                        window.location.href = 'dashboard.html';
                    }
                } else {
                    if (window.UI) UI.showToast('Some enrollments failed. Please contact support.', 'error');
                    if (btn) { btn.disabled = false; btn.innerHTML = 'Confirm Order (Free) <i class="fa-solid fa-gift ml-2"></i>'; }
                }
            } catch (e) {
                console.error('[Free Access] Submit error:', e);
                if (window.UI) UI.showToast('Enrollment failed. Please try again.', 'error');
                const btn = document.getElementById('btn-place-order');
                if (btn) { btn.disabled = false; btn.innerHTML = 'Confirm Order (Free) <i class="fa-solid fa-gift ml-2"></i>'; }
            }
            return;
        }

        // ===== PAID FLOW (bKash) — Manual Verification =====
        if (total > 0 && !txn) {
            if (window.UI) UI.showToast('Please enter Transaction ID', 'error');
            return;
        }

        const btn = document.getElementById('btn-place-order');
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i> Submitting...';
        }

        try {
            const userEmail = this.state.billing?.email || document.getElementById('bill-email')?.value || (window.Auth ? Auth.getUser()?.email : '');
            const userName = this.state.billing?.name || document.getElementById('bill-name')?.value || (window.Auth ? Auth.getUser()?.name : '');

            const payload = {
                email: userEmail,
                name: userName,
                course_id: this.state.items.map(i => i.id).join(','),
                transaction_id: txn,
                amount: total,
                promo_code: this.state.promoCode ? this.state.promoCode.code : '',
                items: this.state.items
            };

            await fetch('https://arup-vivobook-asuslaptop-x509dj-d509dj.taila8249c.ts.net/webhook/submit-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            this.clear();
            if (window.UI) UI.showToast('Payment submitted! Pending admin verification.', 'success');

            alert('Payment submitted successfully!\nPlease wait up to 24 hours for manual verification by the admin.');
            window.location.href = 'dashboard.html';

        } catch (e) {
            if (window.UI) UI.showToast('Submission failed. Check connection.', 'error');
            console.error('[Checkout] Submit error:', e);
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = 'Confirm Payment <i class="fa-solid fa-check ml-2"></i>';
            }
        }
    }
};

document.addEventListener('DOMContentLoaded', () => Cart.init());
