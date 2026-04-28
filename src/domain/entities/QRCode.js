// 도메인 엔티티: 도서관 입장용 QR 코드 데이터
export const createQRCode = ({ value, patronName = null }) => ({
  value,
  patronName,
});
