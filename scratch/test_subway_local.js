import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Manually load .env
const envPath = join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, ...vals] = line.split('=');
    if (key && vals.length > 0) {
      process.env[key.trim()] = vals.join('=').trim();
    }
  });
}

// Import the handler
import handler from '../api/subway.js';

async function test() {
  const req = { method: 'GET', query: {} };
  let resData = null;
  const res = {
    setHeader: () => {},
    status: (code) => {
      console.log('Status:', code);
      return res;
    },
    json: (data) => {
      resData = data;
    },
    end: () => {}
  };
  
  await handler(req, res);
  
  console.log('isHoliday:', resData?.isHoliday);
  if (resData?.arrivals) {
    const suin = resData.arrivals.filter(a => a.subwayId === '1075');
    console.log('Suin arrivals count:', suin.length);
  } else {
    console.log('Error/No data:', resData);
  }
}

test();
