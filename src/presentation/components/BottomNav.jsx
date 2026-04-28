// 컴포넌트: QR·식단·셔틀·기타 탭 하단 내비게이션 바
import React from 'react';
import { BookOpen, Utensils, LayoutGrid } from 'lucide-react';

const BusIcon = () => (
  <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="5" width="20" height="13" rx="2" />
    <path d="M2 11h20" />
    <circle cx="7" cy="18" r="1.5" /><circle cx="17" cy="18" r="1.5" />
  </svg>
);

export function BottomNav({ activeTab, setActiveTab }) {
  return (
    <div className="bottom-nav">
      <div className={`nav-item ${activeTab === 'cafe'    ? 'active' : ''}`} onClick={() => setActiveTab('cafe')}>
        <Utensils size={24} />
        <span className="nav-item-text">식단</span>
      </div>
      <div className={`nav-item ${activeTab === 'shuttle' ? 'active' : ''}`} onClick={() => setActiveTab('shuttle')}>
        <BusIcon />
        <span className="nav-item-text">셔틀·지하철</span>
      </div>
      <div className={`nav-item ${activeTab === 'qr'      ? 'active' : ''}`} onClick={() => setActiveTab('qr')}>
        <BookOpen size={24} />
        <span className="nav-item-text">도서관</span>
      </div>
      <div className={`nav-item ${activeTab === 'misc'    ? 'active' : ''}`} onClick={() => setActiveTab('misc')}>
        <LayoutGrid size={24} />
        <span className="nav-item-text">기타</span>
      </div>
    </div>
  );
}
