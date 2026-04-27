// 레포지토리: 인증 API 응답을 User 엔티티로 변환하고 세션을 스토리지에 저장
import { createUser } from '../../domain/entities/User.js';

export const createAuthRepository = ({ authApiDataSource, storageService }) => ({
  login: async ({ loginId, password }) => {
    const data = await authApiDataSource.login({ loginId, password });
    const user = createUser({
      token: data.accessToken,
      encryptedCredentials: data.encryptedCredentials,
      name: data.name ?? null,
    });
    await storageService.set('pyxisAccessToken', user.token);
    await storageService.set('pyxisEncryptedCreds', user.encryptedCredentials);
    return user;
  },

  relogin: async ({ encryptedCredentials }) => {
    const data = await authApiDataSource.relogin({ encryptedCredentials });
    await storageService.set('pyxisAccessToken', data.accessToken);
    return createUser({ token: data.accessToken, encryptedCredentials, name: data.name ?? null });
  },

  logout: async () => {
    await storageService.remove('pyxisAccessToken');
    await storageService.remove('pyxisEncryptedCreds');
  },

  getStoredSession: async () => {
    const token = await storageService.get('pyxisAccessToken');
    const encryptedCredentials = await storageService.get('pyxisEncryptedCreds');
    if (!token || !encryptedCredentials) return null;
    return createUser({ token, encryptedCredentials, name: null });
  },

  getStoredEncryptedCredentials: () => storageService.get('pyxisEncryptedCreds'),
});
