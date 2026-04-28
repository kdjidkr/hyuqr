// 웹 스토리지 어댑터: React Native 전환 시 AsyncStorage 어댑터로 교체
export const createLocalStorageService = () => ({
  get: async (key) => localStorage.getItem(key),
  set: async (key, value) => localStorage.setItem(key, value),
  remove: async (key) => localStorage.removeItem(key),
});
