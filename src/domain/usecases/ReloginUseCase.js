// 유스케이스: 저장된 암호화 자격증명으로 자동 재로그인
export const createReloginUseCase = ({ authRepository }) => ({
  execute: ({ encryptedCredentials }) => authRepository.relogin({ encryptedCredentials }),
});
