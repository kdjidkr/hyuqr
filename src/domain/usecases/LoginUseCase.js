// 유스케이스: 한양대 포털 ID/PW로 로그인하고 User 엔티티 반환
export const createLoginUseCase = ({ authRepository }) => ({
  execute: ({ loginId, password }) => authRepository.login({ loginId, password }),
});
