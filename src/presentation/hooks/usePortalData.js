import { useState, useEffect } from 'react';

export function usePortalData() {
  const [weather, setWeather] = useState(null);
  const [library, setLibrary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      
      try {
        const weatherPromise = fetch('/api/weather').then(res => res.ok ? res.json() : null);
        const libraryPromise = getLibraryData();

        const [weatherData, libData] = await Promise.all([weatherPromise, libraryPromise]);
        
        setWeather(weatherData);
        setLibrary(libData);
        
        if (!weatherData && !libData) {
          setError('데이터를 불러오는 중 오류가 발생했습니다.');
        }
      } catch (err) {
        console.error('Portal data fetch error:', err);
        setError('데이터를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  return { weather, library, loading, error };
}

async function getLibraryData() {
  try {
    const res = await fetch('/api/library');
    if (!res.ok) throw new Error('Proxy not available');
    const json = await res.json();
    
    if (json.success) {
      const list = json.data.list.map(room => {
        const total = room.seats.total;
        const occupied = room.seats.occupied;
        const ratio = occupied / total;
        
        let status = '쾌적';
        let color = '#2563eb'; 
        let emoji = '🔵';
        
        if (ratio > 0.67) {
          status = '매우 혼잡';
          color = '#991b1b'; 
          emoji = '😫';
        } else if (ratio > 0.5) {
          status = '혼잡';
          color = '#ef4444'; 
          emoji = '🔴';
        } else if (ratio > 0.33) {
          status = '보통';
          color = '#22c55e'; 
          emoji = '🟢';
        }

        return { id: room.id, name: room.name, total, occupied, ratio, status, color, emoji };
      });

      const sortOrder = [61, 63, 132, 131];
      list.sort((a, b) => sortOrder.indexOf(a.id) - sortOrder.indexOf(b.id));

      return { list, updatedAt: Date.now() };
    }
  } catch (e) {
    return {
      list: [
        { id: 61, name: "제1열람실 (2F)", total: 321, occupied: 25, ratio: 0.07, status: '쾌적', color: '#2563eb', emoji: '🔵' },
        { id: 63, name: "제2열람실 (4F)", total: 216, occupied: 47, ratio: 0.21, status: '쾌적', color: '#2563eb', emoji: '🔵' },
        { id: 132, name: "노상일 HOLMZ (4F)", total: 82, occupied: 18, ratio: 0.21, status: '쾌적', color: '#2563eb', emoji: '🔵' },
        { id: 131, name: "집중열람실 (4F)", total: 12, occupied: 5, ratio: 0.41, status: '보통', color: '#22c55e', emoji: '🟢' }
      ],
      updatedAt: Date.now()
    };
  }
  return null;
}
