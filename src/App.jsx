// 앱 루트 컴포넌트: 탭 라우팅 관리만 담당
import React, { useState, useCallback } from 'react';
import './index.css';
import { useMenu } from './presentation/hooks/useMenu.js';
import { CafeteriaView } from './presentation/components/CafeteriaView.jsx';
import { ShuttleView }   from './presentation/components/ShuttleView.jsx';
import { MiscView }      from './presentation/components/MiscView.jsx';
import { BottomNav }     from './presentation/components/BottomNav.jsx';
import { SplashScreen }  from './presentation/components/SplashScreen.jsx';
import { BootProvider, useBoot } from './presentation/context/BootContext';

const TAB_ORDER = ['cafe', 'shuttle', 'misc'];

export default function App() {
  return (
    <BootProvider>
      <MainLayout />
    </BootProvider>
  );
}

function MainLayout() {
  const [activeTab, setActiveTab] = useState(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.has('date') || p.has('cafe') || p.has('type')) return 'cafe';
    return localStorage.getItem('lastActiveTab') || 'cafe';
  });
  const [slideDir, setSlideDir] = useState('right');
  const { isAppReady, splashDone, completeSplash } = useBoot();
  
  const { menuDate, cafes, menuLoading, changeDate } = useMenu();

  const handleTabChange = useCallback((tab) => {
    const newIdx = TAB_ORDER.indexOf(tab);
    const curIdx = TAB_ORDER.indexOf(activeTab);
    setSlideDir(newIdx >= curIdx ? 'right' : 'left');
    setActiveTab(tab);
    localStorage.setItem('lastActiveTab', tab);
  }, [activeTab]);

  return (
    <>
      {!splashDone && (
        <SplashScreen 
          ready={isAppReady} 
          onDone={completeSplash} 
        />
      )}
      <div className="mx-auto w-full max-w-app min-h-screen px-5 py-6 flex flex-col overflow-x-hidden">
        <div key={activeTab} className={`tab-slide-${slideDir}`}>
          {activeTab === 'cafe' ? (
            <CafeteriaView
              date={menuDate}
              changeDate={changeDate}
              cafes={cafes}
              loading={menuLoading}
            />
          ) : activeTab === 'shuttle' ? (
            <ShuttleView />
          ) : (
            <MiscView />
          )}
        </div>
        <BottomNav activeTab={activeTab} setActiveTab={handleTabChange} />
      </div>
    </>
  );
}
