// 유스케이스: 현재 사용자의 좌석 예약 현황 조회
export const createGetSeatUseCase = ({ libraryRepository }) => ({
  execute: (token) => libraryRepository.getSeat(token),
});
