// 컴포넌트: 열람실 선택 및 좌석 번호 입력 예약 폼
import React, { useState } from 'react';
import { ROOMS, calcSeatId } from '../../domain/entities/Room.js';

export function ReserveForm({ onReserve, loading }) {
  const [selectedRoomIdx, setSelectedRoomIdx] = useState(0);
  const [seatNum, setSeatNum] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!seatNum) return;
    const room = ROOMS[selectedRoomIdx];
    const num = parseInt(seatNum, 10);
    if (isNaN(num) || num <= 0 || num > room.max) {
      alert(`좌석 번호는 1~${room.max} 사이여야 합니다.`);
      return;
    }
    onReserve(calcSeatId(room, num));
  };

  return (
    <div className="reserve-panel">
      <div className="reserve-header">
        <h3 className="reserve-title">좌석 예약하기</h3>
        <p className="reserve-subtitle">열람실과 좌석 번호를 입력하세요</p>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label>열람실 선택</label>
          <select
            className="input-field room-select"
            value={selectedRoomIdx}
            onChange={e => setSelectedRoomIdx(parseInt(e.target.value, 10))}
          >
            {ROOMS.map((room, idx) => (
              <option key={room.id} value={idx}>{room.name}</option>
            ))}
          </select>
        </div>
        <div className="input-group">
          <label>좌석 번호 (1~{ROOMS[selectedRoomIdx].max})</label>
          <input
            type="number"
            className="input-field"
            value={seatNum}
            onChange={e => setSeatNum(e.target.value)}
            placeholder="좌석 번호"
            required
          />
        </div>
        <button
          type="submit"
          className="primary-btn"
          disabled={loading}
          style={{ marginTop: '1rem' }}
        >
          {loading ? <div className="spinner" /> : '좌석 예약하기'}
        </button>
      </form>
    </div>
  );
}
