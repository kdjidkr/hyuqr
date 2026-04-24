import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Vercel handles /tmp as a writable directory
const CACHE_DIR = path.join('/tmp', 'insta-cache');

try {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
} catch (e) {
  console.error('Failed to create cache dir:', e.message);
}

const fetchWithRedirects = (url, depth = 0) => {
  if (depth > 3) return Promise.reject(new Error('Too many redirects'));
  
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
      }
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(fetchWithRedirects(res.headers.location, depth + 1));
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`Status ${res.statusCode}`));
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
};

export default async function handler(req, res) {
  const { username } = req.query;
  if (!username) return res.status(400).send('Username is required');

  const cachePath = path.join(CACHE_DIR, `${username}.json`);

  // Try reading from cache
  try {
    if (fs.existsSync(cachePath)) {
      const stats = fs.statSync(cachePath);
      if (new Date().getTime() - new Date(stats.mtime).getTime() < 24 * 60 * 60 * 1000) {
        const cachedData = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
        return res.status(200).json(cachedData);
      }
    }
  } catch (e) {
    console.error('Cache read error:', e.message);
  }

  try {
    const html = await fetchWithRedirects(`https://www.instagram.com/${username}/`);
    
    // OG Image extraction
    const ogImageMatch = html.match(/property="og:image"\s+content="([^"]+)"/i) || 
                         html.match(/content="([^"]+)"\s+property="og:image"/i);
    let profilePicUrl = ogImageMatch ? ogImageMatch[1].replace(/&amp;/g, '&') : null;

    // Full Name extraction
    const titleMatch = html.match(/<title>(.*?)<\/title>/i);
    let fullName = null;
    if (titleMatch) {
      const title = titleMatch[1];
      if (title.includes('(@')) fullName = title.split('(@')[0].trim();
      else if (title.includes('•')) fullName = title.split('•')[0].trim();
    }

    const result = {
      username,
      fullName: fullName || username,
      profilePicUrl: profilePicUrl || `https://ui-avatars.com/api/?name=${username}&background=random`
    };

    // Try saving to cache
    try {
      fs.writeFileSync(cachePath, JSON.stringify(result));
    } catch (e) {
      console.error('Cache write error:', e.message);
    }

    res.status(200).json(result);
  } catch (error) {
    console.error(`Insta Proxy Error for ${username}:`, error.message);
    // Return fallback even on error to keep UI alive
    res.status(200).json({
      username,
      fullName: username,
      profilePicUrl: `https://ui-avatars.com/api/?name=${username}&background=random`,
      error: true
    });
  }
}
