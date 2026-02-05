// Quick test script to verify KV connection
require('dotenv').config({ path: '.env.local' });
const { kv } = require('@vercel/kv');

async function testKV() {
    try {
        console.log('Testing KV connection...');

        // Try to read current settings
        const settings = await kv.get('site_settings');
        console.log('Current settings:', JSON.stringify(settings, null, 2));

        // Try to write test data
        const testData = { test: 'value', timestamp: Date.now() };
        await kv.set('test_key', testData);
        console.log('Write test successful');

        // Try to read it back
        const readBack = await kv.get('test_key');
        console.log('Read back:', readBack);

        console.log('✅ KV connection working!');
    } catch (error) {
        console.error('❌ KV Error:', error);
    }
}

testKV();
