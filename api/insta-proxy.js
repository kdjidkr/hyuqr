import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CACHE_DIR = path.join('/tmp', 'insta-cache');

try {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
} catch (e) {}

const fetchWithRetry = (username, retries = 2) => {
  return new Promise((resolve, reject) => {
    const apiUrl = `https://www.instagram.com/api/v1/users/web_profile_info/?username=${username}`;
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'x-ig-app-id': '936619743392459',
        'Accept': '*/*',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin',
      }
    };

    const performFetch = (attempt) => {
      https.get(apiUrl, options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if (res.statusCode === 200) {
            try {
              const json = JSON.parse(data);
              const user = json.data?.user;
              if (user) {
                return resolve({
                  username,
                  fullName: user.full_name || username,
                  profilePicUrl: user.profile_pic_url_hd || user.profile_pic_url,
                  success: true
                });
              }
            } catch (e) {}
          }
          
          if (attempt < retries) {
            console.log(`Retrying ${username} (Attempt ${attempt + 1})...`);
            setTimeout(() => performFetch(attempt + 1), 500 * (attempt + 1));
          } else {
            reject(new Error(`Status ${res.statusCode}`));
          }
        });
      }).on('error', (err) => {
        if (attempt < retries) {
          setTimeout(() => performFetch(attempt + 1), 500 * (attempt + 1));
        } else {
          reject(err);
        }
      });
    };

    performFetch(0);
  });
};

export default async function handler(req, res) {
  const { username, url } = req.query;

  // Image Proxy Mode
  if (url) {
    if (!url.includes('cdninstagram.com')) return res.status(403).send('Invalid URL');
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=3600');
    return new Promise((resolve) => {
      https.get(url, (imgRes) => {
        res.setHeader('Content-Type', imgRes.headers['content-type'] || 'image/jpeg');
        imgRes.pipe(res);
        imgRes.on('end', resolve);
      }).on('error', () => {
        res.status(500).send('Proxy error');
        resolve();
      });
    });
  }

  // Data Proxy Mode
  if (!username) return res.status(400).send('Username required');

  const cachePath = path.join(CACHE_DIR, `${username}.json`);

  // 1. Try local cache
  try {
    if (fs.existsSync(cachePath)) {
      const stats = fs.statSync(cachePath);
      if (new Date().getTime() - new Date(stats.mtime).getTime() < 14 * 24 * 60 * 60 * 1000) {
        const cachedData = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
        res.setHeader('Cache-Control', 's-maxage=1209600, stale-while-revalidate=86400');
        return res.status(200).json({ ...cachedData, fromCache: true });
      }
    }
  } catch (e) {}

  try {
    // 2. Fetch with retry
    const result = await fetchWithRetry(username);
    
    // 3. If successful, set long cache and save
    res.setHeader('Cache-Control', 's-maxage=1209600, stale-while-revalidate=86400');
    try {
      fs.writeFileSync(cachePath, JSON.stringify(result));
    } catch (e) {}

    res.status(200).json(result);
  } catch (error) {
    console.error(`Insta Proxy Final Error for ${username}:`, error.message);
    
    // 4. IMPORTANT: Do NOT set long cache for failures
    // This allows the browser to try again on next refresh
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.status(200).json({
      username,
      fullName: username,
      profilePicUrl: `https://ui-avatars.com/api/?name=${username}&background=random`,
      error: true,
      success: false
    });
  }
}
