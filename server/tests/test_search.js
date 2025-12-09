
require('dotenv').config();
const axios = require('axios');

async function testSearch() {
    const query = 'hello';
    const port = process.env.PORT || 3001;
    const url = `http://localhost:${port}/api/search?query=${query}`;

    console.log(`Testing Search API: ${url}`);

    try {
        const response = await axios.get(url);
        if (response.data.success && response.data.videos.length > 0) {
            console.log('✅ Search Test Passed!');
            console.log(`Found ${response.data.videos.length} videos.`);
            console.log('First video:', response.data.videos[0].title);
        } else {
            console.log('❌ Search Test Failed: No videos found or success false');
            console.log('Response:', response.data);
        }
    } catch (error) {
        console.log('❌ Search Test Failed: Error calling API');
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Data:', error.response.data);
        } else {
            console.log('Error:', error.message);
        }
    }
}

testSearch();
