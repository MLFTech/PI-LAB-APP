/* Guide template: renders any guide data object. Step content is built from typed blocks. */
(function () {
  const P = PiLab;
  const arrowSvg = '<svg width="130" height="24" viewBox="0 0 130 24" fill="none" stroke="#3b6fd4" stroke-width="2.5" stroke-linecap="round"><path d="M4 12 H122"/><path d="M112 4 L124 12 L112 20"/></svg>';
  const B = {
    p: (b) => `<p>${b.html}</p>`,
    note: (b) => `<div class="note">${b.html}</div>`,
    equation: (b) => `<div class="eq sk sk--sm" style="${b.size ? `font-size:${b.size}` : ''}">${b.html}</div>`,
    table: (b) => `<div class="scroll-x"><table class="vt"><tr>${b.head.map((h) => `<th>${h}</th>`).join('')}</tr>${b.rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</table></div>`,
    cells: (b) => `<div class="cells ${b.cols === 2 ? 'c2' : 'c3'}">${b.items.map((i) => `<div class="sk cell" style="${i.bg ? `background:${i.bg}` : ''}">${i.html}${i.sub ? `<small>${i.sub}</small>` : ''}</div>`).join('')}</div>`,
    repeating: (b) => `<div class="g4"><div class="sk gl"><h3>Guidelines for repeating variables</h3>${P.shared.guidelines.map((g, i) => `<div class="gi"><i>${i + 1}</i><span>${g}</span></div>`).join('')}
        ${P.shared.propertyKinds ? `<div class="kinds"><h4>The three kinds of property</h4>${P.shared.propertyKinds.map((k) => `<div class="kind"><b>${k.name}</b><span>${k.html}</span>${b.kinds && b.kinds[k.name] ? `<em>here: ${b.kinds[k.name]}</em>` : ''}</div>`).join('')}</div>` : ''}</div>
      <div class="sides"><div class="sk side sk--cream"><h3>What is a dependent variable?</h3>${b.dependent.map((t) => `<p>${t}</p>`).join('')}</div>
      <div class="sk side"><h3>${b.check.title}</h3>${b.check.items.map((c) => `<div class="ok">${c}</div>`).join('')}</div></div></div>
      <div class="cells c3" style="margin-top:8px">${b.pis.map((t) => `<div class="sk cell">${t}</div>`).join('')}</div>`,
    exponents: (b) => `${(b.howto || P.shared.exponentSteps) ? `<ol class="howto">${(b.howto || P.shared.exponentSteps).map((h) => `<li>${h}</li>`).join('')}</ol>` : ''}
      <div class="expcards">${b.groups.map((g) => `<div class="sk expcard sk--sm"><b class="exp__t">${g.title}</b>
        <div class="exp__cols"><div>${g.dims ? `<span class="exp__lbl">Write each variable in fundamental dimensions</span><div class="exp__dims">${g.dims}</div>` : ''}
          <span class="exp__lbl">Power of each dimension = 0</span><div class="lines">${g.lines.join('<br>')}</div></div>
        <div><span class="exp__lbl">Powers</span><div class="sol">${g.solution}</div>${g.result ? `<div class="exp__res"><span class="exp__lbl">Original Π group</span><div>${g.result}</div></div>` : ''}</div></div></div>`).join('')}</div>
      ${b.extra ? `<div class="sk cell sk--pale">${b.extra.html}<small>${b.extra.sub}</small></div>` : ''}${b.note ? `<div class="note">${b.note}</div>` : ''}`,
    results: (b) => `<div class="rhead"><span></span><span>ACTUAL RESULT</span><span>CHANGE</span><span>AFTER CHANGING</span><span>NAME</span></div>${b.rows.map((r) => `<div class="rrow"><div class="pl">${r.p}</div>
      <div class="sk rc" data-label="ACTUAL RESULT"><div class="s">${r.rawSub}</div><div class="r">${r.raw}</div></div><div class="ar">${r.change}${arrowSvg}</div>
      <div class="sk rc rc--f" data-label="AFTER CHANGING">${r.finalSub ? `<div class="s">${r.finalSub}</div>` : ''}<div class="r">${r.final}</div></div>
      <div class="sk nm" data-label="NAME">${r.name}<span class="math">${r.sym}</span></div></div>`).join('')}
      <div class="eq sk sk--sm" style="background:var(--cream);font-size:clamp(22px,3vw,34px)">${b.final}</div>${b.note ? `<div class="note">${b.note}</div>` : ''}`,
    similarity: (s) => `<div class="sim7"><div class="sk dsc sk--cream"><h3>The principle</h3><p>${s.principle}</p><p>${s.pills.map((x) => `<span class="pill">${x}</span>`).join('')}</p><p class="note">${s.tip}</p></div>
      <div class="sk fig" style="padding:10px">${s.figure}</div></div>
      ${s.steps.map((x) => `<div class="sk sim sk--sm" style="${x.hl ? 'background:var(--cream)' : ''}"><i>${x.letter}</i><b>${x.title}</b><div class="sim__m">${x.html}</div></div>`).join('')}
      ${s.numbers ? `<div class="sk sim sk--sm"><i>${s.numbers.letter}</i><b>${s.numbers.title}</b><div class="trio">${s.numbers.cases.map((c) => `<div class="sk tc" style="${c.hl ? 'background:var(--cream)' : ''}"><b>${c.title}</b><span class="math">${c.eq}</span><br>${c.text}</div>`).join('')}</div></div><div class="note">${s.numbers.note}</div>` : ''}`,
  };
  P.templates.guide = function (g, all) {
    const tabs = all.length > 1 ? `<div class="tabs">${all.map((x) => `<a class="${x.id === g.id ? 'on' : ''}" href="#/guide/${x.id}">${x.tabLabel}</a>`).join('')}</div>` : '';
    const steps = g.steps.map((s, i) => `<article class="sk step" id="step-${i + 1}"><div class="step__num"><span>STEP</span><b>${i + 1}</b></div>
      <div class="step__body"><h2>${s.title}</h2>${s.blocks.map((b) => (B[b.type] ? B[b.type](b) : '')).join('')}</div></article>`).join('');
    return `<div class="page">
      <div class="ghead"><div class="crumb"><a href="#/guide">Guide</a> &nbsp;/&nbsp; Buckingham Pi theorem${all.length > 1 ? ` &nbsp;/&nbsp; ${g.crumb}` : ''}</div>
        <h1>Buckingham Pi theorem, <span class="hl">step by step</span></h1><div class="sub">${g.subtitle}</div>${tabs}</div>
      <section class="prob"><div class="sk pbox"><span class="tag">Problem statement</span><p>${g.problem.text}</p><div class="eq sk sk--sm">${g.problem.equation}</div><p style="font-size:clamp(15px,1.3vw,18px)">${g.problem.goal}</p></div>
        <div class="sk fig">${g.problem.figure}<div class="cap"><span class="cap__ar" aria-hidden="true"></span>sketch: every labelled quantity goes into Step 1</div></div></section>
      <section class="steps">${steps}</section>
      <div class="foot">${g.footer.map((f, i) => `<a class="btn ${f.primary ? 'btn--p' : ''}" href="${f.href}">${f.label}</a>`).join('')}</div>
      <div class="src">${g.source}</div></div>`;
  };
})();
