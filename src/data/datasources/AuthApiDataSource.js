// 데이터 소스: 인증 관련 서버리스 API 원시 호출
import { parseOrThrow } from '../../infrastructure/http/HttpClient.js';

export const createAuthApiDataSource = ({ httpClient }) => ({
  login: async ({ loginId, password }) =>
    parseOrThrow(await httpClient.post('/api/login', { loginId, password })),

  relogin: async ({ encryptedCredentials }) =>
    parseOrThrow(await httpClient.post('/api/relogin', { encryptedCredentials })),
});
