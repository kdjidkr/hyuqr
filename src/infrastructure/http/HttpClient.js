// 플랫폼 독립적인 HTTP 클라이언트: React Native 전환 시 이 파일만 교체
export const parseOrThrow = async (res) => {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message || `HTTP ${res.status}`);
    err.statusCode = res.status;
    throw err;
  }
  return data;
};

export const createHttpClient = ({ baseUrl = '' } = {}) => ({
  get: (path, headers = {}) =>
    fetch(`${baseUrl}${path}`, { headers }),

  post: (path, body, headers = {}) =>
    fetch(`${baseUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body),
    }),
});
