/* ==============================================================
   patch_broadcast.js — Super Broadcast DB Migration Service
   ============================================================== */
const mysql = require('mysql2/promise');
require('dotenv').config();

const runPatch = async () => {
    console.log('🚀 Starting Broadcast & Notifications Migration Service...');

    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'cwp_lms',
        port: parseInt(process.env.DB_PORT || '3306')
    });

    try {
        console.log('🔄 Creating Announcements Ledger...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS \`announcements\` (
                \`id\` INT AUTO_INCREMENT PRIMARY KEY,
                \`title\` VARCHAR(255) NOT NULL,
                \`content\` TEXT NOT NULL,
                \`image_url\` VARCHAR(255) DEFAULT NULL,
                \`start_date\` DATETIME NOT NULL,
                \`end_date\` DATETIME NOT NULL,
                \`is_active\` BOOLEAN NOT NULL DEFAULT TRUE,
                \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
        console.log('✅ Announcements Ledger Live.');

        console.log('🔄 Creating User Notifications Bucket...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS \`notifications\` (
                \`id\` INT AUTO_INCREMENT PRIMARY KEY,
                \`user_email\` VARCHAR(255) NOT NULL,
                \`type\` VARCHAR(50) DEFAULT 'broadcast',
                \`title\` VARCHAR(255) NOT NULL,
                \`message\` TEXT NOT NULL,
                \`is_read\` BOOLEAN DEFAULT FALSE,
                \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX \`idx_user_email\` (\`user_email\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
        console.log('✅ User Notifications Bucket Live.');

        console.log('\n🎉 Database physical tables successfully provisioned for Super Broadcast system!');
    } catch (err) {
        console.error('❌ Error instantiating tables:', err.message);
    } finally {
        await connection.end();
    }
};

runPatch();
