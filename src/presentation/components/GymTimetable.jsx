// 컴포넌트: 체대 헬스장 수업 시간표 캘린더 (현재 시간 인디케이터 포함)
import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';

const COLORS = {
  orange: { bg: '#FFF7ED', text: '#C2410C', border: '#FFEDD5' },
  teal:   { bg: '#F0FDFA', text: '#0F766E', border: '#CCFBF1' },
  green:  { bg: '#F7FEE7', text: '#4D7C0F', border: '#ECFCCB' },
  blue:   { bg: '#EFF6FF', text: '#1D4ED8', border: '#DBEAFE' },
  red:    { bg: '#FEF2F2', text: '#B91C1C', border: '#FEE2E2' },
};

const BASE_SCHEDULE = [
  { hour: 9,  label: '09', mon: '-', tue: '-', wed: '-', thu: '-', fri: { name: '교양피트니스', type: 'orange' } },
  { hour: 10, label: '10', mon: '-', tue: '-', wed: '-', thu: '-', fri: { name: '교양피트니스', type: 'orange' } },
  { hour: 11, label: '11', mon: '-', tue: '-', wed: '-', thu: '-', fri: '-' },
  { hour: 12, label: '12', mon: '-', tue: '-', wed: '-', thu: '-', fri: '-' },
  { hour: 13, label: '13', mon: { name: '청소시간', type: 'red' }, tue: { name: '교양피트니스', type: 'orange' }, wed: { name: 'ERICA 스트렝스', type: 'teal' }, thu: '-', fri: '-' },
  { hour: 14, label: '14', mon: '-', tue: { name: '교양피트니스', type: 'orange' }, wed: { name: 'ERICA 스트렝스', type: 'teal' }, thu: '-', fri: '-' },
  { hour: 15, label: '15', mon: '-', tue: '-', wed: '-', thu: '-', fri: '-' },
  { hour: 16, label: '16', mon: '-', tue: { name: '스포츠종합실기3', type: 'green' }, wed: { name: '스포츠종합실기3', type: 'green' }, thu: { name: '식이조절과운동', type: 'blue' }, fri: '-' },
  { hour: 17, label: '17', mon: '-', tue: { name: '스포츠종합실기3', type: 'green' }, wed: { name: '스포츠종합실기3', type: 'green' }, thu: { name: '식이조절과운동', type: 'blue' }, fri: '-' },
  { hour: 18, label: '18', mon: '-', tue: '-', wed: '-', thu: '-', fri: '-' },
  { hour: 19, label: '19', mon: '-', tue: '-', wed: '-', thu: '-', fri: '-' },
  { hour: 20, label: '20', mon: '-', tue: '-', wed: '-', thu: '-', fri: '-' },
];

const getMergedSchedule = () => {
  const days   = ['mon', 'tue', 'wed', 'thu', 'fri'];
  const merged = BASE_SCHEDULE.map(row => ({ ...row, spans: {} }));
  days.forEach(day => {
    for (let i = 0; i < BASE_SCHEDULE.length; i++) {
      const current = BASE_SCHEDULE[i][day];
      if (current === '-' || current === null) continue;
      let span = 1;
      while (i + span < BASE_SCHEDULE.length && BASE_SCHEDULE[i + span][day]?.name === current.name) span++;
      if (span > 1) {
        merged[i].spans[day] = span;
        for (let j = 1; j < span; j++) merged[i + j][day] = null;
        i += span - 1;
      }
    }
  });
  return merged;
};

export function GymTimetable({ onBack }) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const schedule = getMergedSchedule();

  const getNowPos = () => {
    const h = currentTime.getHours();
    const m = currentTime.getMinutes();
    const day = currentTime.getDay();
    if (h < 9 || h >= 21 || day === 0 || day === 6) return null;
    const rowIndex = BASE_SCHEDULE.findIndex(s => s.hour === h);
    if (rowIndex === -1) return null;
    const ROW_H = 40;
    return {
      top: 48 + rowIndex * ROW_H + (m / 60) * ROW_H,
      dayIndex: day - 1,
    };
  };

  const now = getNowPos();

  const renderCell = (cell, span) => {
    if (cell === null) return null;
    if (cell === '-') return <td className="cal-cell empty" />;
    const s = COLORS[cell.type];
    return (
      <td rowSpan={span} className="cal-cell busy">
        <div className="course-card" style={{ backgroundColor: s.bg, color: s.text, borderColor: s.border }}>
          <div className="course-name">{cell.name}</div>
        </div>
      </td>
    );
  };

  return (
    <div className="gym-container">
      <header className="gym-header">
        <button className="gym-back" onClick={onBack}><ArrowLeft size={20} /></button>
        <div className="gym-title-area">
          <div className="gym-title-main">
            <h1>체대 헬스장</h1>
            <span className="gym-badge">26년 1학기</span>
          </div>
          <p className="gym-subtitle">예체능대학 1층 · 평일 09:00 - 20:00</p>
        </div>
      </header>

      <div className="cal-wrapper">
        <div className="cal-card">
          {now && (
            <div className="cal-now-indicator" style={{ top: `${now.top}px` }}>
              <div className="cal-now-line" />
              <div
                className="cal-now-marker"
                style={{ left: `calc(12% + (88% / 5) * ${now.dayIndex} + (88% / 10))` }}
              >
                <span>지금</span>
              </div>
            </div>
          )}
          <table className="cal-table">
            <thead>
              <tr>
                <th style={{ width: '12%' }} />
                {['월', '화', '수', '목', '금'].map(d => (
                  <th key={d} style={{ width: '17.6%' }}>{d}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {schedule.map((row, i) => (
                <tr key={i}>
                  <td className="cal-time">{row.label}</td>
                  {renderCell(row.mon, row.spans.mon)}
                  {renderCell(row.tue, row.spans.tue)}
                  {renderCell(row.wed, row.spans.wed)}
                  {renderCell(row.thu, row.spans.thu)}
                  {renderCell(row.fri, row.spans.fri)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <footer className="gym-footer">
        <p>* 수업 시간에는 일반 학생 이용이 제한됩니다.</p>
        <p>* 학기별 수업 일정에 따라 변동될 수 있습니다.</p>
      </footer>
    </div>
  );
}
