// 앱 루트 컴포넌트: 탭 라우팅 및 인증 상태 관리만 담당
import React, { useState, useCallback } from 'react';
import './index.css';
import { useAuth } from './presentation/hooks/useAuth.js';
import { useMenu } from './presentation/hooks/useMenu.js';
import { LoginForm }     from './presentation/components/LoginForm.jsx';
import { QRView }        from './presentation/components/QRView.jsx';
import { CafeteriaView } from './presentation/components/CafeteriaView.jsx';
import { ShuttleView }   from './presentation/components/ShuttleView.jsx';
import { MiscView }      from './presentation/components/MiscView.jsx';
import { BottomNav }     from './presentation/components/BottomNav.jsx';

const TAB_ORDER = ['cafe', 'shuttle', 'qr', 'misc'];

export default function App() {
  const [activeTab, setActiveTab] = useState('cafe');
  const [slideDir, setSlideDir] = useState('right');
  const { user, loading, login, relogin, logout, updateUser } = useAuth();
  const { menuDate, cafes, menuLoading, changeDate } = useMenu();

  const reloginFn = useCallback(() => relogin(), [relogin]);

  const handleNameDiscovered = useCallback((name) => {
    updateUser({ name });
  }, [updateUser]);

  const handleTabChange = useCallback((tab) => {
    const newIdx = TAB_ORDER.indexOf(tab);
    const curIdx = TAB_ORDER.indexOf(activeTab);
    setSlideDir(newIdx >= curIdx ? 'right' : 'left');
    setActiveTab(tab);
  }, [activeTab]);

  if (loading) {
    return (
      <div className="loader-overlay">
        <div className="loader-spinner" />
        <p style={{ color: 'var(--text-secondary)' }}>한양대 연동 중...</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div key={activeTab} className={`main-content tab-slide-${slideDir}`}>
        {activeTab === 'qr' ? (
          user ? (
            <QRView
              user={user}
              reloginFn={reloginFn}
              onNameDiscovered={handleNameDiscovered}
              onLogout={logout}
            />
          ) : (
            <LoginForm onSuccess={login} />
          )
        ) : activeTab === 'cafe' ? (
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
  );
}
