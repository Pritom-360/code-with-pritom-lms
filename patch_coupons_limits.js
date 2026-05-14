const db = require('./db');
(async () => {
    try {
        console.log('Checking and patching coupons table schema for limits...');
        
        // 1. Add usage_limit
        try {
            await db.query('ALTER TABLE coupons ADD COLUMN usage_limit INT DEFAULT NULL');
            console.log('✅ Added usage_limit column.');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME' || e.message.includes('Duplicate column name')) {
                console.log('💡 Column usage_limit already exists.');
            } else {
                throw e;
            }
        }

        // 2. Add usage_count
        try {
            await db.query('ALTER TABLE coupons ADD COLUMN usage_count INT DEFAULT 0');
            console.log('✅ Added usage_count column.');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME' || e.message.includes('Duplicate column name')) {
                console.log('💡 Column usage_count already exists.');
            } else {
                throw e;
            }
        }

        // 3. Add discount_type
        try {
            await db.query("ALTER TABLE coupons ADD COLUMN discount_type ENUM('percentage', 'fixed') DEFAULT 'percentage'");
            console.log('✅ Added discount_type column.');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME' || e.message.includes('Duplicate column name')) {
                console.log('💡 Column discount_type already exists.');
            } else {
                throw e;
            }
        }

        // 4. Add discount_value
        try {
            await db.query('ALTER TABLE coupons ADD COLUMN discount_value DECIMAL(10, 2) DEFAULT 0.00');
            console.log('✅ Added discount_value column.');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME' || e.message.includes('Duplicate column name')) {
                console.log('💡 Column discount_value already exists.');
            } else {
                throw e;
            }
        }

        console.log('✅ SUCCESS: Coupons usage & type verification complete!');
    } catch(e) {
        console.error('❌ ERROR applying schema alteration:', e.message);
    }
    process.exit(0);
})();
