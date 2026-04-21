import React, { useState, useEffect, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { RefreshCw, Smartphone, Utensils, QrCode, ChevronLeft, ChevronRight } from 'lucide-react';
import './index.css';

// Helper for KST Date
const getKSTDate = () => new Date(new Date().getTime() + 9 * 60 * 60 * 1000);

function App() {
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);
  const [userData, setUserData] = useState(null);
  const [activeTab, setActiveTab] = useState('qr'); // 'qr' or 'cafe'
  
  // Menu State lifted for pre-fetching
  const [menuDate, setMenuDate] = useState(getKSTDate());
  const [cafes, setCafes] = useState([]);
  const [menuLoading, setMenuLoading] = useState(false);

  useEffect(() => {
    const storedToken = localStorage.getItem('pyxisAccessToken');
    const storedCreds = localStorage.getItem('pyxisEncryptedCreds');
    if (storedToken && storedCreds) {
      setToken(storedToken);
    }
    setLoading(false);
  }, []);

  const fetchMenus = useCallback(async (targetDate) => {
    setMenuLoading(true);
    const dateStr = targetDate.toISOString().split('T')[0].replace(/-/g, '/');
    try {
      const res = await fetch(`/api/menu?id=all&date=${dateStr}`);
      const data = await res.json();
      if (data.success) {
        setCafes(data.data);
      }
    } catch (e) { console.error(e); }
    setMenuLoading(false);
  }, []);

  // Pre-fetch effect: Runs on mount and whenever menuDate changes
  useEffect(() => {
    fetchMenus(menuDate);
  }, [menuDate, fetchMenus]);

  const handleLoginSuccess = (accessToken, encryptedCredentials, name) => {
    localStorage.setItem('pyxisAccessToken', accessToken);
    localStorage.setItem('pyxisEncryptedCreds', encryptedCredentials);
    setToken(accessToken);
    if (name) setUserData({ name });
  };

  const handleLogout = () => {
    localStorage.removeItem('pyxisAccessToken');
    localStorage.removeItem('pyxisEncryptedCreds');
    setToken(null);
    setUserData(null);
  };

  const changeMenuDate = (offset) => {
    const newDate = new Date(menuDate);
    newDate.setDate(menuDate.getDate() + offset);
    setMenuDate(newDate);
  };

  if (loading) {
    return (
      <div className="loader-overlay">
        <div className="loader-spinner"></div>
        <p style={{ color: 'var(--text-secondary)' }}>한양대 연동 중...</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="main-content">
        {activeTab === 'qr' ? (
          token ? (
            <QRView token={token} setToken={setToken} onLogout={handleLogout} />
          ) : (
            <LoginForm onSuccess={handleLoginSuccess} />
          )
        ) : (
          <CafeteriaView 
            date={menuDate} 
            changeDate={changeMenuDate} 
            cafes={cafes} 
            loading={menuLoading} 
          />
        )}
      </div>
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}

function LoginForm({ onSuccess }) {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('idle');
  const [errMsg, setErrMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!loginId || !password) return;
    setStatus('loading');
    setErrMsg('');
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loginId, password })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onSuccess(data.accessToken, data.encryptedCredentials, data.name);
      } else {
        setStatus('error');
        setErrMsg(data.message || '로그인 실패');
      }
    } catch (err) {
      setStatus('error');
      setErrMsg('서버 통신 오류');
    }
  };

  return (
    <div className="glass-panel">
      <h1 className="title">HYU QR Pass</h1>
      <p className="subtitle">빠른 입장을 위한 모바일 QR 패스</p>
      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label>포털 아이디</label>
          <input type="text" className="input-field" value={loginId} onChange={e => setLoginId(e.target.value)} placeholder="포털 아이디" required />
        </div>
        <div className="input-group">
          <label>비밀번호</label>
          <input type="password" className="input-field" value={password} onChange={e => setPassword(e.target.value)} placeholder="포털 비밀번호" required />
        </div>
        <button type="submit" className="primary-btn" disabled={status === 'loading'} style={{ marginTop: '1.5rem' }}>
          {status === 'loading' ? <div className="spinner" /> : '로그인 연동하기'}
        </button>
        {status === 'error' && <p className="error-msg">{errMsg}</p>}
      </form>
    </div>
  );
}

function QRView({ token, setToken, onLogout }) {
  const [qrData, setQrData] = useState(null);
  const [seatData, setSeatData] = useState(null);
  const [status, setStatus] = useState('loading'); // 'loading', 'ready', 'error'
  const [refreshing, setRefreshing] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);

  const fetchQR = useCallback(async (currentToken) => {
    setRefreshing(true);
    setTimeLeft(30);
    try {
      const res = await fetch('/api/qr', { headers: { 'X-Pyxis-Auth-Token': currentToken } });
      if (res.status === 401) {
        const creds = localStorage.getItem('pyxisEncryptedCreds');
        if (!creds) { onLogout(); return; }
        const reloginRes = await fetch('/api/relogin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ encryptedCredentials: creds })
        });
        const reloginData = await reloginRes.json();
        if (reloginRes.ok && reloginData.success) {
          localStorage.setItem('pyxisAccessToken', reloginData.accessToken);
          setToken(reloginData.accessToken);
          return fetchQR(reloginData.accessToken);
        } else { onLogout(); }
        return;
      }
      const data = await res.json();
      const mCard = data.data?.membershipCard || data.data?.data?.membershipCard || (typeof data.data === 'string' ? data.data : null);
      if (mCard) setQrData(mCard);
      
      const seatRes = await fetch('/api/seat', { headers: { 'X-Pyxis-Auth-Token': currentToken } });
      if (seatRes.ok) {
        const sData = await seatRes.json();
        if (sData.success && sData.data?.list?.[0]?.seat?.[0]) setSeatData(sData.data.list[0].seat[0]);
        else setSeatData(null);
      }
      setStatus('ready');
    } catch (err) { 
      setStatus(prev => prev === 'loading' ? 'error' : prev);
    } finally {
      setRefreshing(false);
    }
  }, [onLogout, setToken]); // Removed qrData to avoid infinite loop

  useEffect(() => { if (token) fetchQR(token); }, [token, fetchQR]);

  useEffect(() => {
    if (status !== 'ready' || timeLeft <= 0 || refreshing) {
      if (timeLeft === 0 && !refreshing) fetchQR(token);
      return;
    }
    const timer = setInterval(() => setTimeLeft(p => p - 1), 1000);
    return () => clearInterval(timer);
  }, [status, timeLeft, token, fetchQR, refreshing]);

  if (status === 'loading') return <div className="qr-glass-panel"><div className="loader-spinner" style={{ borderColor: 'rgba(0,0,0,0.1)', borderTopColor: 'var(--hyu-blue)' }}></div><p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '1rem' }}>인증 코드를 불러오는 중...</p></div>;
  if (status === 'error') return <div className="qr-glass-panel"><p style={{ color: '#ef4444', marginBottom: '1.5rem' }}>오류가 발생했습니다.</p><button className="qr-refresh-btn" onClick={() => fetchQR(token)}>다시 시도</button></div>;

  return (
    <div className="qr-glass-panel" style={{ opacity: refreshing ? 0.7 : 1, transition: 'opacity 0.2s' }}>
      <h2 className="qr-title">출입증 QR</h2>
      <p className="qr-desc">스캐너에 화면을 인식시켜주세요.</p>
      <div className="qr-wrapper" style={{ filter: refreshing ? 'blur(2px)' : 'none' }}>
        <QRCodeSVG value={qrData} size={220} level="M" />
      </div>
      <div style={{ color: timeLeft <= 5 ? '#ef4444' : '#10b981', fontWeight: '700', fontSize: '1rem', marginBottom: '1rem' }}>
        {refreshing ? '갱신 중...' : `유효시간: ${timeLeft}초`}
      </div>
      {seatData && (
        <div className="seat-info-card">
          <div className="seat-header"><span className="seat-room">{seatData.room?.name}</span><span className="seat-number">{seatData.seat}번 좌석</span></div>
          <div className="seat-time"><span>만료 예정: {seatData.endTime?.substring(11, 16)}</span><span className="seat-remaining">({seatData.remainingTime}분 남음)</span></div>
        </div>
      )}
      <button className="qr-refresh-btn" onClick={() => fetchQR(token)} disabled={refreshing}>
        <RefreshCw size={16} className={refreshing ? 'spin-animation' : ''} /> 
        <span>{refreshing ? '갱신 중...' : '새로고침'}</span>
      </button>
      <button className="qr-logout-btn" onClick={onLogout}>로그아웃</button>
      <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8', fontSize: '0.75rem' }}><Smartphone size={14} /> 화면 밝기 최대 권장</div>
    </div>
  );
}

function CafeteriaView({ date, changeDate, cafes, loading }) {
  const [selectedCafeId, setSelectedCafeId] = useState('re15');

  const selectedCafe = cafes.find(c => c.id === selectedCafeId) || { menus: [] };

  return (
    <div className="cafe-container">
      <div className="date-controller">
        <button className="date-btn" onClick={() => changeDate(-1)} disabled={loading}>
          <ChevronLeft style={{ opacity: loading ? 0.3 : 1 }} />
        </button>
        <div className="date-text" style={{ opacity: loading ? 0.5 : 1 }}>
          {date.toISOString().split('T')[0].replace(/-/g, '.')}
        </div>
        <button className="date-btn" onClick={() => changeDate(1)} disabled={loading}>
          <ChevronRight style={{ opacity: loading ? 0.3 : 1 }} />
        </button>
      </div>

      <div className="cafe-selector" style={{ opacity: loading ? 0.6 : 1, pointerEvents: loading ? 'none' : 'auto' }}>
        {cafes.map(cafe => (
          <div 
            key={cafe.id} 
            className={`cafe-chip ${selectedCafeId === cafe.id ? 'active' : ''} ${!cafe.available ? 'disabled' : ''}`}
            onClick={() => setSelectedCafeId(cafe.id)}
          >
            {cafe.name}
            {cafe.hasJeyuk && <span className="jeyuk-badge">🔥 제육</span>}
          </div>
        ))}
      </div>

      <div className="menu-list" style={{ position: 'relative', minHeight: '200px' }}>
        {/* Loading Overlay */}
        {loading && (
          <div style={{ 
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, 
            background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)',
            zIndex: 10, borderRadius: '16px', display: 'flex', 
            justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: '1rem'
          }}>
            <div className="loader-spinner" style={{ width: '40px', height: '40px' }}></div>
            <span style={{ fontSize: '0.85rem', color: 'white', fontWeight: '600' }}>식단 정보를 가져오는 중...</span>
          </div>
        )}

        <div style={{ filter: loading ? 'blur(2px)' : 'none', transition: 'filter 0.3s ease' }}>
          {cafes.length > 0 ? (
            selectedCafe.menus.length > 0 ? (
              selectedCafe.menus.map((m, i) => (
                <div key={i} className="menu-card">
                  <div className="menu-type">{m.type}</div>
                  <div className="menu-items" style={{ whiteSpace: 'pre-line' }}>{m.menu}</div>
                </div>
              ))
            ) : (
              <div className="no-menu">해당 식당은 오늘 등록된 메뉴가 없습니다.</div>
            )
          ) : !loading && (
            <div className="no-menu">정보를 불러올 수 없습니다.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function BottomNav({ activeTab, setActiveTab }) {
  return (
    <div className="bottom-nav">
      <div className={`nav-item ${activeTab === 'qr' ? 'active' : ''}`} onClick={() => setActiveTab('qr')}>
        <QrCode size={24} />
        <span className="nav-item-text">QR 출입증</span>
      </div>
      <div className={`nav-item ${activeTab === 'cafe' ? 'active' : ''}`} onClick={() => setActiveTab('cafe')}>
        <Utensils size={24} />
        <span className="nav-item-text">오늘의 식단</span>
      </div>
    </div>
  );
}

export default App;
