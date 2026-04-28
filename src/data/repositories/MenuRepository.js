// 레포지토리: 식단 API 응답을 Cafe 엔티티 배열로 변환
import { createCafe } from '../../domain/entities/Cafe.js';

export const createMenuRepository = ({ menuApiDataSource }) => ({
  getMenus: async (dateStr) => {
    const data = await menuApiDataSource.getMenus(dateStr);
    if (!data.success) return [];
    return data.data.map(c => createCafe({
      id: c.id,
      name: c.name,
      menus: c.menus ?? [],
      hasJeyuk: c.hasJeyuk ?? false,
      available: c.available ?? false,
    }));
  },
});
