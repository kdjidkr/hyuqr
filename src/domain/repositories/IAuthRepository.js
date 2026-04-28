// 인터페이스 정의: 인증 레포지토리가 구현해야 할 메서드 명세 (JSDoc)
/**
 * @typedef {Object} IAuthRepository
 * @property {(params: {loginId: string, password: string}) => Promise<import('../entities/User').User>} login
 * @property {(params: {encryptedCredentials: string}) => Promise<import('../entities/User').User>} relogin
 * @property {() => Promise<void>} logout
 * @property {() => Promise<import('../entities/User').User|null>} getStoredSession
 * @property {() => Promise<string|null>} getStoredEncryptedCredentials
 */
export {};
