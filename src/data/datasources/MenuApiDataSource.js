// 데이터 소스: 식단 정보 서버리스 API 원시 호출
import { parseOrThrow } from '../../infrastructure/http/HttpClient.js';

export const createMenuApiDataSource = ({ httpClient }) => ({
  getMenus: async (dateStr) =>
    parseOrThrow(await httpClient.get(`/api/menu?id=all&date=${dateStr}`)),
});
