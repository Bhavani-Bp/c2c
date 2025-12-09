
const axios = require('axios');

async function testPlay() {
    const videoId = 'dQw4w9WgXcQ'; // Rick Roll (safe test)
    const port = process.env.PORT || 3001;
    const url = `http://localhost:${port}/api/play?id=${videoId}`;

    console.log(`Testing Play API: ${url}`);

    try {
        const response = await axios.get(url);
        if (response.data.success && response.data.streamUrl) {
            console.log('✅ Play Test Passed!');
            console.log('Title:', response.data.title);
            console.log('Stream URL:', response.data.streamUrl.substring(0, 50) + '...');
        } else {
            console.log('❌ Play Test Failed: Success false or no streamUrl');
            console.log('Response:', response.data);
        }
    } catch (error) {
        console.log('❌ Play Test Failed: Error calling API');
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Data:', error.response.data);
        } else {
            console.log('Error:', error.message);
        }
    }
}

testPlay();
