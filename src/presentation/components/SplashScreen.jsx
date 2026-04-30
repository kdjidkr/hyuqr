import React, { useState, useEffect } from 'react';

export function SplashScreen({ ready, onDone }) {
  const [fading, setFading] = useState(false);
  const [minDone, setMinDone] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMinDone(true), 1500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (ready && minDone) setFading(true);
  }, [ready, minDone]);

  return (
    <div
      className={`splash-screen${fading ? ' splash-fading' : ''}`}
      onTransitionEnd={() => fading && onDone()}
    >
      <img src="/hanyang_splash.png" className="splash-logo" alt="하냥냥" />
      <p className="splash-title">하냥냥</p>
      <p className="splash-subtitle">에리카 생활을 위한 꿀정보 모음</p>
    </div>
  );
}
