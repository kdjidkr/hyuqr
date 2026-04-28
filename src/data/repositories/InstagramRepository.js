// 레포지토리: 인스타그램 API 응답을 InstagramProfile 엔티티로 변환
import { createInstagramProfile } from '../../domain/entities/InstagramAccount.js';

export const createInstagramRepository = ({ instagramApiDataSource }) => ({
  getProfile: async (username) => {
    const data = await instagramApiDataSource.getProfile(username);
    return createInstagramProfile({
      username: data.username,
      fullName: data.fullName || username,
      profilePicUrl: data.profilePicUrl || null,
      desc: '',
    });
  },

  getProxiedImageUrl: (originalUrl) => {
    if (!originalUrl || originalUrl.includes('ui-avatars.com')) return originalUrl;
    return `/api/insta-proxy?url=${encodeURIComponent(originalUrl)}`;
  },
});
