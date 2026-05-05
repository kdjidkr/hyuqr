import React, { useState, useRef } from 'react';
import { X, Plus } from 'lucide-react';

const TIME_OPTIONS = (() => {
  const opts = [];
  for (let h = 6; h < 24; h++) opts.push(`${String(h).padStart(2,'0')}:00`, `${String(h).padStart(2,'0')}:30`);
  opts.push('24:00');
  return opts;
})();

const formatTime = (t) => {
  const [h, m] = t.split(':');
  const hour = parseInt(h);
  if (hour === 0 || hour === 24) return `자정 12:${m}`;
  if (hour < 12) return `오전 ${hour}:${m}`;
  if (hour === 12) return `오후 12:${m}`;
  return `오후 ${hour - 12}:${m}`;
};

const loadSettings = () => {
  try {
    const saved = localStorage.getItem('alarm_settings');
    return saved ? JSON.parse(saved) : {
      jeyukAlert: false,
      cheonaAlert: false,
      keywords: [],
      notifyTime: '08:00',
    };
  } catch {
    return { jeyukAlert: false, cheonaAlert: false, keywords: [], notifyTime: '08:00' };
  }
};

const settingsEqual = (a, b) =>
  a.jeyukAlert === b.jeyukAlert &&
  a.cheonaAlert === b.cheonaAlert &&
  a.notifyTime === b.notifyTime &&
  JSON.stringify(a.keywords) === JSON.stringify(b.keywords);

export function AlarmSettings({ onClose }) {
  const savedRef = useRef(loadSettings());
  const [settings, setSettings] = useState(() => ({
    ...savedRef.current,
    keywords: [...savedRef.current.keywords],
  }));
  const [keywordInput, setKeywordInput] = useState('');
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const isDirty = !settingsEqual(settings, savedRef.current);

  const toggle = (key) => setSettings(p => ({ ...p, [key]: !p[key] }));

  const addKeyword = () => {
    const trimmed = keywordInput.trim();
    if (trimmed && !settings.keywords.includes(trimmed)) {
      setSettings(p => ({ ...p, keywords: [...p.keywords, trimmed] }));
    }
    setKeywordInput('');
  };

  const removeKeyword = (kw) =>
    setSettings(p => ({ ...p, keywords: p.keywords.filter(k => k !== kw) }));

  const handleConfirm = () => {
    localStorage.setItem('alarm_settings', JSON.stringify(settings));
    onClose();
  };

  const handleClose = () => {
    if (isDirty) {
      setShowExitConfirm(true);
    } else {
      onClose();
    }
  };

  return (
    <div className="alarm-overlay" onClick={handleClose}>
      <div className="alarm-sheet" onClick={e => e.stopPropagation()}>
        <div className="alarm-sheet-handle" />

        <div className="alarm-sheet-header">
          <span className="alarm-sheet-title">학식 알림설정</span>
          <button className="alarm-close-btn" onClick={handleClose}>
            <X size={20} />
          </button>
        </div>

        {/* 학식 알림 */}
        <div className="alarm-section">
          <div className="alarm-row">
            <span>학식 관련 알림 받기</span>
            <label className="alarm-toggle">
              <input type="checkbox" checked={settings.jeyukAlert} onChange={() => toggle('jeyukAlert')} />
              <span className="alarm-toggle-slider" />
            </label>
          </div>
        </div>

        {/* 키워드 알림 */}
        <div className={`alarm-section${!settings.jeyukAlert ? ' alarm-section--disabled' : ''}`}>
          <div className="alarm-section-title">키워드 알림</div>
          <div className="alarm-section-desc">입력된 키워드가 포함된 알림을 보내드려요!</div>
          <div className="alarm-keyword-row">
            <input
              className="alarm-input"
              value={keywordInput}
              onChange={e => setKeywordInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addKeyword()}
              placeholder="키워드 입력"
              disabled={!settings.jeyukAlert}
            />
            <button className="alarm-add-btn" onClick={addKeyword} disabled={!settings.jeyukAlert}>
              <Plus size={18} />
            </button>
          </div>
          {settings.keywords.length > 0 && (
            <div className="alarm-keyword-tags">
              {settings.keywords.map(kw => (
                <span key={kw} className="alarm-keyword-tag">
                  {kw}
                  <button onClick={() => removeKeyword(kw)}><X size={11} /></button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* 알림수신시간 */}
        <div className={`alarm-section${!settings.jeyukAlert ? ' alarm-section--disabled' : ''}`}>
          <div className="alarm-section-title">알림 수신 시간</div>
          <div className="alarm-section-desc">정해진 시간마다 알림을 보내드려요!</div>
          <select
            className="alarm-time-select"
            value={settings.notifyTime}
            onChange={e => setSettings(p => ({ ...p, notifyTime: e.target.value }))}
            disabled={!settings.jeyukAlert}
          >
            {TIME_OPTIONS.map(t => (
              <option key={t} value={t}>{formatTime(t)}</option>
            ))}
          </select>
        </div>

        <button
          className="alarm-confirm-btn"
          onClick={handleConfirm}
          disabled={!isDirty}
        >
          저장
        </button>
      </div>

      {/* 나가기 확인 다이얼로그 */}
      {showExitConfirm && (
        <div className="alarm-exit-overlay" onClick={e => e.stopPropagation()}>
          <div className="alarm-exit-dialog">
            <p className="alarm-exit-title">저장하지 않은 변경사항이 있어요</p>
            <p className="alarm-exit-desc">변경사항을 어떻게 할까요?</p>
            <div className="alarm-exit-actions">
              <button className="alarm-exit-btn alarm-exit-btn--cancel" onClick={() => setShowExitConfirm(false)}>
                계속 편집
              </button>
              <button className="alarm-exit-btn alarm-exit-btn--discard" onClick={onClose}>
                저장 안 함
              </button>
              <button className="alarm-exit-btn alarm-exit-btn--save" onClick={handleConfirm}>
                저장하고 나가기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
