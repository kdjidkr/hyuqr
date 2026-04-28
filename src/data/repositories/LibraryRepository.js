// 레포지토리: 도서관 API 응답을 QRCode·Seat 엔티티로 변환
import { createQRCode } from '../../domain/entities/QRCode.js';
import { createSeat } from '../../domain/entities/Seat.js';

export const createLibraryRepository = ({ libraryApiDataSource }) => ({
  getQRCode: async (token) => {
    const data = await libraryApiDataSource.getQRCode(token);
    const mCard = data.data?.membershipCard
      || data.data?.data?.membershipCard
      || (typeof data.data === 'string' ? data.data : null);

    if (!mCard || mCard === 'null' || mCard === 'undefined' || mCard.trim() === '') {
      const err = new Error('QR 데이터 없음');
      err.code = 'NO_QR_DATA';
      throw err;
    }

    return createQRCode({
      value: mCard,
      patronName: data.data?.patron?.name || data.data?.data?.patron?.name || null,
    });
  },

  getSeat: async (token) => {
    const data = await libraryApiDataSource.getSeat(token);
    if (!data.success || !data.data?.list?.[0]) return null;

    const item = data.data.list[0];
    const seatObj = Array.isArray(item.seat) ? item.seat[0] : item.seat;
    if (!seatObj) return null;

    const merged = {
      ...seatObj,
      id: item.id || seatObj.id,
      room: item.room || seatObj.room,
      endTime: item.endTime || seatObj.endTime,
      state: item.state || seatObj.state,
      checkinExpiryDate: item.checkinExpiryDate || seatObj.checkinExpiryDate,
      remainTime: item.remainTime ?? item.remainingTime ?? seatObj.remainTime ?? seatObj.remainingTime,
    };

    if (merged.remainTime === undefined && merged.endTime) {
      const end = new Date(merged.endTime.replace(/-/g, '/'));
      merged.remainTime = Math.max(0, Math.floor((end - new Date()) / 60000));
    }

    return createSeat({
      id: merged.id,
      room: merged.room,
      seatNumber: merged.seat || merged.code,
      state: merged.state,
      endTime: merged.endTime,
      remainTime: merged.remainTime,
      checkinExpiryDate: merged.checkinExpiryDate,
    });
  },

  reserveSeat: async (token, seatId) => {
    const data = await libraryApiDataSource.reserveSeat(token, seatId);
    return data.success === true;
  },

  cancelReservation: async (token, seatCharge) => {
    const data = await libraryApiDataSource.cancelReservation(token, seatCharge);
    return data.success === true;
  },

  dischargeSeat: async (token, seatCharge) => {
    const data = await libraryApiDataSource.dischargeSeat(token, seatCharge);
    return data.success === true;
  },
});
