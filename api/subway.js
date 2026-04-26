let subwayCache = null;
let subwayCacheTime = 0;
const CACHE_TTL = 2 * 60 * 1000; // 2 minutes

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'GET') return res.status(405).end();

  const nowMs = Date.now();
  const hour = new Date().getHours();

  // Only query the API between 06:00–23:00 (shuttle operating hours)
  if (hour < 6 || hour >= 23) {
    return res.status(200).json({ arrivals: [], offPeak: true });
  }

  // Serve warm cache if still fresh
  if (subwayCache && nowMs - subwayCacheTime < CACHE_TTL) {
    return res.status(200).json(subwayCache);
  }

  const key = process.env.SUBWAY_KEY;
  if (!key) return res.status(500).json({ error: 'SUBWAY_KEY env var not configured' });

  try {
    const url = `http://swopenAPI.seoul.go.kr/api/subway/${key}/json/realtimeStationArrival/0/100/${encodeURIComponent('한대앞')}`;
    const fetchRes = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!fetchRes.ok) throw new Error(`API responded with ${fetchRes.status}`);

    const data = await fetchRes.json();
    const arrivals = (data.realtimeArrivalList || []).map(tr => {
      const secsLeft = parseInt(tr.barvlDt || '0', 10);
      const arrDate = new Date(nowMs + secsLeft * 1000);
      return {
        subwayId: tr.subwayId,
        updnLine: tr.updnLine,
        dest: tr.bstatnNm,
        arrTime: `${String(arrDate.getHours()).padStart(2, '0')}:${String(arrDate.getMinutes()).padStart(2, '0')}`,
        secsLeft,
      };
    });

    subwayCache = { arrivals };
    subwayCacheTime = nowMs;
    return res.status(200).json(subwayCache);
  } catch (err) {
    // Fall back to stale cache rather than failing silently
    if (subwayCache) return res.status(200).json({ ...subwayCache, stale: true });
    return res.status(500).json({ error: err.message });
  }
}
