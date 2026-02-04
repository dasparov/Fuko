const { sql } = require('@vercel/postgres');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

async function main() {
    try {
        console.log('Creating "orders" table...');
        await sql`
      CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(255) PRIMARY KEY,
        date VARCHAR(255) NOT NULL,
        status VARCHAR(50) NOT NULL,
        total INTEGER NOT NULL,
        items JSONB NOT NULL,
        customer_name VARCHAR(255),
        customer_phone VARCHAR(20),
        delivery_address JSONB,
        payment_screenshot TEXT,
        is_payment_verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
        console.log('Created "orders" table.');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
}

main();
