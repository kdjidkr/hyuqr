// 데이터 소스: 도서관 QR·좌석 관련 서버리스 API 원시 호출
import { parseOrThrow } from '../../infrastructure/http/HttpClient.js';

export const createLibraryApiDataSource = ({ httpClient }) => ({
  getQRCode: async (token) =>
    parseOrThrow(await httpClient.get('/api/qr', { 'X-Pyxis-Auth-Token': token })),

  getSeat: async (token) =>
    parseOrThrow(await httpClient.get('/api/seat', { 'X-Pyxis-Auth-Token': token })),

  reserveSeat: async (token, seatId) =>
    parseOrThrow(await httpClient.post('/api/reserve', { seatId }, { 'X-Pyxis-Auth-Token': token })),

  cancelReservation: async (token, seatCharge) =>
    parseOrThrow(await httpClient.post('/api/cancel', { seatCharge }, { 'X-Pyxis-Auth-Token': token })),

  dischargeSeat: async (token, seatCharge) =>
    parseOrThrow(await httpClient.post('/api/discharge', { seatCharge }, { 'X-Pyxis-Auth-Token': token })),
});
