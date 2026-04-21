import React, { useState, useEffect, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { RefreshCw, Smartphone, Utensils, QrCode, ChevronLeft, ChevronRight } from 'lucide-react';
import './index.css';

// Helper for KST Date
const getKSTDate = () => new Date(new Date().getTime() + 9 * 60 * 60 * 1000);

const ROOMS = [
  { id: 61, name: '제1열람실 (2F)', max: 324, offset: 2276 },
  { id: 63, name: '제2열람실 (4F)', max: 218, offset: 2786 },
  { id: 132, name: '노상일 HOLMZ (4F)', max: 83, offset: 3823 },
  { id: 131, name: '집중열람실 (4F)', max: 10, offset: 3811 }
];

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

  const fetchQR = useCallback(async (currentToken, isRetry = false) => {
    setRefreshing(true);
    if (!isRetry) setTimeLeft(30);

    try {
      const res = await fetch('/api/qr', { headers: { 'X-Pyxis-Auth-Token': currentToken } });

      // Handle non-OK responses (like 401 Unauthorized or stale cache 304/etc)
      if (!res.ok) {
        // If it's a first attempt and we have credentials, try automatic relogin
        if (!isRetry) {
          const creds = localStorage.getItem('pyxisEncryptedCreds');
          if (creds) {
            try {
              const reloginRes = await fetch('/api/relogin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ encryptedCredentials: creds })
              });
              const reloginData = await reloginRes.json();
              if (reloginRes.ok && reloginData.success) {
                localStorage.setItem('pyxisAccessToken', reloginData.accessToken);
                setToken(reloginData.accessToken);
                // Retry fetch with new token
                return fetchQR(reloginData.accessToken, true);
              }
            } catch (reloginErr) {
              console.error('Auto-relogin failed:', reloginErr);
            }
          }
        }

        // If relogin failed or wasn't possible, and it's a 401, force logout
        if (res.status === 401) {
          onLogout();
          return;
        }

        throw new Error(`Fetch failed with status ${res.status}`);
      }

      const data = await res.json();
      const mCard = data.data?.membershipCard || data.data?.data?.membershipCard || (typeof data.data === 'string' ? data.data : null);

      if (mCard) {
        setQrData(mCard);
        setStatus('ready');
      } else {
        throw new Error('QR data not found in response');
      }

      // Fetch seat data as well
      try {
        const seatRes = await fetch('/api/seat', { headers: { 'X-Pyxis-Auth-Token': currentToken } });
        if (seatRes.ok) {
          const sData = await seatRes.json();
          if (sData.success && sData.data?.list?.[0]) {
            const item = sData.data.list[0];
            // list[0].seat[0] 형태이거나 list[0].seat 형태일 수 있음 (유연하게 처리)
            const seatObj = Array.isArray(item.seat) ? item.seat[0] : item.seat;
            
            if (seatObj) {
              const seat = {
                ...seatObj, // 기존 필드 유지
                id: item.id || seatObj.id,
                room: item.room || seatObj.room,
                endTime: item.endTime || seatObj.endTime,
                state: item.state || seatObj.state,
                checkinExpiryDate: item.checkinExpiryDate || seatObj.checkinExpiryDate,
                remainTime: item.remainTime ?? item.remainingTime ?? seatObj.remainTime ?? seatObj.remainingTime
              };

              // Calculate remaining minutes if field is missing or invalid
              if (seat.remainTime === undefined && seat.endTime) {
                try {
                  const end = new Date(seat.endTime.replace(/-/g, '/'));
                  const now = new Date();
                  const diff = Math.floor((end - now) / 60000);
                  seat.remainTime = Math.max(0, diff);
                } catch (e) { console.error('Time calc error', e); }
              }
              setSeatData(seat);
            }
          } else {
            setSeatData(null);
          }
        }
      } catch (seatErr) {
        console.error('Failed to fetch seat data:', seatErr);
      }

    } catch (err) {
      console.error('QR Fetch Error:', err);
      // Only set to error state if it's the initial load
      setStatus(prev => prev === 'loading' ? 'error' : prev);
    } finally {
      setRefreshing(false);
    }
  }, [onLogout, setToken, fetchQR, token]);

  const handleReserve = async (seatId) => {
    setRefreshing(true);
    try {
      const res = await fetch('/api/reserve', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Pyxis-Auth-Token': token 
        },
        body: JSON.stringify({ seatId })
      });
      const data = await res.json();
      if (data.success) {
        alert('예약되었습니다.');
        fetchQR(token);
      } else {
        alert(data.message || '예약 실패');
      }
    } catch (err) {
      console.error('Reserve error:', err);
      alert('통신 오류가 발생했습니다.');
    } finally {
      setRefreshing(false);
    }
  };

  const handleSeatReturn = async () => {
    if (!seatData) return;
    
    const confirmReturn = window.confirm(`${seatData.seat}번 자리를 반납할까요?`);
    if (!confirmReturn) return;

    setRefreshing(true);
    try {
      const res = await fetch('/api/discharge', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Pyxis-Auth-Token': token 
        },
        body: JSON.stringify({ seatCharge: seatData.id })
      });
      const data = await res.json();
      if (data.success) {
        alert('반납되었습니다.');
        setSeatData(null);
        fetchQR(token);
      } else {
        alert(data.message || '반납 실패');
      }
    } catch (err) {
      console.error('Return error:', err);
      alert('통신 오류가 발생했습니다.');
    } finally {
      setRefreshing(false);
    }
  };

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
  if (status === 'error') return (
    <div className="qr-glass-panel">
      <p style={{ color: '#ef4444', fontWeight: '600', marginBottom: '0.5rem' }}>오류가 발생했습니다.</p>
      <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1.5rem' }}>인증 세션이 만료되었거나<br />통신 상태가 원활하지 않습니다.</p>
      <button className="qr-refresh-btn" onClick={() => fetchQR(token)}>다시 시도</button>
      <button className="qr-logout-btn" onClick={onLogout} style={{ marginTop: '1rem' }}>로그아웃</button>
    </div>
  );

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
      
      {userData?.name && (
        <div style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: '600', marginBottom: '1rem' }}>
          반갑습니다, <span style={{ color: 'var(--hyu-blue)' }}>{userData.name}</span>님
        </div>
      )}

      {seatData ? (
        <div className={`seat-info-card ${seatData.state?.code === 'TEMP_CHARGE' ? 'is-temp' : 'is-confirmed'}`}>
          <div className="seat-header">
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <div className={`status-badge ${seatData.state?.code === 'TEMP_CHARGE' ? 'temp' : 'confirmed'}`}>
                {seatData.state?.code === 'TEMP_CHARGE' ? '확정 대기중' : '좌석 이용중'}
              </div>
              <span className="seat-room">{seatData.room?.name}</span>
            </div>
            <span className="seat-number">{seatData.seat || seatData.code}번 좌석</span>
          </div>

          {seatData.state?.code === 'TEMP_CHARGE' && seatData.checkinExpiryDate && (
            <div style={{ 
              background: 'rgba(245, 158, 11, 0.1)', 
              padding: '0.75rem', 
              borderRadius: '8px', 
              fontSize: '0.85rem', 
              color: '#b45309',
              fontWeight: '700',
              textAlign: 'center'
            }}>
              ⚠️ {seatData.checkinExpiryDate.substring(11, 16)}까지 좌석 배정을 완료해주세요
            </div>
          )}

          {seatData.state?.code !== 'TEMP_CHARGE' && (
            <div className="seat-time">
              <span>반납 예정: {seatData.endTime?.substring(11, 16)}</span>
              <span className="seat-remaining" style={{ color: 'var(--success)' }}>
                ({seatData.remainTime}분 남음)
              </span>
            </div>
          )}

          <button className="seat-return-btn" onClick={handleSeatReturn} disabled={refreshing}>
            {seatData.state?.code === 'TEMP_CHARGE' ? '예약 취소하기' : '좌석 반납하기'}
          </button>
        </div>
      ) : (
        <ReserveForm onReserve={handleReserve} loading={refreshing} />
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

function ReserveForm({ onReserve, loading }) {
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

    const seatId = room.offset + num;
    onReserve(seatId);
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
        <button type="submit" className="primary-btn" disabled={loading} style={{ marginTop: '1rem' }}>
          {loading ? <div className="spinner" /> : '좌석 예약하기'}
        </button>
      </form>
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
