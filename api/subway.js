let subwayCache = null;
let subwayCacheTime = 0;
const CACHE_TTL = 2 * 60 * 1000; // 2 minutes

// Timetable cache (stores the entire day's schedule)
let timetableCache = { data: null, date: null };

// Station codes for SearchSTNTimeTableByIDService
const STATION_CODES = {
  '1004': '1755', // Line 4
  '1075': '1830', // Suin-Bundang
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'GET') return res.status(405).end();

  const now = new Date();
  const kstOffset = 9 * 60; // KST is UTC+9
  const nowKst = new Date(now.getTime() + (kstOffset + now.getTimezoneOffset()) * 60000);
  const hour = nowKst.getHours();
  const nowMs = now.getTime();
  const todayStr = nowKst.toISOString().split('T')[0];

  // Only query the API between 05:00–24:00
  if (hour < 5 || hour >= 24) {
    return res.status(200).json({ arrivals: [], offPeak: true });
  }

  // Serve warm cache if still fresh
  if (subwayCache && nowMs - subwayCacheTime < CACHE_TTL) {
    return res.status(200).json(subwayCache);
  }

  const key = process.env.SUBWAY_KEY;
  if (!key) return res.status(500).json({ error: 'SUBWAY_KEY env var not configured' });

  try {
    // 1. Fetch Realtime Data
    const rtUrl = `http://swopenAPI.seoul.go.kr/api/subway/${key}/json/realtimeStationArrival/0/100/${encodeURIComponent('한대앞')}`;
    const rtRes = await fetch(rtUrl, { signal: AbortSignal.timeout(5000) });
    const rtData = await rtRes.json();
    
    const rtArrivals = (rtData.realtimeArrivalList || []).map(tr => {
      let secsLeft = parseInt(tr.barvlDt || '0', 10);
      if (secsLeft === 0) {
        const msg = tr.arvlMsg2 || '';
        if (msg.includes('진입')) secsLeft = 30;
        else if (msg.includes('도착')) secsLeft = 60;
        else if (msg.includes('출발')) secsLeft = 90;
        else if (tr.arvlCd === '5') secsLeft = 120; // Previous station departed
        else if (tr.arvlCd === '4') secsLeft = 180; // Previous station arrived
        else {
          const match = msg.match(/\[(\d+)\]번째 전역/);
          if (match) {
            // Ansan/Suin lines usually take about 2 mins (120s) per station
            secsLeft = parseInt(match[1], 10) * 120;
          }
        }
      }
      const arrDateKst = new Date(nowKst.getTime() + secsLeft * 1000);
      return {
        subwayId: tr.subwayId,
        updnLine: tr.updnLine,
        dest: tr.bstatnNm,
        arrTime: `${String(arrDateKst.getHours()).padStart(2, '0')}:${String(arrDateKst.getMinutes()).padStart(2, '0')}`,
        btrainNo: tr.btrainNo,
        isRealtime: true,
      };
    });

    // 2. Fetch Timetable if needed (once per day)
    if (timetableCache.date !== todayStr) {
      const dayTag = [0, 6].includes(nowKst.getDay()) ? (nowKst.getDay() === 0 ? '3' : '2') : '1';
      const ttResults = [];
      const seenTrains = new Set();
      
      // Fetch for both lines and both directions
      for (const [subId, stCode] of Object.entries(STATION_CODES)) {
        for (const upDown of ['1', '2']) {
          const ttUrl = `http://openAPI.seoul.go.kr:8088/${key}/json/SearchSTNTimeTableByIDService/1/500/${stCode}/${dayTag}/${upDown}/`;
          try {
            const ttRes = await fetch(ttUrl, { signal: AbortSignal.timeout(3000) });
            const ttData = await ttRes.json();
            const rows = ttData.SearchSTNTimeTableByIDService?.row || [];
            rows.forEach(r => {
              const trainId = `${subId}-${upDown}-${r.TRAIN_NO}-${r.ARRIVETIME}`;
              if (!seenTrains.has(trainId)) {
                seenTrains.add(trainId);
                ttResults.push({
                  subwayId: subId,
                  updnLine: upDown === '1' ? '상행' : '하행',
                  dest: r.SUBWAYENAME,
                  arrTime: r.ARRIVETIME.substring(0, 5),
                  trainNo: r.TRAIN_NO,
                  isRealtime: false,
                });
              }
            });
          } catch (e) { console.error(`Timetable fetch failed for ${stCode}-${upDown}:`, e); }
        }
      }
      timetableCache = { data: ttResults, date: todayStr };
    }

    // 3. Merge: Realtime takes precedence, then add future timetable entries
    const combined = [...rtArrivals];
    // For deduplication, we use:
    // 1. Time-based keys (with +/- 1 min fuzzy match)
    // 2. Train ID based keys
    const rtTimeKeys = new Set(rtArrivals.map(a => `${a.subwayId}-${a.updnLine}-${a.arrTime}`));
    const rtTrainKeys = new Set(rtArrivals.map(a => `${a.subwayId}-${a.updnLine}-${a.btrainNo}`));
    
    // Add timetable entries that are NOT in realtime and are in the future
    const nowHHMM = `${String(hour).padStart(2, '0')}:${String(nowKst.getMinutes()).padStart(2, '0')}`;
    timetableCache.data.forEach(tt => {
      const keyPrefix = `${tt.subwayId}-${tt.updnLine}-`;
      const timeKey = `${keyPrefix}${tt.arrTime}`;
      const trainKey = `${keyPrefix}${tt.trainNo}`;
      
      const [h, m] = tt.arrTime.split(':').map(Number);
      const toTimeKey = (hh, mm) => {
        let finalH = hh, finalM = mm;
        if (finalM < 0) { finalM = 59; finalH--; }
        if (finalM > 59) { finalM = 0; finalH++; }
        return `${keyPrefix}${String(finalH).padStart(2, '0')}:${String(finalM).padStart(2, '0')}`;
      };

      const mMinus = toTimeKey(h, m - 1);
      const mPlus  = toTimeKey(h, m + 1);

      // Skip if:
      // - Same Train ID exists in realtime
      // - Same Time (or +/- 1 min) exists in realtime
      const isDuplicate = rtTrainKeys.has(trainKey) || 
                          rtTimeKeys.has(timeKey) || 
                          rtTimeKeys.has(mMinus) || 
                          rtTimeKeys.has(mPlus);

      if (!isDuplicate && tt.arrTime >= nowHHMM) {
        combined.push(tt);
        rtTimeKeys.add(timeKey);
        rtTrainKeys.add(trainKey);
      }
    });

    combined.sort((a, b) => a.arrTime.localeCompare(b.arrTime));

    subwayCache = { arrivals: combined };
    subwayCacheTime = nowMs;
    return res.status(200).json(subwayCache);
  } catch (err) {
    if (subwayCache) return res.status(200).json({ ...subwayCache, stale: true });
    return res.status(500).json({ error: err.message });
  }
}
