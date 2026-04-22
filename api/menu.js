import * as cheerio from 'cheerio';

const CAFES = [
  { id: 're15', name: '창업보육센터' },
  { id: 're11', name: '교직원식당' },
  { id: 're12', name: '학생식당' },
  { id: 're13', name: '창의인재원' },
  { id: 're14', name: '푸드코트' }
];

async function scrapeCafe(cafeId, dateStr) {
  const encodedDate = encodeURIComponent(dateStr);
  const url = `https://www.hanyang.ac.kr/web/www/${cafeId}?p_p_id=kr_ac_hanyang_cafe_web_portlet_CafePortlet&p_p_lifecycle=0&p_p_state=normal&p_p_mode=view&_kr_ac_hanyang_cafe_web_portlet_CafePortlet_sMenuDate=${encodedDate}&_kr_ac_hanyang_cafe_web_portlet_CafePortlet_action=view`;

  try {
    const fetchRes = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });
    if (!fetchRes.ok) return { id: cafeId, menus: [], error: true };

    const html = await fetchRes.text();
    const $ = cheerio.load(html);
    const menus = [];

    $('h3').each((i, el) => {
      const title = $(el).text().trim();
      const ignoreList = ['검색', '댓글', '창업보육', '학생식당', '교직원', '창의인재', '푸드코트', '위치', '조회'];
      
      if (title && !title.includes('원') && !ignoreList.some(ig => title.includes(ig))) {
        let menuText = $(el).next().text().replace(/\s+/g, ' ').trim();
        if (menuText && menuText.length > 5 && !menuText.includes('확인 가능합니다')) {
          const rawItems = menuText
            .replace(/"/g, '') // Remove double quotes
            .split(/\s+/) // Split by spaces
            .filter(item => !/[a-zA-Z]/.test(item)) // Remove items with English characters
            .filter(item => item.trim().length > 0); // Remove empty strings
          
          const parsedSets = [];
          let currentItems = [];

          rawItems.forEach(item => {
            if (/\d+.*원/.test(item)) {
              // It's a price. Finalize the current set.
              parsedSets.push({
                items: currentItems.join('\n'),
                price: item
              });
              currentItems = []; // Reset for next set
            } else {
              currentItems.push(item);
            }
          });

          // If there are leftover items (e.g. no price at the end)
          if (currentItems.length > 0) {
            parsedSets.push({
              items: currentItems.join('\n'),
              price: ''
            });
          }

          parsedSets.forEach(set => {
            if (set.items.trim().length > 0) {
              menus.push({ type: title, menu: set.items, price: set.price });
            }
          });
        }
      }
    });

    return { id: cafeId, menus };
  } catch (e) {
    return { id: cafeId, menus: [], error: true };
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ message: 'Method Not Allowed' });

  // Add Edge Caching: Cache for 1 hour, revalidate in background if up to 10 mins old
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=600');

  const id = req.query.id || 'all';
  let dateStr = req.query.date;

  if (!dateStr) {
    const today = new Date(new Date().getTime() + 9 * 60 * 60 * 1000);
    dateStr = today.toISOString().split('T')[0].replace(/-/g, '/');
  } else {
    dateStr = dateStr.replace(/-/g, '/');
  }

  try {
    if (id === 'all') {
      const results = await Promise.all(CAFES.map(c => scrapeCafe(c.id, dateStr)));
      const data = CAFES.map((c, i) => ({
        ...c,
        menus: results[i].menus,
        hasJeyuk: results[i].menus.some(m => m.menu.includes('제육')),
        available: results[i].menus.length > 0
      }));
      return res.status(200).json({ success: true, date: dateStr, data });
    } else {
      const result = await scrapeCafe(id, dateStr);
      return res.status(200).json({
        success: true,
        date: dateStr,
        id: result.id,
        menus: result.menus,
        hasJeyuk: result.menus.some(m => m.menu.includes('제육'))
      });
    }
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
}
