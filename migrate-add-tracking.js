// Migration script to add tracking_id column to orders table.
// The admin types a courier tracking number on a shipped order; the WhatsApp
// status update includes it when present. Nullable — most orders never get one.
require('dotenv').config({ path: '.env.local' });
const { sql } = require('@vercel/postgres');

async function migrate() {
    try {
        console.log('Adding tracking_id column to orders table...');

        await sql`
            ALTER TABLE orders
            ADD COLUMN IF NOT EXISTS tracking_id TEXT
        `;

        console.log('✅ Migration completed successfully!');
        console.log('tracking_id column added to orders table.');
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }

    process.exit(0);
}

migrate();
