
const fetch = require('node-fetch');

async function checkMediaApi() {
    try {
        const res = await fetch('http://localhost:3000/api/media');
        if (!res.ok) {
            console.error(`Status: ${res.status}`);
            console.error(`StatusText: ${res.statusText}`);
            const text = await res.text();
            console.error(`Body: ${text}`);
            return;
        }
        const data = await res.json();
        console.log('API Response:', JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Fetch error:', error);
    }
}

checkMediaApi();
