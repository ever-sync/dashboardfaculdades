const https = require('https');

const API_URL = 'https://api.eversync.com.br';
const API_KEY = 'B6D711FCDE4D4FD5936544120E713976'; // Key from previous context
const INSTANCE_NAME = 'teste'; // Instance name from user screenshot

function makeRequest(path, method = 'GET') {
    return new Promise((resolve, reject) => {
        const url = new URL(API_URL + path);
        const options = {
            hostname: url.hostname,
            path: url.pathname + url.search,
            method: method,
            headers: {
                'apikey': API_KEY,
                'Content-Type': 'application/json'
            }
        };

        console.log(`Requesting: ${method} ${API_URL}${path}`);

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                console.log(`Status: ${res.statusCode}`);
                try {
                    const json = JSON.parse(data);
                    console.log('Response:', JSON.stringify(json, null, 2));
                    resolve(json);
                } catch (e) {
                    console.log('Raw Response:', data);
                    resolve(data);
                }
            });
        });

        req.on('error', (e) => {
            console.error('Error:', e);
            reject(e);
        });

        req.end();
    });
}

async function test() {
    try {
        // 1. List instances
        console.log('\n--- Listing Instances ---');
        await makeRequest('/instance/fetchInstances');

        // 2. Connect (Get QR Code)
        console.log(`\n--- Getting QR Code for ${INSTANCE_NAME} ---`);
        await makeRequest(`/instance/connect/${INSTANCE_NAME}`);

    } catch (error) {
        console.error('Test failed:', error);
    }
}

test();
