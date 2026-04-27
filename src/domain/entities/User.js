// 도메인 엔티티: 인증된 사용자 세션 정보
export const createUser = ({ token, encryptedCredentials, name = null }) => ({
  token,
  encryptedCredentials,
  name,
});
