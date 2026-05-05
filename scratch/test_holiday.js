import fs from 'fs';
import path from 'path';

async function testHolidays() {
  const year = 2026;
  const key = 'ae50d9d850a8d2fc6134f81d3ecf2b1ee16e7ede9e882a30348b13b5f3de3aad';
  
  try {
    const url = `http://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService/getRestDeInfo?ServiceKey=${key}&solYear=${year}&_type=json&numOfRows=100`;
    console.log(`Fetching from: ${url}`);
    
    const res = await fetch(url);
    const json = await res.json();
    
    if (json.response?.header?.resultCode === '00') {
      let items = json.response.body?.items?.item || [];
      if (!Array.isArray(items)) items = [items];
      
      const holidayDates = items
        .filter(item => item.isHoliday === 'Y')
        .map(item => {
          const s = String(item.locdate);
          return `${s.substring(0, 4)}-${s.substring(4, 6)}-${s.substring(6, 8)}`;
        });
      
      const uniqueHolidays = Array.from(new Set(holidayDates)).sort();
      console.log('--- 2026 Holidays ---');
      console.log(uniqueHolidays);
      
      const today = '2026-05-01';
      const isHoliday = uniqueHolidays.includes(today);
      console.log(`\nIs ${today} a holiday? -> ${isHoliday}`);
    } else {
      console.error('API Error:', json);
    }
  } catch (e) {
    console.error('Fetch failed:', e);
  }
}

testHolidays();
