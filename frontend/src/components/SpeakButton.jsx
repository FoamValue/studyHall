/**
 * 名称朗读喇叭：只读名称本身。
 * 播放中显示「停止」图标并高亮，再点即停止；热区由 .speak-btn 样式保证 ≥56px。
 */
const SPEAKER_ICON = (
  <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true" focusable="false">
    <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" />
    <path
      d="M15.5 8.5a5 5 0 0 1 0 7M18 6a8 8 0 0 1 0 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const STOP_ICON = (
  <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true" focusable="false">
    <rect x="6" y="6" width="12" height="12" rx="3" fill="currentColor" />
  </svg>
);

export default function SpeakButton({ text, lang, speaking, onToggle }) {
  return (
    <button
      type="button"
      className={`speak-btn${speaking ? ' is-speaking' : ''}`}
      aria-label={lang === 'en' ? '朗读英文名' : '朗读中文名'}
      aria-pressed={speaking}
      onClick={() => onToggle(text, lang)}
    >
      {speaking ? STOP_ICON : SPEAKER_ICON}
    </button>
  );
}
