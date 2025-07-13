const axios = require('axios');

class YouTubeService {
  constructor() {
    this.apiKey = process.env.YOUTUBE_API_KEY;
    this.channelId = process.env.YOUTUBE_CHANNEL_ID;
    this.baseUrl = 'https://www.googleapis.com/youtube/v3';
  }

  async searchYouTubeVideos(query, maxResults = 10) {
    if (!this.apiKey) {
      throw new Error('YouTube API key not configured');
    }

    try {
      const url = `${this.baseUrl}/search`;
      const params = {
        part: 'snippet',
        channelId: this.channelId,
        q: query,
        type: 'video',
        key: this.apiKey,
        maxResults: Math.min(maxResults, 50)
      };

      const response = await axios.get(url, { params });
      const videos = [];

      if (response.data.items) {
        response.data.items.forEach(item => {
          if (item.id.kind === 'youtube#video') {
            videos.push({
              title: item.snippet.title,
              description: item.snippet.description,
              thumbnail: {
                default: item.snippet.thumbnails.default?.url,
                medium: item.snippet.thumbnails.medium?.url,
                high: item.snippet.thumbnails.high?.url
              },
              videoId: item.id.videoId,
              url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
              publishedAt: item.snippet.publishedAt,
              channelTitle: item.snippet.channelTitle
            });
          }
        });
      }

      return videos;
    } catch (error) {
      console.error('YouTube API error:', error.response?.data || error.message);
      throw new Error('Failed to search YouTube videos: ' + error.message);
    }
  }

  async getVideoDetails(videoId) {
    try {
      const url = `${this.baseUrl}/videos`;
      const params = {
        part: 'snippet,statistics,contentDetails',
        id: videoId,
        key: this.apiKey
      };

      const response = await axios.get(url, { params });
      return response.data.items[0] || null;
    } catch (error) {
      console.error('YouTube video details error:', error.response?.data || error.message);
      throw new Error('Failed to get video details');
    }
  }
}

module.exports = new YouTubeService();
