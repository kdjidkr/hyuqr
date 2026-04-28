// 유스케이스: 특정 날짜의 식당별 식단 정보 조회
export const createGetMenuUseCase = ({ menuRepository }) => ({
  execute: (dateStr) => menuRepository.getMenus(dateStr),
});
