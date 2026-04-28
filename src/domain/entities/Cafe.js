// 도메인 엔티티: 학생식당 정보 및 메뉴 아이템
export const createCafe = ({ id, name, menus = [], hasJeyuk = false, available = false }) => ({
  id,
  name,
  menus,
  hasJeyuk,
  available,
});
