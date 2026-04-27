// 컴포넌트: QR 출입증 표시, 자동 갱신, 좌석 예약/반납 UI
import React, { useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { RefreshCw, Smartphone } from 'lucide-react';
import { useQR } from '../hooks/useQR.js';
import { useSeat } from '../hooks/useSeat.js';
import { ReserveForm } from './ReserveForm.jsx';

export function QRView({ user, reloginFn, onNameDiscovered, onLogout }) {
  const { qrData, status, refreshing, timeLeft, refresh } = useQR({
    user,
    reloginFn,
    onNameDiscovered,
    onLogout,
  });

  const { seatData, loading: seatLoading, fetchSeat, handleReserve, handleSeatReturn } = useSeat({ user });

  // QR 로드/갱신 완료 시 좌석 정보도 조회
  useEffect(() => {
    if (status === 'ready' && !refreshing) fetchSeat();
  }, [status, refreshing, fetchSeat]);

  if (status === 'loading') {
    return (
      <div className="qr-glass-panel">
        <div className="loader-spinner" style={{ borderColor: 'rgba(0,0,0,0.1)', borderTopColor: 'var(--hyu-blue)' }} />
        <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '1rem' }}>인증 코드를 불러오는 중...</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="qr-glass-panel">
        <p style={{ color: '#ef4444', fontWeight: '600', marginBottom: '0.5rem' }}>오류가 발생했습니다.</p>
        <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
          인증 세션이 만료되었거나<br />통신 상태가 원활하지 않습니다.
        </p>
        <button className="qr-refresh-btn" onClick={refresh}>다시 시도</button>
        <button className="qr-logout-btn" onClick={onLogout} style={{ marginTop: '1rem' }}>로그아웃</button>
      </div>
    );
  }

  return (
    <div className="qr-glass-panel" style={{ opacity: refreshing ? 0.7 : 1, transition: 'opacity 0.2s' }}>
      <h2 className="qr-title">출입증 QR</h2>
      {user?.name && (
        <div style={{ marginBottom: '0.25rem', fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-primary)' }}>
          {user.name}님 안녕하세요!
        </div>
      )}
      <p className="qr-desc">스캐너에 화면을 인식시켜주세요.</p>

      <div className="qr-wrapper" style={{ filter: refreshing ? 'blur(2px)' : 'none' }}>
        <QRCodeSVG value={qrData} size={220} level="M" />
      </div>

      <div style={{ color: timeLeft <= 5 ? '#ef4444' : '#10b981', fontWeight: '700', fontSize: '1rem', marginBottom: '0.5rem' }}>
        {refreshing ? 'Refreshing...' : `유효시간: ${timeLeft}초`}
      </div>

      <button
        className="qr-refresh-btn"
        onClick={refresh}
        disabled={refreshing}
        style={{ marginBottom: '1.5rem' }}
      >
        <RefreshCw size={16} className={refreshing ? 'spin-animation' : ''} />
        <span>{refreshing ? 'Refreshing...' : 'QR 새로고침'}</span>
      </button>

      {seatData ? (
        <SeatInfoCard
          seatData={seatData}
          onReturn={() => handleSeatReturn(seatData)}
          loading={seatLoading}
        />
      ) : (
        <ReserveForm onReserve={handleReserve} loading={seatLoading} />
      )}

      <button className="qr-logout-btn" onClick={onLogout} style={{ marginTop: '1rem' }}>로그아웃</button>
      <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8', fontSize: '0.75rem' }}>
        <Smartphone size={14} /> 화면 밝기 최대 권장
      </div>
    </div>
  );
}

function SeatInfoCard({ seatData, onReturn, loading }) {
  const isTemp = seatData.state?.code === 'TEMP_CHARGE';
  return (
    <div className={`seat-info-card ${isTemp ? 'is-temp' : 'is-confirmed'}`}>
      <div className="seat-header">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <div className={`status-badge ${isTemp ? 'temp' : 'confirmed'}`}>
            {isTemp ? '확정 대기중' : '좌석 이용중'}
          </div>
          <span className="seat-room">{seatData.room?.name}</span>
        </div>
        <span className="seat-number">{seatData.seatNumber}번 좌석</span>
      </div>

      {isTemp && seatData.checkinExpiryDate && (
        <div style={{ background: 'rgba(245,158,11,0.1)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.85rem', color: '#b45309', fontWeight: '700', textAlign: 'center' }}>
          ⚠️ {seatData.checkinExpiryDate.substring(11, 16)}까지 좌석 배정을 완료해주세요
        </div>
      )}

      {!isTemp && (
        <div className="seat-time">
          <span>반납 예정: {seatData.endTime?.substring(11, 16)}</span>
          <span className="seat-remaining" style={{ color: 'var(--success)' }}>
            ({seatData.remainTime}분 남음)
          </span>
        </div>
      )}

      <button className="seat-return-btn" onClick={onReturn} disabled={loading}>
        {isTemp ? '예약 취소하기' : '좌석 반납하기'}
      </button>
    </div>
  );
}
