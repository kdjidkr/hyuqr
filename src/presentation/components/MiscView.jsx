// 컴포넌트: 체대 헬스장·인스타그램 등 기타 서비스 진입 그리드
import React, { useState } from 'react';
import { Dumbbell, ShieldCheck } from 'lucide-react';
import { GymTimetable } from './GymTimetable.jsx';
import { InstagramListView } from './InstagramListView.jsx';

const InstagramIcon = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);


const cardClass = "bg-white border border-[#e2e8f0] rounded-card px-4 py-6 flex flex-col items-center text-center gap-3 cursor-pointer transition-all duration-200 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] hover:-translate-y-0.5 hover:border-hyu-blue-light hover:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1)] active:scale-[0.98]";

export function MiscView() {
  const [subView, setSubView] = useState('list');

  if (subView === 'gym')   return <GymTimetable onBack={() => setSubView('list')} />;
  if (subView === 'insta') return <InstagramListView onBack={() => setSubView('list')} />;

  return (
    <div className="pb-20 [animation:slideUp_0.4s_ease-out]">
      <h2 className="text-2xl font-extrabold text-text-main mb-1">기타 서비스</h2>
      <p className="text-base text-text-sub mb-8">학교 생활을 위한 기능 모음</p>

      <div className="grid grid-cols-2 gap-4">
        <div className={cardClass} onClick={() => setSubView('gym')}>
          <div className="w-14 h-14 bg-surface rounded-card flex items-center justify-center">
            <Dumbbell size={28} color="var(--hyu-blue)" />
          </div>
          <div className="flex flex-col">
            <span className="text-[0.95rem] font-extrabold text-text-main">체대 헬스장</span>
            <span className="text-[0.8rem] text-text-sub">시간표 조회</span>
          </div>
        </div>

        <div className={cardClass} onClick={() => setSubView('insta')}>
          <div className="w-14 h-14 bg-surface rounded-card flex items-center justify-center">
            <InstagramIcon size={28} color="#E4405F" />
          </div>
          <div className="flex flex-col">
            <span className="text-[0.95rem] font-extrabold text-text-main">학교 인스타그램</span>
            <span className="text-[0.8rem] text-text-sub">에리카 &amp; 단과대 계정</span>
          </div>
        </div>

      </div>

      <div className="mt-6">
        <div
          className="bg-white border border-[#e2e8f0] rounded-card px-5 py-4 flex items-center gap-3 cursor-pointer transition-all duration-200 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] hover:border-hyu-blue-light active:scale-[0.98]"
          onClick={() => window.open('/privacy.html', '_blank')}
        >
          <ShieldCheck size={20} color="#64748b" />
          <span className="text-[0.9rem] font-semibold text-text-sub">개인정보처리방침</span>
        </div>
      </div>
    </div>
  );
}
