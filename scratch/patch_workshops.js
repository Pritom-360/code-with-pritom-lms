const db = require('./db');
(async () => {
    try {
        console.log('Checking and patching workshops table schema...');
        await db.query('ALTER TABLE workshops ADD COLUMN recording_url VARCHAR(500) DEFAULT NULL');
        console.log('✅ SUCCESS: Column recording_url successfully appended to workshops table.');
    } catch(e) {
        if (e.code === 'ER_DUP_FIELDNAME') {
            console.log('💡 INFO: Column recording_url already exists. Skipping.');
        } else {
            console.error('❌ ERROR applying schema alteration:', e.message);
        }
    }
    process.exit(0);
})();
