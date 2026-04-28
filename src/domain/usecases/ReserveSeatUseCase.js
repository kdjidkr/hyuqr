// 유스케이스: 열람실 좌석 예약
export const createReserveSeatUseCase = ({ libraryRepository }) => ({
  execute: ({ token, seatId }) => libraryRepository.reserveSeat(token, seatId),
});
