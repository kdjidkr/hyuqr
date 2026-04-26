const https = require('https');

const accounts = [
  'hanyang_erica', 'hanyang_erica_stu', 'hanyang_erica_club_association', 'hyuerica', 'hanyangerica',
  'hyu_lions', 'hyu_soongan_', 'hyu_erica_eng', 'hypharmacy', 'design_hyu', 'hanyang_gon', 'hyu_mood', 'hyu_computing', 'hyu_e_sports_and_arts_vibe', 'hyu_erica_atc'
];

async function testAccount(username) {
  return new Promise((resolve) => {
    const apiUrl = `https://www.instagram.com/api/v1/users/web_profile_info/?username=${username}`;
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'x-ig-app-id': '936619743392459',
      }
    };

    https.get(apiUrl, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const json = JSON.parse(data);
            if (json.data.user) {
              console.log(`[OK] ${username}: ${json.data.user.full_name}`);
              return resolve(true);
            }
          } catch (e) {}
        }
        console.log(`[FAIL] ${username} (Status: ${res.statusCode})`);
        resolve(false);
      });
    }).on('error', (e) => {
      console.log(`[ERROR] ${username}: ${e.message}`);
      resolve(false);
    });
  });
}

async function runAll() {
  for (const acc of accounts) {
    await testAccount(acc);
    // Add small delay to avoid rate limit
    await new Promise(r => setTimeout(r, 500));
  }
}

runAll();
