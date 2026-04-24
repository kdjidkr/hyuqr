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

const fetchInstagramData = (username) => {
  return new Promise((resolve, reject) => {
    // Attempt 1: Web Profile Info API (Most reliable)
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

    https.get(apiUrl, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const json = JSON.parse(data);
            const user = json.data.user;
            if (user) {
              return resolve({
                username,
                fullName: user.full_name || username,
                profilePicUrl: user.profile_pic_url_hd || user.profile_pic_url
              });
            }
          } catch (e) {}
        }
        
        // Attempt 2: HTML Scraping Fallback
        const pageUrl = `https://www.instagram.com/${username}/`;
        https.get(pageUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res2) => {
          let html = '';
          res2.on('data', c => html += c);
          res2.on('end', () => {
            const ogImageMatch = html.match(/property="og:image"\s+content="([^"]+)"/i);
            const titleMatch = html.match(/<title>(.*?)<\/title>/i);
            
            let profilePicUrl = ogImageMatch ? ogImageMatch[1].replace(/&amp;/g, '&') : null;
            let fullName = null;
            if (titleMatch && titleMatch[1].includes('(@')) {
              fullName = titleMatch[1].split('(@')[0].trim();
            }

            resolve({
              username,
              fullName: fullName || username,
              profilePicUrl: profilePicUrl || `https://ui-avatars.com/api/?name=${username}&background=random`
            });
          });
        }).on('error', () => reject(new Error('HTML Fetch Failed')));
      });
    }).on('error', reject);
  });
};

export default async function handler(req, res) {
  const { username } = req.query;
  if (!username) return res.status(400).send('Username is required');

  const cachePath = path.join(CACHE_DIR, `${username}.json`);

  try {
    if (fs.existsSync(cachePath)) {
      const stats = fs.statSync(cachePath);
      if (new Date().getTime() - new Date(stats.mtime).getTime() < 24 * 60 * 60 * 1000) {
        const cachedData = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
        return res.status(200).json(cachedData);
      }
    }
  } catch (e) {}

  try {
    const result = await fetchInstagramData(username);
    
    try {
      fs.writeFileSync(cachePath, JSON.stringify(result));
    } catch (e) {}

    res.status(200).json(result);
  } catch (error) {
    res.status(200).json({
      username,
      fullName: username,
      profilePicUrl: `https://ui-avatars.com/api/?name=${username}&background=random`,
      error: true
    });
  }
}
