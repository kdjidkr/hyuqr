// 유스케이스: 확정 전 임시 좌석 예약 취소
export const createCancelReservationUseCase = ({ libraryRepository }) => ({
  execute: ({ token, seatCharge }) => libraryRepository.cancelReservation(token, seatCharge),
});
