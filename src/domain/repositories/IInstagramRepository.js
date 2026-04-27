// 인터페이스 정의: 인스타그램 레포지토리가 구현해야 할 메서드 명세 (JSDoc)
/**
 * @typedef {Object} IInstagramRepository
 * @property {(username: string) => Promise<import('../entities/InstagramAccount').InstagramProfile>} getProfile
 * @property {(originalUrl: string) => string} getProxiedImageUrl
 */
export {};
