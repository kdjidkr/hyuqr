// 컴포넌트: 한양대 ERICA 공식 인스타그램 계정 목록 및 프로필 이미지 표시
import React, { useState } from 'react';
import { ArrowLeft, ChevronUp, ChevronDown } from 'lucide-react';
import { INSTA_ACCOUNTS } from '../../domain/entities/InstagramAccount.js';
import { useInstagram } from '../hooks/useInstagram.js';

const openInsta = (username) => {
  const start = Date.now();
  window.location.href = `instagram://user?username=${username}`;
  setTimeout(() => {
    if (Date.now() - start < 2000) {
      window.open(`https://www.instagram.com/${username}/`, '_blank');
    }
  }, 500);
};

export function InstagramListView({ onBack }) {
  const [expanded, setExpanded] = useState({ erica: true, college: true });
  const { profiles, getProxiedUrl } = useInstagram();

  const toggle = (key) => setExpanded(prev => ({ ...prev, [key]: !prev[key] }));

  const renderItem = (acc) => {
    const profile = profiles[acc.username];
    if (!profile) {
      return (
        <div key={acc.username} className="insta-loading-skeleton">
          <div className="skeleton-circle" />
          <div className="skeleton-text">
            <div className="skeleton-line short" />
            <div className="skeleton-line long" />
          </div>
        </div>
      );
    }
    return (
      <div key={acc.username} className="insta-item">
        <div className="insta-user-info">
          <img
            src={getProxiedUrl(profile.profilePicUrl)}
            alt={acc.username}
            className="insta-avatar"
          />
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
