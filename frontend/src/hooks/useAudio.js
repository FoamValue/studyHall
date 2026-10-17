import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * 预生成音频播放：单例 HTMLAudioElement，同一时刻至多一个音频。
 * playingUrl 用于按钮高亮与「再点同一喇叭即停止」；互斥由调用方判定。
 * 音频缺失时调用方不渲染喇叭，绝不回退 speechSynthesis。
 */
export default function useAudio() {
  const audioRef = useRef(null);
  const [playingUrl, setPlayingUrl] = useState(null);

  const stop = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    setPlayingUrl(null);
  }, []);

  const play = useCallback((url) => {
    if (!url) return;
    let audio = audioRef.current;
    if (!audio) {
      if (typeof Audio === 'undefined') return;
      audio = new Audio();
      audioRef.current = audio;
    }
    // 互斥：先停掉当前再播放新的
    audio.pause();
    audio.currentTime = 0;
    audio.src = url;
    audio.onended = () => setPlayingUrl(null);
    audio.onerror = () => setPlayingUrl(null);
    try {
      const p = audio.play();
      if (p && typeof p.catch === 'function') p.catch(() => setPlayingUrl(null));
    } catch {
      setPlayingUrl(null);
      return;
    }
    setPlayingUrl(url);
  }, []);

  // 卸载时停止播放，离开详情页不留残音
  useEffect(() => {
    return () => {
      const audio = audioRef.current;
      if (audio) audio.pause();
    };
  }, []);

  return { playingUrl, play, stop };
}
