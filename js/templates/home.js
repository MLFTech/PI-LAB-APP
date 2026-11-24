(function () {
  const P = PiLab;
  P.templates.home = function (d) {
    const sketch = d.sketch || '';
    return `<div class="page">
    <section class="hero">
      <div class="hero__copy"><span class="tag">${d.tag}</span>
        <h1 style="margin-top:24px">${d.headline}</h1>
        <p class="lead">${d.brief}</p>
        <div class="cta">${d.ctas.map((c, i) => `<a class="btn ${i ? '' : 'btn--p'}" href="${c.href}">${c.label}</a>`).join('')}</div></div>
      <div class="sk sketch hero__fig">${sketch}</div>
    </section>
    <section class="sec"><div class="two"><div><h2 style="margin-bottom:18px">${d.intro.title}</h2>${d.intro.paragraphs.map((p) => `<p style="margin-bottom:14px">${p}</p>`).join('')}</div>
      <div class="sk formula"><div class="math">${d.intro.formula}</div><span class="note" style="color:var(--mute)">${d.intro.formulaNote}</span></div></div>
      <div class="benefits">${d.benefits.map((b, i) => `<div class="sk ${i % 2 ? 'sk--alt' : ''}"><b>${b.title}</b><p>${b.text}</p></div>`).join('')}</div></section>
    <section class="sec"><h2>${d.examples.title}</h2><div class="cards">${d.examples.cards.map((c, i) => `
      <div class="sk card ${i ? 'sk--alt' : ''}"><h3>${c.title}</h3><div>${c.chips.map((x) => `<span class="chip">${x}</span>`).join('')}</div>
        <div class="eq">${c.eq}</div>
        <div class="note-s"><b>How it began</b><p>${c.history}</p></div><div class="note-s"><b>What it gives engineers</b><p>${c.use}</p></div></div>`).join('')}</div></section>
    </div>`;
  };
})();
