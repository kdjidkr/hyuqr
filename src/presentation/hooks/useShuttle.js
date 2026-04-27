// 훅(ViewModel): 셔틀 시간표 로딩·정류장 선택·지하철 연동 상태 관리
import { useState, useEffect, useCallback } from 'react';
import { computeSchedule, curMin } from '../../domain/entities/Shuttle.js';
import { getShuttleDataUseCase, getSubwayArrivalsUseCase } from '../../di.js';

export function useShuttle() {
  const [stop,   setStopState]  = useState(() => localStorage.getItem('shuttle_stop')   || '기숙사');
  const [lineId, setLineIdState] = useState(() => localStorage.getItem('shuttle_lineId') || 'line4-bulam');
  const [allData,         setAllData]         = useState(null);
  const [subwayArrivals,  setSubwayArrivals]  = useState([]);
  const [subwayOffPeak,   setSubwayOffPeak]   = useState(false);
  const [now,             setNow]             = useState(curMin);
  const [loadErr,         setLoadErr]         = useState(null);

  const setStop = (s) => { setStopState(s); localStorage.setItem('shuttle_stop', s); };
  const setLineId = (l) => { setLineIdState(l); localStorage.setItem('shuttle_lineId', l); };

  // 셔틀 시간표 최초 로드
  useEffect(() => {
    getShuttleDataUseCase.execute()
      .then(setAllData)
      .catch(() => setLoadErr('셔틀 시간표를 불러오지 못했습니다.'));
  }, []);

  // 1분마다 현재 시각 갱신
  useEffect(() => {
    const id = setInterval(() => setNow(curMin()), 60_000);
    return () => clearInterval(id);
  }, []);

  // 지하철 도착 정보 (2분 주기, 기숙사·셔틀콕만 필요)
  const needsSubway = stop === '기숙사' || stop === '셔틀콕';
  const fetchSubway = useCallback(() => {
    getSubwayArrivalsUseCase.execute()
      .then(d => { setSubwayArrivals(d.arrivals); setSubwayOffPeak(d.offPeak); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!needsSubway) return;
    fetchSubway();
    const id = setInterval(fetchSubway, 2 * 60_000);
    return () => clearInterval(id);
  }, [needsSubway, fetchSubway]);

  const schedule = allData ? computeSchedule(allData, stop, now) : [];
  const nextIdx  = schedule.findIndex(r => r.depMin >= now);

  return {
    stop, setStop,
    lineId, setLineId,
    schedule, nextIdx,
    subwayArrivals, subwayOffPeak,
    needsSubway,
    loadErr,
    isLoading: !allData && !loadErr,
  };
}
