// Migration script to add weight column to products table
require('dotenv').config({ path: '.env.local' });
const { sql } = require('@vercel/postgres');

async function migrate() {
    try {
        console.log('Adding weight column to products table...');

        // Add weight column if it doesn't exist
        await sql`
            ALTER TABLE products 
            ADD COLUMN IF NOT EXISTS weight TEXT
        `;

        console.log('✅ Migration completed successfully!');
        console.log('Weight column added to products table.');

        // Optional: Set default weight for existing products
        const updateResult = await sql`
            UPDATE products 
            SET weight = '40g' 
            WHERE weight IS NULL
        `;

        console.log(`✅ Updated ${updateResult.rowCount} existing products with default weight '40g'`);

    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }

    process.exit(0);
}

migrate();
