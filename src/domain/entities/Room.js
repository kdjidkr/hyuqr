// 도메인 엔티티: 도서관 열람실 목록 및 좌석 ID 계산 기준값
export const ROOMS = [
  { id: 61,  name: '제1열람실 (2F)',    max: 324, offset: 2276 },
  { id: 63,  name: '제2열람실 (4F)',    max: 218, offset: 2786 },
  { id: 132, name: '노상일 HOLMZ (4F)', max: 83,  offset: 3823 },
  { id: 131, name: '집중열람실 (4F)',    max: 10,  offset: 3811 },
];

export const calcSeatId = (room, seatNumber) => room.offset + seatNumber;
