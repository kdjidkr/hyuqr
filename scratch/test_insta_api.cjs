const https = require('https');

const username = 'hanyang_erica_stu';
const url = `https://www.instagram.com/api/v1/users/web_profile_info/?username=${username}`;

console.log(`Fetching ${url}...`);

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

https.get(url, options, (res) => {
  let data = '';
  console.log('Status Code:', res.statusCode);
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Data Length:', data.length);
    if (res.statusCode === 200) {
      try {
        const json = JSON.parse(data);
        const user = json.data.user;
        console.log('Full Name:', user.full_name);
        console.log('Profile Pic URL:', user.profile_pic_url_hd);
      } catch (e) {
        console.log('JSON Parse Error:', e.message);
        console.log('Data Preview:', data.substring(0, 500));
      }
    } else {
      console.log('Error Data:', data.substring(0, 500));
    }
  });
}).on('error', (e) => {
  console.error('Error:', e.message);
});
