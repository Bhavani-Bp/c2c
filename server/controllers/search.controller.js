const axios = require('axios');

exports.searchVideos = async (req, res) => {
    try {
        const { query } = req.query;

        if (!query) {
            return res.status(400).json({
                success: false,
                error: 'Query parameter is required'
            });
        }

        if (!process.env.YOUTUBE_API_KEY) {
            console.error('❌ YOUTUBE_API_KEY is missing in environment variables');
            return res.status(500).json({
                success: false,
                error: 'Server configuration error: YouTube API key missing'
            });
        }

        console.log(`🔍 Searching YouTube for: "${query}"`);

        const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
            params: {
                part: 'snippet',
                maxResults: 20,
                q: query,
                type: 'video',
                key: process.env.YOUTUBE_API_KEY
            }
        });

        const videos = response.data.items.map(item => ({
            videoId: item.id.videoId,
            title: item.snippet.title,
            description: item.snippet.description,
            thumbnail: item.snippet.thumbnails.medium.url,
            channel: item.snippet.channelTitle,
            publishedAt: item.snippet.publishedAt
        }));

        console.log(`✅ Found ${videos.length} videos for "${query}"`);

        res.json({
            success: true,
            videos
        });

    } catch (error) {
        console.error('❌ YouTube Search Error:', error.response?.data || error.message);

        // Handle quota exceeded or other API errors
        if (error.response?.status === 403) {
            return res.status(503).json({
                success: false,
                error: 'Search service temporarily unavailable (Quota Exceeded)'
            });
        }

        res.status(500).json({
            success: false,
            error: 'Failed to fetch search results'
        });
    }
};
