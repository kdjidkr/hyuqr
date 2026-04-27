// 유스케이스: 셔틀 시간표 원본 데이터 조회 (최초 1회 로드)
export const createGetShuttleDataUseCase = ({ shuttleRepository }) => ({
  execute: () => shuttleRepository.getScheduleData(),
});
