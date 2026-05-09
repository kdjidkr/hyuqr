import React from 'react';
import { Bell, Info, ExternalLink, Sparkles, CloudRain, Thermometer, Users, Loader2, Wind, Sun } from 'lucide-react';
import { usePortalData } from '../hooks/usePortalData.js';

export function PortalView() {
  const { weather, library, loading, error } = usePortalData();

  return (
    <div className="stt-container" style={{ animation: 'slideUp 0.4s ease-out' }}>
      
      {/* 1. 오늘의 날씨 섹션 */}
      <div className="stt-section">
        <p className="stt-sec-label">오늘의 날씨</p>
        <div className="glass-panel" style={{ 
          padding: '20px', 
          borderRadius: '20px', 
          background: 'linear-gradient(135deg, #0E4A84 0%, #1a74c7 100%)',
          color: 'white',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80px' }}>
              <Loader2 className="animate-spin" size={24} opacity={0.7} />
            </div>
          ) : weather ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                  <span style={{ fontSize: '36px', fontWeight: 800 }}>{weather.temp}°</span>
                  <span style={{ fontSize: '16px', fontWeight: 600, opacity: 0.9 }}>{weather.description}</span>
                </div>
                <p style={{ margin: '4px 0 0', fontSize: '13px', opacity: 0.8, fontWeight: 500 }}>안산시 상록구 사동</p>
                
                {/* 상시 노출되는 날씨 멘트 배너 */}
                <div style={{ 
                  marginTop: '12px', 
                  background: 'rgba(255,255,255,0.2)', 
                  padding: '8px 14px', 
                  borderRadius: '12px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '12px',
                  fontWeight: 600,
                  backdropFilter: 'blur(4px)',
                  lineHeight: 1.4,
                  maxWidth: '100%'
                }}>
                  {weather.hasPrecipitation ? <CloudRain size={14} /> : <Sparkles size={14} />}
                  <span>{weather.message}</span>
                </div>
              </div>
              <div style={{ opacity: 0.2, position: 'absolute', right: '-10px', top: '-10px' }}>
                <CloudRain size={120} />
              </div>
            </div>
          ) : (
            <p style={{ textAlign: 'center', opacity: 0.7 }}>날씨 정보를 불러올 수 없습니다.</p>
          )}

          {/* 대기질 및 자외선 지수 정보 (미세먼지, 초미세먼지, 자외선) */}
          {weather && weather.airQuality && (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(3, 1fr)', 
              gap: '10px', 
              marginTop: '12px' 
            }}>
              {[
                { label: '미세먼지', data: weather.airQuality.pm10, icon: Wind },
                { label: '초미세', data: weather.airQuality.pm25, icon: Wind },
                { label: '자외선', data: weather.airQuality.uv, icon: Sun }
              ].map((item, idx) => (
                <div key={idx} className="glass-panel" style={{ 
                  padding: '12px 8px', 
                  borderRadius: '16px', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center',
                  gap: '4px',
                  background: 'white',
                  border: '1px solid rgba(0,0,0,0.03)'
                }}>
                  <span style={{ fontSize: '10px', color: 'var(--color-text-hint)', fontWeight: 700 }}>{item.label}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <item.icon size={12} color={item.data.color} />
                    <span style={{ fontSize: '13px', fontWeight: 800, color: item.data.color }}>{item.data.label}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 2. 도서관 혼잡도 섹션 */}
      <div className="stt-section">
        <p className="stt-sec-label">도서관 혼잡도</p>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: '12px' 
        }}>
          {loading ? (
            <div className="glass-panel" style={{ gridColumn: 'span 2', padding: '40px', textAlign: 'center' }}>
              <Loader2 className="animate-spin" size={24} style={{ margin: '0 auto', color: 'var(--color-primary)' }} />
            </div>
          ) : library?.list ? (
            library.list.map((room) => (
              <div key={room.id} className="glass-panel" style={{ 
                padding: '14px', 
                borderRadius: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                background: 'white',
                border: '1px solid rgba(0,0,0,0.03)'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontWeight: 800, fontSize: '13px', color: 'var(--color-text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {room.name.replace(' (2F)', '').replace(' (4F)', '')}
                  </span>
                  <div style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: '4px',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    background: `${room.color}10`,
                    color: room.color,
                    fontSize: '11px',
                    fontWeight: 800,
                    width: 'fit-content'
                  }}>
                    {room.emoji} {room.status}
                  </div>
                </div>
                
                <div style={{ marginTop: '2px' }}>
                  <div style={{ 
                    width: '100%', height: '5px', 
                    background: '#f1f5f9', 
                    borderRadius: '3px',
                    overflow: 'hidden'
                  }}>
                    <div style={{ 
                      width: `${room.ratio * 100}%`, 
                      height: '100%', 
                      background: room.color,
                      transition: 'width 0.5s ease-out'
                    }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                    <span style={{ fontSize: '10px', color: 'var(--color-text-hint)', fontWeight: 600 }}>
                      {room.occupied}/{room.total}석
                    </span>
                    <span style={{ fontSize: '10px', color: 'var(--color-text-hint)', fontWeight: 600 }}>
                      {Math.round(room.ratio * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p style={{ gridColumn: 'span 2', textAlign: 'center', opacity: 0.7 }}>혼잡도 정보를 불러올 수 없습니다.</p>
          )}
        </div>
      </div>

    </div>
  );
}

