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

        if (this.state.items.find(item => item.id == id)) {
            if (window.UI) UI.showToast('Course already in cart!', 'info');
            this.openCart();
            return;
        }

        const priceNum = typeof price === 'string' ? parseFloat(price.replace('$', '')) : price;

        this.state.items.push({
            id: id,
            title: title,
            price: priceNum,
            image: image || 'images/brand.png'
        });

        this.saveCart();
        if (window.UI) UI.showToast('Added to cart', 'success');
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

    // ... (rest of logic: validateBilling, applyPromo, submitOrder, updateUI) ...
    // Using abbreviated version to save tokens but implementing key parts:

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
        const code = document.getElementById('promo-code-input').value;
        if (!code) return;

        try {
            const res = await fetch(`/api/promo-codes?code=${code}`);
            const data = await res.json();
            if (data.success) {
                this.state.promoCode = data.promo;
                if (window.UI) UI.showToast(`Applied ${data.promo.code}`, 'success');
                this.updateCheckoutSummary();
            } else {
                if (window.UI) UI.showToast(data.message, 'error');
            }
        } catch (e) {
            console.error(e);
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

        document.querySelectorAll('.checkout-subtotal').forEach(el => el.textContent = '$' + sub.toFixed(2));
        document.querySelectorAll('.checkout-total').forEach(el => el.textContent = '$' + total.toFixed(2));

        const discRow = document.getElementById('checkout-discount-row');
        if (discRow) {
            if (disc > 0) {
                discRow.classList.remove('hidden');
                document.getElementById('checkout-discount-amount').textContent = '-$' + disc.toFixed(2);
            } else {
                discRow.classList.add('hidden');
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
                    submitBtn.classList.remove('bg-green-600', 'hover:bg-green-700'); // Optional styling tweak
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
                        <div class="font-bold text-sm">${i.title}</div>
                        <div class="text-xs text-gray-500">$${i.price}</div>
                    </div>
                    <button onclick="Cart.remove('${i.id}')" class="text-red-500"><i class="fa-solid fa-trash"></i></button>
                </div>
            `).join('');

            const subEl = document.getElementById('cart-subtotal');
            if (subEl) subEl.textContent = '$' + this.getSubtotal().toFixed(2);
        }

        const checkList = document.getElementById('checkout-cart-list');
        if (checkList) {
            checkList.innerHTML = this.state.items.map(i => `
                <div class="flex justify-between py-2 border-b last:border-0 border-gray-100">
                    <span class="text-sm">${i.title}</span>
                    <span class="font-bold text-sm">$${i.price}</span>
                </div>
            `).join('');
        }
    },

    async submitOrder() {
        const total = this.getTotal();
        const txn = document.getElementById('bkash-txn-input') ? document.getElementById('bkash-txn-input').value : '';

        if (total > 0 && !txn) {
            if (window.UI) UI.showToast('Please enter Transaction ID', 'error');
            return;
        }

        const btn = document.getElementById('btn-place-order');
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = 'Processing...';
        }

        try {
            const payload = {
                action: 'checkout',
                items: this.state.items,
                billing: this.state.billing,
                payment: {
                    method: total === 0 ? 'free' : 'bkash',
                    txnId: total === 0 ? 'FREE-ORDER' : txn,
                    total: total
                }
            };

            await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            this.setStep(4);
            this.clear();
            const orderIdEl = document.getElementById('conf-order-id');
            if (orderIdEl) orderIdEl.textContent = 'ORD-' + Date.now();

        } catch (e) {
            if (window.UI) UI.showToast('Submission failed', 'error');
            console.error(e);
        } finally {
            if (btn) btn.disabled = false;
        }
    }
};

document.addEventListener('DOMContentLoaded', () => Cart.init());
