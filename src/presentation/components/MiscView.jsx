// 컴포넌트: 체대 헬스장·인스타그램 등 기타 서비스 진입 그리드
import React, { useState } from 'react';
import { Dumbbell, LayoutGrid, ArrowUpRight } from 'lucide-react';
import { GymTimetable } from './GymTimetable.jsx';
import { InstagramListView } from './InstagramListView.jsx';

const InstagramIcon = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const PianoIcon = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M9 3v18" />
    <path d="M15 3v18" />
    <rect x="6" y="3" width="5" height="11" fill={color} stroke="none" />
    <rect x="13" y="3" width="5" height="11" fill={color} stroke="none" />
  </svg>
);

export function MiscView() {
  const [subView, setSubView] = useState('list');

  if (subView === 'gym')   return <GymTimetable onBack={() => setSubView('list')} />;
  if (subView === 'insta') return <InstagramListView onBack={() => setSubView('list')} />;

  return (
    <div className="misc-container">
      <h2 className="section-title">기타 서비스</h2>
      <p className="section-subtitle">학교 생활을 위한 기능 모음</p>

      <div className="misc-grid">
        <div className="misc-card" onClick={() => setSubView('gym')}>
          <div className="misc-icon-wrapper">
            <Dumbbell size={28} color="var(--hyu-blue)" />
          </div>
          <div className="misc-card-info">
            <span className="misc-card-title">체대 헬스장</span>
            <span className="misc-card-desc">시간표 조회</span>
          </div>
        </div>

        <div className="misc-card" onClick={() => setSubView('insta')}>
          <div className="misc-icon-wrapper">
            <InstagramIcon size={28} color="#E4405F" />
          </div>
          <div className="misc-card-info">
            <span className="misc-card-title">학교 인스타그램</span>
            <span className="misc-card-desc">에리카 &amp; 단과대 계정</span>
          </div>
        </div>

        <div className="misc-card" onClick={() => window.location.href = 'https://hanjari.site'}>
          <div className="misc-icon-wrapper">
            <PianoIcon size={28} color="#0EA5E9" />
          </div>
          <div className="misc-card-info">
            <span className="misc-card-title">
              동아리 <ArrowUpRight size={14} style={{ display: 'inline', marginLeft: '2px', verticalAlign: 'middle', opacity: 0.8 }} />
            </span>
            <span className="misc-card-desc">동아리 조회는 한자리</span>
          </div>
        </div>

        <div className="misc-card disabled">
          <div className="misc-icon-wrapper">
            <LayoutGrid size={28} style={{ opacity: 0.2 }} />
          </div>
          <div className="misc-card-info">
            <span className="misc-card-title">커밍순</span>
            <span className="misc-card-desc">준비 중입니다</span>
          </div>
        </div>
      </div>
    </div>
  );
}
