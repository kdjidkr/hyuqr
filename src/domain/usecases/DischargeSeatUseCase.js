// 유스케이스: 이용 중인 좌석 반납
export const createDischargeSeatUseCase = ({ libraryRepository }) => ({
  execute: ({ token, seatCharge }) => libraryRepository.dischargeSeat(token, seatCharge),
});
