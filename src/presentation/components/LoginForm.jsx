// 컴포넌트: 한양대 포털 ID/PW 입력 로그인 폼
import React, { useState } from 'react';

export function LoginForm({ onSuccess }) {
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
      await onSuccess({ loginId, password });
    } catch (err) {
      setStatus('error');
      setErrMsg(err.message || 'Login failed');
    }
  };

  return (
    <div className="glass-panel">
      <h1 className="title" style={{ background: 'none', webkitTextFillColor: 'var(--color-primary)', color: 'var(--color-primary)', marginBottom: '0.5rem' }}>
        HYU 학술정보관
      </h1>
      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label>포털 아이디</label>
          <input
            type="text"
            className="input-field"
            value={loginId}
            onChange={e => setLoginId(e.target.value)}
            placeholder="포털 아이디"
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
