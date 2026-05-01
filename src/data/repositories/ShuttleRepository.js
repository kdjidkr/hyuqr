// 레포지토리: 셔틀 시간표 캐싱 및 지하철 도착 데이터 제공
export const createShuttleRepository = ({ shuttleDataSource }) => {
  let cachedSchedule = null;

  return {
    getScheduleData: async () => {
      if (cachedSchedule) return cachedSchedule;
      cachedSchedule = await shuttleDataSource.fetchScheduleData();
      return cachedSchedule;
    },

    getSubwayArrivals: async () => {
      const data = await shuttleDataSource.fetchSubwayArrivals();
      return { arrivals: data.arrivals ?? [], offPeak: !!data.offPeak, isHoliday: data.isHoliday ?? false };
    },
  };
};
