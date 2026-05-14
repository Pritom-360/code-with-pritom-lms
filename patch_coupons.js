const db = require('./db');
(async () => {
    try {
        console.log('Checking and patching coupons table schema...');
        
        // 1. Add expires_at
        try {
            await db.query('ALTER TABLE coupons ADD COLUMN expires_at DATETIME DEFAULT NULL');
            console.log('✅ Added expires_at column.');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME' || e.message.includes('Duplicate column name')) {
                console.log('💡 Column expires_at already exists.');
            } else {
                throw e;
            }
        }

        // 2. Add min_purchase
        try {
            await db.query('ALTER TABLE coupons ADD COLUMN min_purchase DECIMAL(10, 2) DEFAULT 0.00');
            console.log('✅ Added min_purchase column.');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME' || e.message.includes('Duplicate column name')) {
                console.log('💡 Column min_purchase already exists.');
            } else {
                throw e;
            }
        }

        console.log('✅ SUCCESS: Coupons schema verification complete!');
    } catch(e) {
        console.error('❌ ERROR applying schema alteration:', e.message);
    }
    process.exit(0);
})();
