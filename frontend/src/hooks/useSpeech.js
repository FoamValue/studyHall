import { useCallback, useEffect, useState } from 'react';

/**
 * 语音朗读：封装浏览器原生 SpeechSynthesis，只朗读传入的文本（本迭代限植物名称）。
 * 同一时刻至多一个朗读在播放；再次播放会先取消当前朗读（互斥）。
 */
const isSpeechSupported = () =>
  typeof window !== 'undefined' &&
  'speechSynthesis' in window &&
  typeof window.SpeechSynthesisUtterance === 'function';

export default function useSpeech() {
  const [supported] = useState(isSpeechSupported);
  const [speakingLang, setSpeakingLang] = useState(null); // 'zh' | 'en' | null

  const stop = useCallback(() => {
    if (!isSpeechSupported()) return;
    window.speechSynthesis.cancel();
    setSpeakingLang(null);
  }, []);

  const speak = useCallback((text, lang) => {
    if (!isSpeechSupported() || !text) return;
    window.speechSynthesis.cancel(); // 互斥：先停掉当前朗读
    const utterance = new window.SpeechSynthesisUtterance(text);
    utterance.lang = lang === 'en' ? 'en-US' : 'zh-CN';
    utterance.rate = 0.8;
    utterance.onend = () => setSpeakingLang(null);
    utterance.onerror = () => setSpeakingLang(null);
    window.speechSynthesis.speak(utterance);
    setSpeakingLang(lang);
  }, []);

  // 组件卸载时停止朗读，离开详情页不留残音
  useEffect(() => {
    return () => {
      if (isSpeechSupported()) window.speechSynthesis.cancel();
    };
  }, []);

  return { supported, speakingLang, speak, stop };
}
