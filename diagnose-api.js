#!/usr/bin/env node

const https = require('https');
const http = require('http');

async function diagnoseApi() {
    console.log('🔍 API Diagnosis Tool');
    console.log('====================');

    // Get the API URL from environment or prompt user
    const apiUrl = process.env.API_URL || process.argv[2];

    if (!apiUrl) {
        console.log('❌ No API URL provided');
        console.log('Usage: node diagnose-api.js <your-railway-backend-url>');
        console.log('Example: node diagnose-api.js https://your-app.railway.app');
        console.log('\nOr set API_URL environment variable:');
        console.log('API_URL=https://your-app.railway.app node diagnose-api.js');
        return;
    }

    console.log(`🔗 Testing API: ${apiUrl}`);

    // Test 1: Health check
    console.log('\n1️⃣ Testing health endpoint...');
    await testEndpoint(`${apiUrl}/health`, 'GET');

    // Test 2: API docs
    console.log('\n2️⃣ Testing API docs...');
    await testEndpoint(`${apiUrl}/docs`, 'GET');

    // Test 3: Login endpoint
    console.log('\n3️⃣ Testing login endpoint...');
    await testLogin(`${apiUrl}/auth/login`);

    // Test 4: CORS preflight
    console.log('\n4️⃣ Testing CORS preflight...');
    await testCors(`${apiUrl}/auth/login`);
}

async function testEndpoint(url, method = 'GET') {
    try {
        const response = await makeRequest(url, { method });
        console.log(`✅ ${method} ${url} - Status: ${response.statusCode}`);

        if (response.statusCode === 200) {
            console.log('   📄 Response received successfully');
        } else if (response.statusCode === 404) {
            console.log('   ⚠️  Endpoint not found (might be normal for some endpoints)');
        } else {
            console.log(`   ⚠️  Unexpected status: ${response.statusCode}`);
        }

        // Log CORS headers
        const corsHeaders = {
            'Access-Control-Allow-Origin': response.headers['access-control-allow-origin'],
            'Access-Control-Allow-Methods': response.headers['access-control-allow-methods'],
            'Access-Control-Allow-Headers': response.headers['access-control-allow-headers'],
            'Access-Control-Allow-Credentials': response.headers['access-control-allow-credentials']
        };

        console.log('   🌐 CORS Headers:');
        Object.entries(corsHeaders).forEach(([key, value]) => {
            console.log(`      ${key}: ${value || 'Not set'}`);
        });

    } catch (error) {
        console.log(`❌ ${method} ${url} - Error: ${error.message}`);

        if (error.code === 'ENOTFOUND') {
            console.log('   🔧 Fix: Check your Railway backend URL');
        } else if (error.code === 'ECONNREFUSED') {
            console.log('   🔧 Fix: Backend server is not running');
        } else if (error.code === 'CERT_HAS_EXPIRED') {
            console.log('   🔧 Fix: SSL certificate issue');
        }
    }
}

async function testLogin(loginUrl) {
    const loginData = {
        email: 'admin@swrfph.com',
        password: 'admin123'
    };

    try {
        const response = await makeRequest(loginUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        }, JSON.stringify(loginData));

        console.log(`📊 Login Response Status: ${response.statusCode}`);

        let body = '';
        response.on('data', (chunk) => {
            body += chunk;
        });

        response.on('end', () => {
            console.log(`📝 Login Response Body: ${body}`);

            if (response.statusCode === 200) {
                console.log('✅ Login successful!');
                try {
                    const data = JSON.parse(body);
                    if (data.access_token) {
                        console.log('✅ Access token received');
                    } else {
                        console.log('⚠️  No access token in response');
                    }
                } catch (e) {
                    console.log('⚠️  Could not parse response as JSON');
                }
            } else if (response.statusCode === 401) {
                console.log('❌ Unauthorized - credentials issue');
            } else if (response.statusCode === 404) {
                console.log('❌ Endpoint not found');
            } else if (response.statusCode === 500) {
                console.log('❌ Server error');
            } else {
                console.log(`⚠️  Unexpected status: ${response.statusCode}`);
            }
        });

    } catch (error) {
        console.log(`❌ Login test failed: ${error.message}`);
    }
}

async function testCors(url) {
    try {
        const response = await makeRequest(url, {
            method: 'OPTIONS',
            headers: {
                'Origin': 'https://your-admin.netlify.app',
                'Access-Control-Request-Method': 'POST',
                'Access-Control-Request-Headers': 'Content-Type'
            }
        });

        console.log(`📊 CORS Preflight Status: ${response.statusCode}`);

        const corsHeaders = {
            'Access-Control-Allow-Origin': response.headers['access-control-allow-origin'],
            'Access-Control-Allow-Methods': response.headers['access-control-allow-methods'],
            'Access-Control-Allow-Headers': response.headers['access-control-allow-headers'],
            'Access-Control-Allow-Credentials': response.headers['access-control-allow-credentials']
        };

        console.log('🌐 CORS Preflight Headers:');
        Object.entries(corsHeaders).forEach(([key, value]) => {
            console.log(`   ${key}: ${value || 'Not set'}`);
        });

        if (response.statusCode === 200 && corsHeaders['Access-Control-Allow-Origin']) {
            console.log('✅ CORS preflight successful');
        } else {
            console.log('❌ CORS preflight failed');
        }

    } catch (error) {
        console.log(`❌ CORS test failed: ${error.message}`);
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

diagnoseApi();
