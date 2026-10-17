// 典故 / 小知识卡片：原文 + 出处 + 一句低龄化白话解释；无内容不渲染
// Sprint 9：植物沿用「植物小典故」语义，动物/昆虫/恐龙承载小知识，故统一称谓为「小知识」
export default function AllusionCard({ allusion }) {
  if (!allusion || !allusion.text) return null;
  return (
    <section className="allusion-card" aria-label="小知识">
      <span className="allusion-quote" aria-hidden="true">“</span>
      <p className="allusion-text">{allusion.text}</p>
      {allusion.source ? <p className="allusion-source">—— {allusion.source}</p> : null}
      {allusion.explain ? <p className="allusion-explain">{allusion.explain}</p> : null}
    </section>
  );
}
