// 데이터 소스: 셔틀 시간표 JSON 및 지하철 도착 정보 API 원시 호출
export const createShuttleDataSource = ({ httpClient }) => ({
  fetchScheduleData: async () => {
    const res = await httpClient.get('/shuttle.json');
    return res.json();
  },

  fetchSubwayArrivals: async () => {
    const res = await httpClient.get('/api/subway');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },
});
