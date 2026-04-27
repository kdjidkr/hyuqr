// 컴포넌트: 날짜·식당 선택 및 아코디언 식단 목록 표시
import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Utensils } from 'lucide-react';
import { getKSTDate } from '../../utils/time.js';

const formatDate = (targetDate) => {
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const month = targetDate.getUTCMonth() + 1;
  const day   = targetDate.getUTCDate();
  const base  = `${month}월 ${day}일 (${days[targetDate.getUTCDay()]})`;

  const nowKst    = getKSTDate();
  const todayStr  = nowKst.toISOString().split('T')[0];
  const targetStr = targetDate.toISOString().split('T')[0];
  if (todayStr === targetStr) return `${base} 오늘`;

  const tmr = new Date(nowKst.getTime() + 86400000);
  if (tmr.toISOString().split('T')[0] === targetStr) return `${base} 내일`;

  const yst = new Date(nowKst.getTime() - 86400000);
  if (yst.toISOString().split('T')[0] === targetStr) return `${base} 어제`;

  return base;
};

const getMenuIcon = (type) => {
  if (type.includes('조식')) return '☀️';
  if (type.includes('중식') || type.includes('일품') || type.includes('분식')) return '🍴';
  if (type.includes('석식')) return '🌙';
  if (type.includes('천원')) return '💰';
  return '🍚';
};

export function CafeteriaView({ date, changeDate, cafes, loading }) {
  const [selectedCafeId, setSelectedCafeId] = useState('re12');
  const [expandedGroups, setExpandedGroups] = useState({});

  const selectedCafe = cafes.find(c => c.id === selectedCafeId) || { menus: [] };

  useEffect(() => {
    if (!selectedCafe.menus?.length) return;
    const nowKst  = getKSTDate();
    const isToday = nowKst.toISOString().split('T')[0] === date.toISOString().split('T')[0];
    const h = nowKst.getUTCHours();

    const getOpen = (type) => {
      if (!isToday) return true;
      if (h < 9)   return type.includes('조식');
      if (h >= 14) return type.includes('석식');
      return !type.includes('조식') && !type.includes('석식');
    };

    const initial = {};
    selectedCafe.menus.forEach(m => {
      if (initial[m.type] === undefined) initial[m.type] = getOpen(m.type);
    });
    setExpandedGroups(initial);
  }, [selectedCafe.id, cafes, date]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleGroup = (type) =>
    setExpandedGroups(prev => ({ ...prev, [type]: !prev[type] }));

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
        <div className="date-text" style={{ opacity: loading ? 0.5 : 1 }}>{formatDate(date)}</div>
        <button className="date-btn" onClick={() => changeDate(1)} disabled={loading}>
          <ChevronRight style={{ opacity: loading ? 0.3 : 1 }} />
        </button>
      </div>

      <div
        className="cafe-selector"
        style={{ opacity: loading ? 0.6 : 1, pointerEvents: loading ? 'none' : 'auto' }}
      >
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
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)', zIndex: 10, borderRadius: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: '1rem' }}>
            <div className="loader-spinner" style={{ width: '40px', height: '40px' }} />
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
                    <div
                      className={`accordion-header ${isExpanded ? 'expanded' : ''}`}
                      onClick={() => toggleGroup(type)}
                    >
                      <div className="accordion-title-area">
                        <span className="menu-icon">{getMenuIcon(type)}</span>
                        <span className="accordion-title">{type}</span>
                        <span className="accordion-count">{menus.length}개 메뉴</span>
                      </div>
                      <div className="accordion-chevron">
                        <ChevronRight
                          style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }}
                          size={20}
                          color="#94a3b8"
                        />
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
