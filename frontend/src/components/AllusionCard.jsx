// 典故卡片：古诗词/成语原文 + 出处 + 一句低龄化白话解释；无典故不渲染
export default function AllusionCard({ allusion }) {
  if (!allusion || !allusion.text) return null;
  return (
    <section className="allusion-card" aria-label="植物小典故">
      <span className="allusion-quote" aria-hidden="true">“</span>
      <p className="allusion-text">{allusion.text}</p>
      {allusion.source ? <p className="allusion-source">—— {allusion.source}</p> : null}
      {allusion.explain ? <p className="allusion-explain">{allusion.explain}</p> : null}
    </section>
  );
}
