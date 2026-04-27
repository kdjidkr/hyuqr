// 도메인 엔티티: 열람실 좌석 예약 정보
export const createSeat = ({ id, room, seatNumber, state, endTime, remainTime, checkinExpiryDate }) => ({
  id,
  room,
  seatNumber,
  state,
  endTime,
  remainTime,
  checkinExpiryDate,
});
