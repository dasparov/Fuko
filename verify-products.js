// Verify products have weight
require('dotenv').config({ path: '.env.local' });
const { sql } = require('@vercel/postgres');

async function verify() {
    try {
        const { rows } = await sql`SELECT id, name, weight FROM products`;
        console.log('Current products with weight:');
        console.table(rows);
    } catch (error) {
        console.error('Error:', error);
    }
    process.exit(0);
}

verify();
