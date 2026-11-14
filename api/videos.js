import { loadChannelVideos } from '../lib/youtube.js';

export default async function handler(request, response) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.setHeader('Allow', 'GET, HEAD');
    return response.status(405).json({ error: 'Method not allowed' });
  }
  const result = await loadChannelVideos();
  response.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
  response.setHeader('Vercel-CDN-Cache-Control', result.source === 'saved' ? 's-maxage=30' : 's-maxage=300');
  response.setHeader('X-Content-Type-Options', 'nosniff');
  if (request.method === 'HEAD') return response.status(200).end();
  return response.status(200).json(result);
}
