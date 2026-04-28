// 유스케이스: 도서관 입장용 QR 코드 조회
export const createGetQRCodeUseCase = ({ libraryRepository }) => ({
  execute: (token) => libraryRepository.getQRCode(token),
});
