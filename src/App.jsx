import React, { useState, useEffect, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { RefreshCw, MapPin, CheckCircle, Smartphone } from 'lucide-react';
import './index.css';

function App() {
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);
  const [userData, setUserData] = useState(null);

  // Load from local storage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('pyxisAccessToken');
    const storedCreds = localStorage.getItem('pyxisEncryptedCreds');
    
    if (storedToken && storedCreds) {
      setToken(storedToken);
      // We don't verify token immediately, wait for QR component to try
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, []);

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

  if (loading) {
    return (
      <div className="loader-overlay">
        <div className="loader-spinner"></div>
        <p style={{ color: 'var(--text-secondary)' }}>한양대 도서관 연동 중...</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      {token ? (
        <QRView token={token} setToken={setToken} onLogout={handleLogout} />
      ) : (
        <LoginForm onSuccess={handleLoginSuccess} />
      )}
    </div>
  );
}

function LoginForm({ onSuccess }) {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('idle'); // idle, loading, error
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
        setStatus('idle');
        onSuccess(data.accessToken, data.encryptedCredentials, data.name);
      } else {
        setStatus('error');
        setErrMsg(data.message || '로그인에 실패했습니다.');
      }
    } catch (err) {
      setStatus('error');
      setErrMsg('서버와 통신할 수 없습니다.');
    }
  };

  return (
    <div className="glass-panel">
      <h1 className="title">HYU Library</h1>
      <p className="subtitle">빠른 입장을 위한 모바일 QR 패스</p>
      
      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label>한양인 아이디</label>
          <input 
            type="text" 
            className="input-field" 
            value={loginId} 
            onChange={e => setLoginId(e.target.value)} 
            placeholder="학번/교번 입력"
            required
          />
        </div>
        <div className="input-group">
          <label>비밀번호</label>
          <input 
            type="password" 
            className="input-field" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            placeholder="포털 비밀번호"
            required
          />
        </div>
        
        <button 
          type="submit" 
          className="primary-btn" 
          disabled={status === 'loading'}
          style={{ marginTop: '1.5rem' }}
        >
          {status === 'loading' ? <div className="spinner" /> : '로그인 연동하기'}
        </button>

        {status === 'error' && <p className="error-msg">{errMsg}</p>}
      </form>
    </div>
  );
}

function QRView({ token, setToken, onLogout }) {
  const [qrData, setQrData] = useState(null);
  const [status, setStatus] = useState('loading'); // loading, ready, error
  const [timeLeft, setTimeLeft] = useState(30);

  const fetchQR = useCallback(async (currentToken) => {
    setStatus('loading');
    setTimeLeft(30);
    try {
      const res = await fetch('/api/qr', {
        headers: { 'X-Pyxis-Auth-Token': currentToken }
      });
      
      if (res.status === 401) {
        // Token expired, let's relogin silently
        const creds = localStorage.getItem('pyxisEncryptedCreds');
        if (!creds) {
          onLogout();
          return;
        }

        const reloginRes = await fetch('/api/relogin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ encryptedCredentials: creds })
        });
        
        const reloginData = await reloginRes.json();
        
        if (reloginRes.ok && reloginData.success) {
          localStorage.setItem('pyxisAccessToken', reloginData.accessToken);
          setToken(reloginData.accessToken);
          // Recursively fetch QR with new token
          await fetchQR(reloginData.accessToken);
        } else {
          // Relogin failed completely
          onLogout();
        }
        return;
      }

      if (!res.ok) throw new Error('API Error');

      const data = await res.json();
      if (data && data.data && data.data.data) {
          // The exact API response structure is nested. 
          // From typical backend payload, membershipCard might be inside data.data or similar
          // Let's grab it defensively. Usually it's in data.data.data.membershipCard or data.data.membershipCard
          const mCard = data.data.membershipCard || (data.data.data && data.data.data.membershipCard);
          if (mCard) {
            setQrData(mCard);
            setStatus('ready');
          } else {
            throw new Error('No QR format matched');
          }
      } else if (data && data.success && typeof data.data === 'string') {
          // just a string format
          setQrData(data.data);
          setStatus('ready');
      } else {
        throw new Error('Invalid QR payload');
      }
      

    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  }, [onLogout, setToken]);

  useEffect(() => {
    if (token) fetchQR(token);
  }, [token, fetchQR]);

  // Auto-refresh timer logic
  useEffect(() => {
    if (status !== 'ready') return;

    if (timeLeft <= 0) {
      fetchQR(token);
      return;
    }

    const timerIdle = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timerIdle);
  }, [status, timeLeft, token, fetchQR]);

  if (status === 'loading') {
    return (
      <div className="qr-glass-panel">
        <div className="loader-spinner" style={{ borderColor: 'rgba(0,0,0,0.1)', borderTopColor: 'var(--hyu-blue)' }}></div>
        <p style={{ color: '#64748b', fontSize: '0.875rem' }}>인증 코드를 불러오는 중...</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="qr-glass-panel" style={{ padding: '3rem 2rem' }}>
        <p style={{ color: '#ef4444', marginBottom: '1.5rem', fontWeight: 600 }}>오류가 발생했습니다.</p>
        <button className="qr-refresh-btn" onClick={() => fetchQR(token)}>다시 시도</button>
        <button className="qr-logout-btn" onClick={onLogout}>로그아웃</button>
      </div>
    );
  }

  return (
    <div className="qr-glass-panel">
      <h2 className="qr-title">출입증 QR</h2>
      <p className="qr-desc">스캐너에 화면을 인식시켜주세요.</p>
      
      <div className="qr-wrapper">
        <QRCodeSVG value={qrData} size={220} level="M" />
      </div>

      <div style={{
          color: timeLeft <= 5 ? '#ef4444' : '#10b981',
          fontWeight: '700',
          fontSize: '1rem',
          marginBottom: '1rem',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '8px'
      }}>
        유효시간: {timeLeft}초
      </div>

      <button className="qr-refresh-btn" onClick={() => fetchQR(token)}>
        <RefreshCw size={16} /> <span>새로고침</span>
      </button>

      <button className="qr-logout-btn" onClick={onLogout}>
        로그아웃
      </button>

      {/* Screen Brightness Helper Text */}
      <div style={{ marginTop: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8', fontSize: '0.75rem' }}>
        <Smartphone size={14} /> 화면 밝기를 최대화 해주세요 
      </div>
    </div>
  );
}

export default App;
