// 部位小图标：与植物简笔画同风格（粗描边、平涂色），分类按钮与部位切换复用
const FLOWER = (
  <g>
    {[0, 72, 144, 216, 288].map((angle) => (
      <ellipse
        key={angle}
        cx="24"
        cy="12.5"
        rx="7.5"
        ry="10"
        fill="#F8BBD0"
        stroke="#C2185B"
        strokeWidth="2.5"
        strokeLinejoin="round"
        transform={`rotate(${angle} 24 24)`}
      />
    ))}
    <circle cx="24" cy="24" r="7.5" fill="#FFD54F" stroke="#F57F17" strokeWidth="2.5" />
  </g>
);

const LEAF = (
  <g>
    <path
      d="M24 5 C36 12 41 27 24 43 C7 27 12 12 24 5 Z"
      fill="#A5D6A7"
      stroke="#2E7D32"
      strokeWidth="2.5"
      strokeLinejoin="round"
    />
    <path d="M24 9 L24 39" stroke="#2E7D32" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    <path d="M24 18 L31 23 M24 26 L17 31" stroke="#2E7D32" strokeWidth="2" strokeLinecap="round" fill="none" />
  </g>
);

const FRUIT = (
  <g>
    <circle cx="24" cy="29" r="14" fill="#FF8A65" stroke="#D84315" strokeWidth="2.5" />
    <path
      d="M24 15 C24 10 27 6.5 31 5.5"
      fill="none"
      stroke="#5D4037"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    <ellipse
      cx="31.5"
      cy="9"
      rx="5"
      ry="2.8"
      fill="#A5D6A7"
      stroke="#2E7D32"
      strokeWidth="2"
      transform="rotate(-32 31.5 9)"
    />
  </g>
);

const GLYPHS = { flower: FLOWER, leaf: LEAF, fruit: FRUIT };

export default function PartIcon({ part, size = 28 }) {
  const glyph = GLYPHS[part];
  if (!glyph) return null;
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden="true" focusable="false">
      {glyph}
    </svg>
  );
}
