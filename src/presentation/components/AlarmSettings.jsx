import React, { useState, useRef, useLayoutEffect, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import { requestNotificationPermission } from '../../lib/firebase';
import { supabase } from '../../lib/supabase';

const ITEM_H = 38; // 휠 아이템 높이 약간 증가로 터치 영역 확보
const VISIBLE = 3;

const HOUR_LIST = Array.from({ length: 12 }, (_, i) => i);
const AMPM_LIST = ['오전', '오후'];
const DAY_LIST = ['전날', '당일'];

const parseH24 = (h24) => ({
  displayHour: h24 % 12,
  ampmIdx: h24 < 12 ? 0 : 1,
});

const toH24 = (displayHour, ampmIdx) => ampmIdx === 0 ? displayHour : displayHour + 12;

/**
 * 터치 최적화된 스르륵 움직이는 타임 피커 컬럼
 */
function PickerColumn({ list, valueIdx, onChange, width }) {
  const scrollRef = useRef(null);
  const isInternalScroll = useRef(false);
  const [activeIdx, setActiveIdx] = useState(valueIdx);

  // 초기 위치 및 외부 값 변경 시 동기화
  useLayoutEffect(() => {
    if (!scrollRef.current || isInternalScroll.current) return;
    scrollRef.current.scrollTop = valueIdx * ITEM_H;
    setActiveIdx(valueIdx);
  }, [valueIdx]);

  const handleScroll = (e) => {
    const el = e.currentTarget;
    const top = el.scrollTop;
    const idx = Math.max(0, Math.min(Math.round(top / ITEM_H), list.length - 1));
    
    if (idx !== activeIdx) {
      setActiveIdx(idx);
    }

    // 스크롤이 멈췄을 때 최종 값 확정 (Debounce)
    isInternalScroll.current = true;
    clearTimeout(el.scrollTimer);
    el.scrollTimer = setTimeout(() => {
      onChange(idx);
      isInternalScroll.current = false;
    }, 100);
  };

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      className="alarm-picker-scroll"
      style={{
        height: ITEM_H * VISIBLE,
        overflowY: 'auto',
        scrollSnapType: 'y mandatory',
        width,
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      <div style={{ height: ITEM_H }} />
      {list.map((item, idx) => (
        <div
          key={idx}
          style={{
            height: ITEM_H,
            scrollSnapAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 15,
            fontWeight: idx === activeIdx ? 800 : 400,
            color: idx === activeIdx ? '#1e293b' : '#cbd5e1',
            transition: 'all 0.15s ease',
            userSelect: 'none',
          }}
        >
          {item}
        </div>
      ))}
      <div style={{ height: ITEM_H }} />
    </div>
  );
}

function TimePicker({ value, onChange, day, onDayChange }) {
  const h24 = parseInt(value.split(':')[0]) || 0;
  const { displayHour, ampmIdx } = parseH24(h24);
  const dayIdx = DAY_LIST.indexOf(day);

  return (
    <div style={{
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      height: ITEM_H * VISIBLE,
      background: '#f8fafc',
      borderRadius: 14,
      padding: '0 8px',
      margin: '8px auto 0',
      width: 'fit-content',
    }}>
      {/* 중앙 하이라이트 바 */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: 8,
        right: 8,
        height: ITEM_H - 4,
        transform: 'translateY(-50%)',
        background: 'white',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)',
        borderRadius: 8,
        pointerEvents: 'none',
        zIndex: 0
      }} />

      <div style={{ display: 'flex', position: 'relative', zIndex: 1 }}>
        <PickerColumn 
          list={DAY_LIST} 
          valueIdx={dayIdx} 
          onChange={(idx) => onDayChange(DAY_LIST[idx])} 
          width={60} 
        />
        <PickerColumn 
          list={AMPM_LIST} 
          valueIdx={ampmIdx} 
          onChange={(idx) => onChange(`${String(toH24(displayHour, idx)).padStart(2, '0')}:00`)} 
          width={56} 
        />
        <PickerColumn 
          list={HOUR_LIST} 
          valueIdx={displayHour} 
          onChange={(idx) => onChange(`${String(toH24(idx, ampmIdx)).padStart(2, '0')}:00`)} 
          width={44} 
        />
        <div style={{ paddingRight: 12, fontSize: 13, fontWeight: 700, color: '#64748b' }}>시</div>
      </div>
    </div>
  );
}

const loadSettings = () => {
  try {
    const saved = localStorage.getItem('alarm_settings');
    if (!saved) return { jeyukAlert: false, keywords: [], notifyTime: '08:00', notifyDay: '당일' };
    const parsed = JSON.parse(saved);
    return { jeyukAlert: false, keywords: [], notifyTime: '08:00', notifyDay: '당일', ...parsed };
  } catch {
    return { jeyukAlert: false, keywords: [], notifyTime: '08:00', notifyDay: '당일' };
  }
};

const settingsEqual = (a, b) =>
  a.jeyukAlert === b.jeyukAlert &&
  a.notifyTime === b.notifyTime &&
  a.notifyDay === b.notifyDay &&
  JSON.stringify(a.keywords) === JSON.stringify(b.keywords);

export function AlarmSettings({ onClose }) {
  const savedRef = useRef(loadSettings());
  const [settings, setSettings] = useState(() => ({
    ...savedRef.current,
    keywords: [...savedRef.current.keywords],
  }));
  const [keywordInput, setKeywordInput] = useState('');
  
  // 애니메이션 및 드래그 상태
  const [closing, setClosing] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startY = useRef(0);
  const sheetRef = useRef(null);

  const isDirty = !settingsEqual(settings, savedRef.current);

  // iOS 배경 스크롤 잠금 및 복구
  useEffect(() => {
    const scrollY = window.scrollY;
    document.body.style.cssText = `
      position: fixed;
      top: -${scrollY}px;
      left: 0;
      right: 0;
      width: 100%;
      overflow: hidden;
    `;
    return () => {
      document.body.style.cssText = '';
      window.scrollTo(0, scrollY);
    };
  }, []);

  const triggerClose = (msg) => {
    if (closing) return;
    setClosing(true);
    setTimeout(() => onClose(msg), 300);
  };

  const handleSaveAndClose = async () => {
    let successMsg;
    if (isDirty) {
      localStorage.setItem('alarm_settings', JSON.stringify(settings));
      if (settings.jeyukAlert && settings.keywords.length > 0) {
        successMsg = '설정한 시간에 맞춰\n알림을 보내드릴게요!';
        // 서버 동기화 로직 (비동기 유지)
        syncSettings(settings);
      } else if (!settings.jeyukAlert) {
        disableAlarm();
      }
    }
    triggerClose(successMsg);
  };

  const syncSettings = async (s) => {
    try {
      const token = await requestNotificationPermission();
      if (!token) return;
      let deviceId = localStorage.getItem('device_id') || crypto.randomUUID();
      localStorage.setItem('device_id', deviceId);
      
      await supabase.from('devices').upsert({ id: deviceId, fcm_token: token, platform: 'web', last_active_at: new Date().toISOString() });
      
      const { data: existingSub } = await supabase.from('subscriptions').select('id').eq('device_id', deviceId).eq('topic', 'CAFETERIA_KEYWORD').maybeSingle();
      if (existingSub) {
        await supabase.from('subscriptions').update({ params: { keywords: s.keywords, notifyTime: s.notifyTime }, is_active: true, updated_at: new Date().toISOString() }).eq('id', existingSub.id);
      } else {
        await supabase.from('subscriptions').insert({ device_id: deviceId, topic: 'CAFETERIA_KEYWORD', params: { keywords: s.keywords, notifyTime: s.notifyTime } });
      }
    } catch (err) { console.error(err); }
  };

  const disableAlarm = () => {
    const deviceId = localStorage.getItem('device_id');
    if (deviceId) {
      supabase.from('subscriptions').update({ is_active: false, updated_at: new Date().toISOString() }).eq('device_id', deviceId).eq('topic', 'CAFETERIA_KEYWORD').then();
    }
  };

  // --- 드래그 핸들러 ---
  const onTouchStart = (e) => {
    if (sheetRef.current?.scrollTop > 0) return; // 내부 스크롤 중일 땐 드래그 금지
    startY.current = e.touches[0].clientY;
    setIsDragging(true);
  };

  const onTouchMove = (e) => {
    if (!isDragging) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;
    if (diff > 0) {
      setDragY(diff);
      // 배경 불투명도 조절 효과를 위해 인라인 스타일로 전달 가능
    }
  };

  const onTouchEnd = () => {
    setIsDragging(false);
    if (dragY > 100) {
      triggerClose();
    } else {
      setDragY(0);
    }
  };

  const modalStyle = {
    transform: `translateY(${closing ? '100%' : `${dragY}px`})`,
    transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-[1100] flex items-end justify-center transition-opacity duration-300"
      style={{ opacity: closing ? 0 : 1 }}
      onClick={() => triggerClose()}
    >
      <div
        ref={sheetRef}
        className="w-[calc(100%-48px)] max-w-[320px] bg-white rounded-t-[24px] rounded-b-[24px] px-5 pb-6 mb-8 shadow-[0_-8px_30px_rgba(0,0,0,0.1)] touch-none"
        style={modalStyle}
        onClick={e => e.stopPropagation()}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* 드래그 핸들 */}
        <div className="pt-3 pb-4 flex justify-center cursor-grab active:cursor-grabbing">
          <div className="w-10 h-1.5 bg-slate-200 rounded-full" />
        </div>

        <div className="flex items-center justify-between mb-4">
          <span className="text-[20px] font-black text-slate-800">학식 알림설정</span>
          <label className="alarm-toggle">
            <input type="checkbox" checked={settings.jeyukAlert} onChange={() => setSettings(p => ({ ...p, jeyukAlert: !p.jeyukAlert }))} />
            <span className="alarm-toggle-slider" />
          </label>
        </div>

        <div style={{
          opacity: settings.jeyukAlert ? 1 : 0.4,
          pointerEvents: settings.jeyukAlert ? 'auto' : 'none',
          transition: 'all 0.3s ease',
        }}>
          <div className="space-y-4">
            <div>
              <div className="text-[14px] font-bold text-slate-500 mb-2 px-1">키워드 설정</div>
              <div className="flex gap-2">
                <input
                  className="flex-1 h-11 bg-slate-50 border-none rounded-xl px-4 text-[15px] font-medium text-slate-800 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                  value={keywordInput}
                  onChange={e => setKeywordInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (keywordInput.trim() && setSettings(p => ({ ...p, keywords: [...new Set([...p.keywords, keywordInput.trim()])] })), setKeywordInput(''))}
                  placeholder="예: 돈까스, 제육"
                />
                <button
                  className="w-11 h-11 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20 active:scale-95 transition-all"
                  onClick={() => {
                    if (keywordInput.trim()) {
                      setSettings(p => ({ ...p, keywords: [...new Set([...p.keywords, keywordInput.trim()])] }));
                      setKeywordInput('');
                    }
                  }}
                >
                  <Plus size={20} strokeWidth={3} />
                </button>
              </div>
              
              {settings.keywords.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {settings.keywords.map(kw => (
                    <span key={kw} className="group flex items-center gap-1.5 bg-blue-50 text-blue-600 text-[13px] font-bold pl-3 pr-2 py-1.5 rounded-lg border border-blue-100/50">
                      {kw}
                      <button className="p-0.5 hover:bg-blue-100 rounded-md transition-colors" onClick={() => setSettings(p => ({ ...p, keywords: p.keywords.filter(k => k !== kw) }))}>
                        <X size={14} strokeWidth={2.5} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="text-[14px] font-bold text-slate-500 mb-1 px-1">알림 발송 시간</div>
              <TimePicker
                value={settings.notifyTime}
                onChange={(t) => setSettings(p => ({ ...p, notifyTime: t }))}
                day={settings.notifyDay}
                onDayChange={(d) => setSettings(p => ({ ...p, notifyDay: d }))}
              />
            </div>
          </div>
        </div>

        <button
          className="w-full h-13 mt-6 bg-slate-900 text-white rounded-2xl font-bold text-[16px] shadow-xl shadow-slate-900/10 active:scale-[0.98] transition-all"
          onClick={handleSaveAndClose}
        >
          {isDirty ? '설정 저장하기' : '닫기'}
        </button>
      </div>
    </div>
  );
}
