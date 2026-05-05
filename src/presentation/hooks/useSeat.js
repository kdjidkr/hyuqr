// 훅(ViewModel): 좌석 조회·예약·반납·취소 상태 관리
import { useState, useCallback, useRef, useEffect } from 'react';
import {
  getSeatUseCase,
  reserveSeatUseCase,
  cancelReservationUseCase,
  dischargeSeatUseCase,
} from '../../di.js';

export function useSeat({ user }) {
  const userRef = useRef(user);
  useEffect(() => { userRef.current = user; }, [user]);

  const [seatData, setSeatData]   = useState(null);
  const [loading, setLoading]     = useState(false);
  const [seatFetched, setSeatFetched] = useState(false);

  const fetchSeat = useCallback(async () => {
    const token = userRef.current?.token;
    if (!token) return;
    try {
      const seat = await getSeatUseCase.execute(token);
      setSeatData(seat);
    } catch (err) {
      console.error('좌석 조회 실패:', err);
    } finally {
      setSeatFetched(true);
    }
  }, []);

  const handleReserve = useCallback(async (seatId) => {
    const token = userRef.current?.token;
    setLoading(true);
    try {
      const ok = await reserveSeatUseCase.execute({ token, seatId });
      if (ok) { alert('예약되었습니다.'); await fetchSeat(); }
      else alert('예약 실패');
    } catch (err) {
      alert(err.message || '통신 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [fetchSeat]);

  const handleSeatReturn = useCallback(async (seatData) => {
    const token = userRef.current?.token;
    const isTemp = seatData.state?.code === 'TEMP_CHARGE';
    const msg = isTemp ? '예약을 취소하시겠습니까?' : `${seatData.seatNumber}번 자리를 반납할까요?`;
    if (!window.confirm(msg)) return;

    setLoading(true);
    try {
      const useCase = isTemp ? cancelReservationUseCase : dischargeSeatUseCase;
      const ok = await useCase.execute({ token, seatCharge: seatData.id });
      if (ok) {
        alert(isTemp ? '예약이 취소되었습니다.' : '반납되었습니다.');
        setSeatData(null);
      } else {
        alert(isTemp ? '취소 실패' : '반납 실패');
      }
    } catch (err) {
      alert(err.message || '통신 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  return { seatData, setSeatData, loading, seatFetched, fetchSeat, handleReserve, handleSeatReturn };
}
