const https = require('https');

const username = 'hanyang_erica_stu';
const url = `https://www.instagram.com/${username}/`;

console.log(`Fetching ${url}...`);

const options = {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
    'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7'
  }
};

https.get(url, options, (res) => {
  let data = '';
  console.log('Status Code:', res.statusCode);
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Data Length:', data.length);
    // Try to find og:image
    const ogImageMatch = data.match(/<meta property="og:image" content="(.*?)"/);
    console.log('og:image Match:', ogImageMatch ? ogImageMatch[1] : 'NOT FOUND');
    
    const titleMatch = data.match(/<title>(.*?)<\/title>/);
    console.log('Title Match:', titleMatch ? titleMatch[1] : 'NOT FOUND');
    
    if (data.includes('window._sharedData')) {
        console.log('window._sharedData found!');
    } else {
        console.log('window._sharedData NOT found.');
    }
  });
}).on('error', (e) => {
  console.error('Error:', e.message);
});
