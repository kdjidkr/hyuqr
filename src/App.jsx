import React, { useState, useEffect, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { RefreshCw, Smartphone, Utensils, QrCode, ChevronLeft, ChevronRight, LayoutGrid, Dumbbell, ArrowLeft, Activity, Target, Zap, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import './index.css';

// Helper for KST Date
const getKSTDate = () => new Date(new Date().getTime() + 9 * 60 * 60 * 1000);

const InstagramIcon = ({ size = 24, color = "currentColor" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

const ROOMS = [
  { id: 61, name: '제1열람실 (2F)', max: 324, offset: 2276 },
  { id: 63, name: '제2열람실 (4F)', max: 218, offset: 2786 },
  { id: 132, name: '노상일 HOLMZ (4F)', max: 83, offset: 3823 },
  { id: 131, name: '집중열람실 (4F)', max: 10, offset: 3811 }
];

const INSTA_ACCOUNTS = {
  erica: [
    { username: 'hanyang_erica', desc: '한양대학교 ERICA 공식 인스타그램' },
    { username: 'hanyang_erica_stu', desc: 'ERICA 총학생회' },
    { username: 'hanyang_erica_club_association', desc: '총동아리연합회' },
    { username: 'hyuerica', desc: '학술정보관' },
    { username: 'hanyangerica', desc: '사랑한대' }
  ],
  college: [
    { username: 'hyu_lions', desc: 'LIONS 칼리지 학생회' },
    { username: 'hyu_soongan_', desc: '커뮤니케이션&컬쳐대학' },
    { username: 'hyu_erica_eng', desc: '공학대학' },
    { username: 'hypharmacy', desc: '약학대학' },
    { username: 'design_hyu', desc: '디자인대학' },
    { username: 'hanyang_gon', desc: '글로벌문화통상대학' },
    { username: 'hyu_mood', desc: '경상대학' },
    { username: 'hyu_computing', desc: '소프트웨어융합대학' },
    { username: 'hyu_e_sports_and_arts_vibe', desc: '예체능대학' },
    { username: 'hyu_erica_atc', desc: '첨단융합대학' }
  ]
};

function App() {
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);
  const [userData, setUserData] = useState(null);
  const [activeTab, setActiveTab] = useState(() => {
    const saved = localStorage.getItem('lastActiveTab');
    return (saved === 'cafe' || saved === 'qr') ? saved : 'cafe';
  });

  // Persist activeTab (excluding 'misc')
  useEffect(() => {
    if (activeTab === 'cafe' || activeTab === 'qr') {
      localStorage.setItem('lastActiveTab', activeTab);
    } else if (activeTab === 'misc') {
      localStorage.removeItem('lastActiveTab');
    }
  }, [activeTab]);
  const [menuDate, setMenuDate] = useState(getKSTDate());
  const [cafes, setCafes] = useState([]);
  const [menuLoading, setMenuLoading] = useState(false);

  // QR & Seat State lifted for pre-fetching
  const [qrData, setQrData] = useState(null);
  const [seatData, setSeatData] = useState(null);
  const [qrStatus, setQrStatus] = useState('idle'); // 'idle', 'loading', 'ready', 'error'
  const [qrRefreshing, setQrRefreshing] = useState(false);
  const [qrTimeLeft, setQrTimeLeft] = useState(30);

  useEffect(() => {
    const storedToken = localStorage.getItem('pyxisAccessToken');
    const storedCreds = localStorage.getItem('pyxisEncryptedCreds');
    if (storedToken && storedCreds) {
      setToken(storedToken);
    }
    setLoading(false);
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('pyxisAccessToken');
    localStorage.removeItem('pyxisEncryptedCreds');
    setToken(null);
    setUserData(null);
  }, []);

  const handleLoginSuccess = useCallback((accessToken, encryptedCredentials, name) => {
    localStorage.setItem('pyxisAccessToken', accessToken);
    localStorage.setItem('pyxisEncryptedCreds', encryptedCredentials);
    setToken(accessToken);
    if (name) setUserData({ name });
  }, []);

  const changeMenuDate = useCallback((offset) => {
    const newDate = new Date(menuDate);
    newDate.setDate(menuDate.getDate() + offset);
    setMenuDate(newDate);
  }, [menuDate]);

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

  const fetchQR = useCallback(async (currentToken, isRetry = false, forceRelogin = false) => {
    setQrRefreshing(true);
    if (!isRetry) setQrTimeLeft(30);

    if (forceRelogin && !isRetry) {
      const creds = localStorage.getItem('pyxisEncryptedCreds');
      if (creds) {
        try {
          const reloginRes = await fetch('/api/relogin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ encryptedCredentials: creds })
          });

          if (reloginRes.ok) {
            const reloginData = await reloginRes.json();
            if (reloginData.success) {
              localStorage.setItem('pyxisAccessToken', reloginData.accessToken);
              setToken(reloginData.accessToken);
              return fetchQR(reloginData.accessToken, true);
            }
          }
          handleLogout();
          return;
        } catch (e) {
          handleLogout();
          return;
        }
      }
    }

    try {
      setQrStatus(prev => prev === 'idle' ? 'loading' : prev);
      const res = await fetch('/api/qr', { headers: { 'X-Pyxis-Auth-Token': currentToken } });

      if (!res.ok) {
        if (!isRetry) {
          const creds = localStorage.getItem('pyxisEncryptedCreds');
          if (creds) {
            try {
              const reloginRes = await fetch('/api/relogin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ encryptedCredentials: creds })
              });

              if (!reloginRes.ok) {
                handleLogout();
                return;
              }

              const reloginData = await reloginRes.json();
              if (reloginData.success) {
                localStorage.setItem('pyxisAccessToken', reloginData.accessToken);
                setToken(reloginData.accessToken);
                return fetchQR(reloginData.accessToken, true);
              } else {
                handleLogout();
                return;
              }
            } catch (reloginErr) {
              console.error('Auto-relogin failed:', reloginErr);
              handleLogout();
              return;
            }
          }
        }

        if (res.status === 401 || res.status === 403) {
          handleLogout();
          return;
        }

        throw new Error(`Fetch failed with status ${res.status}`);
      }

      const data = await res.json();
      const mCard = data.data?.membershipCard || data.data?.data?.membershipCard || (typeof data.data === 'string' ? data.data : null);

      if (mCard && mCard !== "null" && mCard !== "undefined" && mCard.trim() !== "") {
        setQrData(mCard);

        const name = data.data?.patron?.name || data.data?.data?.patron?.name;
        if (name) {
          setUserData(prev => ({ ...prev, name }));
        }

        setQrStatus('ready');
      } else {
        if (!isRetry) {
          const creds = localStorage.getItem('pyxisEncryptedCreds');
          if (creds) {
            try {
              const reloginRes = await fetch('/api/relogin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ encryptedCredentials: creds })
              });
              if (reloginRes.ok) {
                const reloginData = await reloginRes.json();
                if (reloginData.success) {
                  localStorage.setItem('pyxisAccessToken', reloginData.accessToken);
                  setToken(reloginData.accessToken);
                  return fetchQR(reloginData.accessToken, true);
                }
              }
            } catch (e) { /* ignore and let it throw below */ }
          }
        }
        throw new Error('QR data not found or invalid in response');
      }

      try {
        const seatRes = await fetch('/api/seat', { headers: { 'X-Pyxis-Auth-Token': currentToken } });
        if (seatRes.ok) {
          const sData = await seatRes.json();
          if (sData.success && sData.data?.list?.[0]) {
            const item = sData.data.list[0];
            const seatObj = Array.isArray(item.seat) ? item.seat[0] : item.seat;

            if (seatObj) {
              const seat = {
                ...seatObj,
                id: item.id || seatObj.id,
                room: item.room || seatObj.room,
                endTime: item.endTime || seatObj.endTime,
                state: item.state || seatObj.state,
                checkinExpiryDate: item.checkinExpiryDate || seatObj.checkinExpiryDate,
                remainTime: item.remainTime ?? item.remainingTime ?? seatObj.remainTime ?? seatObj.remainingTime
              };

              if (seat.remainTime === undefined && seat.endTime) {
                try {
                  const end = new Date(seat.endTime.replace(/-/g, '/'));
                  const now = new Date();
                  const diff = Math.floor((end - now) / 60000);
                  seat.remainTime = Math.max(0, diff);
                } catch (e) { console.error('Time calc error', e); }
              }
              setSeatData(seat);
            } else {
              setSeatData(null);
            }
          } else {
            setSeatData(null);
          }
        }
      } catch (e) { console.error('Seat check failed', e); }

    } catch (err) {
      console.error('QR Fetch Error:', err);
      setQrStatus('error');
    } finally {
      setQrRefreshing(false);
    }
  }, [handleLogout]);

  const handleReserve = useCallback(async (seatId) => {
    if (!token) return;
    setQrRefreshing(true);
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
      setQrRefreshing(false);
    }
  }, [token, fetchQR]);

  const handleSeatReturn = useCallback(async () => {
    if (!token || !seatData) return;

    const isTemp = seatData.state?.code === 'TEMP_CHARGE';
    const actionText = isTemp ? '예약을 취소하시겠습니까?' : `${seatData.seat || seatData.code}번 자리를 반납할까요?`;

    const confirmAction = window.confirm(actionText);
    if (!confirmAction) return;

    setQrRefreshing(true);
    try {
      const endpoint = isTemp ? '/api/cancel' : '/api/discharge';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Pyxis-Auth-Token': token
        },
        body: JSON.stringify({ seatCharge: seatData.id })
      });
      const data = await res.json();
      if (data.success) {
        alert(isTemp ? '예약이 취소되었습니다.' : '반납되었습니다.');
        setSeatData(null);
        fetchQR(token);
      } else {
        alert(data.message || (isTemp ? '취소 실패' : '반납 실패'));
      }
    } catch (err) {
      console.error('Seat action error:', err);
      alert('통신 오류가 발생했습니다.');
    } finally {
      setQrRefreshing(false);
    }
  }, [token, seatData, fetchQR]);

  // Pre-fetch effect: Runs on mount and whenever menuDate changes
  useEffect(() => {
    fetchMenus(menuDate);
  }, [menuDate, fetchMenus]);

  // Pre-fetch QR: Runs as soon as token is available
  useEffect(() => {
    if (token && qrStatus === 'idle') {
      fetchQR(token);
    }
  }, [token, qrStatus]); // Removed fetchQR from dependencies to avoid loop if it re-creates


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
            <QRView
              token={token}
              onLogout={handleLogout}
              userData={userData}
              qrData={qrData}
              seatData={seatData}
              status={qrStatus}
              refreshing={qrRefreshing}
              timeLeft={qrTimeLeft}
              setTimeLeft={setQrTimeLeft}
              onRefresh={() => fetchQR(token)}
              onReserve={handleReserve}
              onReturn={handleSeatReturn}
            />
          ) : (
            <LoginForm onSuccess={handleLoginSuccess} />
          )
        ) : activeTab === 'cafe' ? (
          <CafeteriaView
            date={menuDate}
            changeDate={changeMenuDate}
            cafes={cafes}
            loading={menuLoading}
          />
        ) : (
          <MiscView />
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
        setErrMsg(data.message || 'Login failed');
      }
    } catch (err) {
      setStatus('error');
      setErrMsg('Server error');
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

function QRView({
  token,
  onLogout,
  userData,
  qrData,
  seatData,
  status,
  refreshing,
  timeLeft,
  setTimeLeft,
  onRefresh,
  onReserve,
  onReturn
}) {
  useEffect(() => {
    if (status !== 'ready') return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          onRefresh();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [status, onRefresh, setTimeLeft]);

  if (status === 'loading' || (status === 'idle' && token)) {
    return (
      <div className="qr-glass-panel">
        <div className="loader-spinner" style={{ borderColor: 'rgba(0,0,0,0.1)', borderTopColor: 'var(--hyu-blue)' }}></div>
        <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '1rem' }}>인증 코드를 불러오는 중...</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="qr-glass-panel">
        <p style={{ color: '#ef4444', fontWeight: '600', marginBottom: '0.5rem' }}>오류가 발생했습니다.</p>
        <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1.5rem' }}>인증 세션이 만료되었거나<br />통신 상태가 원활하지 않습니다.</p>
        <button className="qr-refresh-btn" onClick={() => onRefresh()}>다시 시도</button>
        <button className="qr-logout-btn" onClick={onLogout} style={{ marginTop: '1rem' }}>로그아웃</button>
      </div>
    );
  }

  return (
    <div className="qr-glass-panel" style={{ opacity: refreshing ? 0.7 : 1, transition: 'opacity 0.2s' }}>
      <h2 className="qr-title">출입증 QR</h2>
      {userData?.name && (
        <div style={{ marginBottom: '0.25rem', fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-primary)' }}>
          {userData.name}님 안녕하세요!
        </div>
      )}
      <p className="qr-desc">스캐너에 화면을 인식시켜주세요.</p>
      <div className="qr-wrapper" style={{ filter: refreshing ? 'blur(2px)' : 'none' }}>
        {qrData && <QRCodeSVG value={qrData} size={220} level="M" />}
      </div>
      <div style={{ color: timeLeft <= 5 ? '#ef4444' : '#10b981', fontWeight: '700', fontSize: '1rem', marginBottom: '0.5rem' }}>
        {refreshing ? 'Refreshing...' : `유효시간: ${timeLeft}초`}
      </div>

      <button className="qr-refresh-btn" onClick={onRefresh} disabled={refreshing} style={{ marginBottom: '1.5rem' }}>
        <RefreshCw size={16} className={refreshing ? 'spin-animation' : ''} />
        <span>{refreshing ? 'Refreshing...' : 'QR 새로고침'}</span>
      </button>

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

          <button className="seat-return-btn" onClick={onReturn} disabled={refreshing}>
            {seatData.state?.code === 'TEMP_CHARGE' ? '예약 취소하기' : '좌석 반납하기'}
          </button>
        </div>
      ) : (
        <ReserveForm onReserve={onReserve} loading={refreshing} />
      )}

      <button className="qr-logout-btn" onClick={onLogout} style={{ marginTop: '1rem' }}>로그아웃</button>
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
  const [selectedCafeId, setSelectedCafeId] = useState(() => {
    return localStorage.getItem('lastSelectedCafeId') || 're12';
  });

  // Persist selected cafe
  useEffect(() => {
    localStorage.setItem('lastSelectedCafeId', selectedCafeId);
  }, [selectedCafeId]);
  const [expandedGroups, setExpandedGroups] = useState({});

  const selectedCafe = cafes.find(c => c.id === selectedCafeId) || { menus: [] };

  const formatDate = (targetDate) => {
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    const month = targetDate.getUTCMonth() + 1;
    const day = targetDate.getUTCDate();
    const dayName = days[targetDate.getUTCDay()];

    const base = `${month}월 ${day}일 (${dayName})`;

    const nowKst = new Date(new Date().getTime() + 9 * 60 * 60 * 1000);
    const todayStr = nowKst.toISOString().split('T')[0];
    const targetStr = targetDate.toISOString().split('T')[0];

    if (todayStr === targetStr) return `${base} 오늘`;

    const tomorrowKst = new Date(nowKst.getTime() + 24 * 60 * 60 * 1000);
    if (tomorrowKst.toISOString().split('T')[0] === targetStr) return `${base} 내일`;

    const yesterdayKst = new Date(nowKst.getTime() - 24 * 60 * 60 * 1000);
    if (yesterdayKst.toISOString().split('T')[0] === targetStr) return `${base} 어제`;

    return base;
  };

  useEffect(() => {
    if (!selectedCafe.menus || selectedCafe.menus.length === 0) return;

    const nowKst = new Date(new Date().getTime() + 9 * 60 * 60 * 1000);
    const todayStr = nowKst.toISOString().split('T')[0];
    const viewedDateStr = date.toISOString().split('T')[0];
    const isToday = todayStr === viewedDateStr;

    const currentHour = nowKst.getUTCHours();

    const getInitialOpenState = (type) => {
      if (!isToday) return true;

      if (currentHour < 9) {
        return type.includes('조식');
      } else if (currentHour >= 14) {
        return type.includes('석식');
      } else {
        return !type.includes('조식') && !type.includes('석식');
      }
    };

    const initialExpanded = {};
    selectedCafe.menus.forEach(m => {
      if (initialExpanded[m.type] === undefined) {
        initialExpanded[m.type] = getInitialOpenState(m.type);
      }
    });

    setExpandedGroups(initialExpanded);
  }, [selectedCafe.id, cafes, date]);

  const toggleGroup = (type) => {
    setExpandedGroups(prev => ({ ...prev, [type]: !prev[type] }));
  };

  const getMenuIcon = (type) => {
    if (type.includes('조식')) return '☀️';
    if (type.includes('중식') || type.includes('일품') || type.includes('분식')) return '🍴';
    if (type.includes('석식')) return '🌙';
    if (type.includes('천원')) return '💰';
    return '🍚';
  };

  const groupedMenus = selectedCafe.menus.reduce((acc, m) => {
    if (!acc[m.type]) acc[m.type] = [];
    acc[m.type].push(m);
    return acc;
  }, {});

  return (
    <div className="cafe-container">
      <div className="date-controller">
        <button className="date-btn" onClick={() => changeDate(-1)} disabled={loading}>
          <ChevronLeft style={{ opacity: loading ? 0.3 : 1 }} />
        </button>
        <div className="date-text" style={{ opacity: loading ? 0.5 : 1 }}>
          {formatDate(date)}
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
            <Utensils size={14} style={{ opacity: 0.7 }} />
            {cafe.name}
            {cafe.hasJeyuk && <span className="jeyuk-badge">🔥 제육</span>}
          </div>
        ))}
      </div>

      <div className="menu-list" style={{ position: 'relative', minHeight: '200px' }}>
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
            Object.keys(groupedMenus).length > 0 ? (
              Object.entries(groupedMenus).map(([type, menus]) => {
                const isExpanded = expandedGroups[type];
                return (
                  <div key={type} className="accordion-group">
                    <div className={`accordion-header ${isExpanded ? 'expanded' : ''}`} onClick={() => toggleGroup(type)}>
                      <div className="accordion-title-area">
                        <span className="menu-icon">{getMenuIcon(type)}</span>
                        <span className="accordion-title">{type}</span>
                        <span className="accordion-count">{menus.length}개 메뉴</span>
                      </div>
                      <div className="accordion-chevron">
                        <ChevronRight style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }} size={20} color="#94a3b8" />
                      </div>
                    </div>

                    <div className={`accordion-content ${isExpanded ? 'expanded' : ''}`}>
                      <div className="accordion-inner">
                        {menus.map((m, i) => (
                          <div key={i} className="menu-card">
                            <div className="menu-items">{m.menu}</div>
                            {m.price && <div className="menu-price">{m.price}</div>}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })
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
      <div className={`nav-item ${activeTab === 'cafe' ? 'active' : ''}`} onClick={() => setActiveTab('cafe')}>
        <Utensils size={24} />
        <span className="nav-item-text">식단</span>
      </div>
      <div className={`nav-item ${activeTab === 'qr' ? 'active' : ''}`} onClick={() => setActiveTab('qr')}>
        <QrCode size={24} />
        <span className="nav-item-text">QR 출입증</span>
      </div>
      <div className={`nav-item ${activeTab === 'misc' ? 'active' : ''}`} onClick={() => setActiveTab('misc')}>
        <LayoutGrid size={24} />
        <span className="nav-item-text">기타</span>
      </div>
    </div>
  );
}

function MiscView() {
  const [subView, setSubView] = useState('list');

  if (subView === 'gym') {
    return <GymTimetable onBack={() => setSubView('list')} />;
  }

  if (subView === 'insta') {
    return <InstagramListView onBack={() => setSubView('list')} />;
  }

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
            <span className="misc-card-desc">에리카 & 단과대 계정</span>
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

function GymTimetable({ onBack }) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const colors = {
    orange: { bg: '#FFF7ED', text: '#C2410C', border: '#FFEDD5' },
    teal: { bg: '#F0FDFA', text: '#0F766E', border: '#CCFBF1' },
    green: { bg: '#F7FEE7', text: '#4D7C0F', border: '#ECFCCB' },
    blue: { bg: '#EFF6FF', text: '#1D4ED8', border: '#DBEAFE' },
    red: { bg: '#FEF2F2', text: '#B91C1C', border: '#FEE2E2' },
  };

  const baseSchedule = [
    { hour: 9, label: '09', mon: '-', tue: '-', wed: '-', thu: '-', fri: { name: '교양피트니스', type: 'orange' } },
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
    const days = ['mon', 'tue', 'wed', 'thu', 'fri'];
    const merged = baseSchedule.map(row => ({ ...row, spans: {} }));
    days.forEach(day => {
      for (let i = 0; i < baseSchedule.length; i++) {
        const current = baseSchedule[i][day];
        if (current === '-' || current === null) continue;
        let span = 1;
        while (i + span < baseSchedule.length && baseSchedule[i + span][day]?.name === current.name) {
          span++;
        }
        if (span > 1) {
          merged[i].spans[day] = span;
          for (let j = 1; j < span; j++) merged[i + j][day] = null;
          i += span - 1;
        }
      }
    });
    return merged;
  };

  const schedule = getMergedSchedule();

  const renderCell = (cell, span) => {
    if (cell === null) return null;
    if (cell === '-') return <td className="cal-cell empty"></td>;
    const style = colors[cell.type];
    return (
      <td rowSpan={span} className="cal-cell busy">
        <div className="course-card" style={{
          backgroundColor: style.bg,
          color: style.text,
          borderColor: style.border
        }}>
          <div className="course-name">{cell.name}</div>
        </div>
      </td>
    );
  };

  const getNowPos = () => {
    const h = currentTime.getHours();
    const m = currentTime.getMinutes();
    const day = currentTime.getDay();
    if (h < 9 || h >= 21 || day === 0 || day === 6) return null;
    const rowIndex = baseSchedule.findIndex(s => s.hour === h);
    if (rowIndex === -1) return null;
    const rowHeight = 40;
    const topOffset = 48;
    return {
      top: topOffset + (rowIndex * rowHeight) + (m / 60) * rowHeight,
      dayIndex: day - 1
    };
  };

  const now = getNowPos();

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
              <div className="cal-now-line"></div>
              <div className="cal-now-marker" style={{ left: `calc(12% + (88% / 5) * ${now.dayIndex} + (88% / 10))` }}>
                <span>지금</span>
              </div>
            </div>
          )}
          <table className="cal-table">
            <thead>
              <tr>
                <th style={{ width: '12%' }}></th>
                <th style={{ width: '17.6%' }}>월</th>
                <th style={{ width: '17.6%' }}>화</th>
                <th style={{ width: '17.6%' }}>수</th>
                <th style={{ width: '17.6%' }}>목</th>
                <th style={{ width: '17.6%' }}>금</th>
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

function InstagramListView({ onBack }) {
  const [expanded, setExpanded] = useState({ erica: true, college: true });
  const [data, setData] = useState({});

  const toggle = (key) => setExpanded(prev => ({ ...prev, [key]: !prev[key] }));

  const fetchInsta = async (username) => {
    try {
      const res = await fetch(`/api/insta-proxy?username=${username}`);
      const json = await res.json();
      setData(prev => ({ ...prev, [username]: json }));
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    const all = [...INSTA_ACCOUNTS.erica, ...INSTA_ACCOUNTS.college];
    all.forEach(acc => fetchInsta(acc.username));
  }, []);

  const openInsta = (username) => {
    const appUrl = `instagram://user?username=${username}`;
    const webUrl = `https://www.instagram.com/${username}/`;

    const start = Date.now();
    window.location.href = appUrl;

    setTimeout(() => {
      if (Date.now() - start < 2000) {
        window.open(webUrl, '_blank');
      }
    }, 500);
  };

  const renderItem = (acc) => {
    const getProxyUrl = (originalUrl) => {
      if (!originalUrl || originalUrl.includes('ui-avatars.com')) return originalUrl;
      return `/api/insta-proxy?url=${encodeURIComponent(originalUrl)}`;
    };

    const d = data[acc.username];
    if (!d) return (
      <div key={acc.username} className="insta-loading-skeleton">
        <div className="skeleton-circle"></div>
        <div className="skeleton-text">
          <div className="skeleton-line short"></div>
          <div className="skeleton-line long"></div>
        </div>
      </div>
    );

    return (
      <div key={acc.username} className="insta-item">
        <div className="insta-user-info">
          <img src={getProxyUrl(d.profilePicUrl)} alt={acc.username} className="insta-avatar" />
          <div className="insta-text">
            <span className="insta-fullname">{acc.desc}</span>
            <span className="insta-username">@{acc.username}</span>
          </div>
        </div>
        <button className="insta-action-btn" onClick={() => openInsta(acc.username)}>이동하기</button>
      </div>
    );
  };

  return (
    <div className="insta-container">
      <div className="insta-header">
        <button className="insta-back" onClick={onBack}><ArrowLeft size={20} /></button>
        <h2 className="section-title" style={{ marginBottom: 0 }}>학교 인스타그램</h2>
      </div>

      <div className="insta-section">
        <div className="insta-section-header" onClick={() => toggle('erica')}>
          <span className="insta-section-title">에리카</span>
          {expanded.erica ? <ChevronUp size={20} color="#94a3b8" /> : <ChevronDown size={20} color="#94a3b8" />}
        </div>
        {expanded.erica && (
          <div className="insta-list">
            {INSTA_ACCOUNTS.erica.map(renderItem)}
          </div>
        )}
      </div>

      <div className="insta-section">
        <div className="insta-section-header" onClick={() => toggle('college')}>
          <span className="insta-section-title">단과 대학</span>
          {expanded.college ? <ChevronUp size={20} color="#94a3b8" /> : <ChevronDown size={20} color="#94a3b8" />}
        </div>
        {expanded.college && (
          <div className="insta-list">
            {INSTA_ACCOUNTS.college.map(renderItem)}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
