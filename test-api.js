#!/usr/bin/env node

const https = require('https');
const http = require('http');

async function testApiEndpoint() {
    console.log('🌐 Testing API endpoint...');

    // Replace with your actual Railway backend URL
    const apiUrl = process.env.API_URL || 'https://your-railway-backend-url.railway.app';
    const loginEndpoint = `${apiUrl}/auth/login`;

    console.log(`🔗 Testing endpoint: ${loginEndpoint}`);

    const loginData = {
        email: 'admin@swrfph.com',
        password: 'admin123'
    };

    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    };

    try {
        const response = await makeRequest(loginEndpoint, options, JSON.stringify(loginData));
        console.log('✅ API Response Status:', response.statusCode);
        console.log('📄 Response Headers:', response.headers);

        let body = '';
        response.on('data', (chunk) => {
            body += chunk;
        });

        response.on('end', () => {
            console.log('📝 Response Body:', body);

            if (response.statusCode === 200) {
                console.log('✅ Login API is working correctly!');
            } else if (response.statusCode === 401) {
                console.log('❌ Unauthorized - check credentials or CORS');
            } else if (response.statusCode === 404) {
                console.log('❌ Endpoint not found - check API URL');
            } else {
                console.log(`⚠️  Unexpected status code: ${response.statusCode}`);
            }
        });

    } catch (error) {
        console.error('❌ API Test Error:', error.message);

        if (error.code === 'ENOTFOUND') {
            console.log('🔧 Fix: Check your Railway backend URL');
            console.log('Make sure the backend is deployed and running');
        } else if (error.code === 'ECONNREFUSED') {
            console.log('🔧 Fix: Backend server is not running');
            console.log('Deploy your backend to Railway first');
        }
    }
}

function makeRequest(url, options, data) {
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https') ? https : http;

        const req = client.request(url, options, (res) => {
            resolve(res);
        });

        req.on('error', reject);

        if (data) {
            req.write(data);
        }

        req.end();
    });
}

// Check if API_URL is provided
if (!process.env.API_URL) {
    console.log('⚠️  No API_URL provided. Please set your Railway backend URL:');
    console.log('API_URL=https://your-railway-backend-url.railway.app node test-api.js');
    console.log('\nOr update the script with your actual Railway backend URL.');
} else {
    testApiEndpoint();
}
