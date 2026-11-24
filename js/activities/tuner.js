(function () {
  const P = PiLab;
  P.registerActivity('tuner', ({ cfg, ex, ui }) => {
    const byId = (id) => ex.variables.find((v) => v.id === id);
    const crew = ex.crew.map(byId), G = cfg.groups.map((g) => ({ ...g, t: byId(g.target) }));
    const D = ['M', 'L', 'T'], LET = ['a', 'b', 'c'];
    let vals, root;
    const sg = (n) => (n > 0 ? '+' + n : n < 0 ? '−' + Math.abs(n) : '0');
    const net = (gi) => D.map((d, i) => G[gi].t.dim[i] + crew.reduce((s, v, j) => s + v.dim[i] * vals[gi][j], 0));
    const balanced = (gi) => net(gi).every((x) => x === 0);
    function expr(gi) {
      const num = [G[gi].t.sym], den = [];
      crew.forEach((v, j) => { const e = vals[gi][j]; if (e > 0) num.push(v.sym + (e > 1 ? `<sup>${e}</sup>` : '')); if (e < 0) den.push(v.sym + (e < -1 ? `<sup>${-e}</sup>` : '')); });
      return den.length ? P.frac(num.join(' '), den.join(' ')) : num.join(' ');
    }
    const calc = (gi) => {
      const nt = net(gi);
      return `<table class="calc"><tr><th></th><th>from ${G[gi].t.sym}</th>${crew.map((v, j) => `<th>from ${v.sym}<sup>${LET[j]}</sup></th>`).join('')}<th>net</th></tr>
      ${D.map((d, i) => `<tr><td>${d}</td><td>${sg(G[gi].t.dim[i])}</td>${crew.map((v, j) => `<td>${sg(v.dim[i] * vals[gi][j])}</td>`).join('')}<td class="${nt[i] === 0 ? 'okc' : 'bad'}">${nt[i] === 0 ? '✓ 0' : '✗ ' + sg(nt[i])}</td></tr>`).join('')}</table>
      <div class="built">${balanced(gi) ? `built group <span class="eq">${expr(gi)}</span>` : (() => { const i = nt.findIndex((x) => x !== 0); return `${D[i]} is off by ${Math.abs(nt[i])}. Nudge a slider ↑`; })()}</div>`;
    };
    const nLocked = () => G.filter((g, i) => balanced(i)).length;
    function paint(gi) {
      const el = P.$(`[data-g="${gi}"]`, root); el.classList.toggle('locked', balanced(gi));
      P.$('.badge', el).textContent = balanced(gi) ? 'locked ✓' : 'in progress';
      P.$('.calcbox', el).innerHTML = calc(gi);
      ui.progress(nLocked(), G.length, `${nLocked()} of ${G.length} groups locked`);
    }
    function render() {
      root.innerHTML = `<div class="grid-tune">${G.map((g, gi) => `<div class="sk tgroup sk--sm" data-g="${gi}"><div class="tgroup__h"><span><span class="badge">in progress</span> &nbsp;${g.title}</span><span class="math" style="font-size:19px">= ${g.t.sym} ${crew.map((v, j) => `${v.sym}<sup>${LET[j]}</sup>`).join(' ')}</span></div>
        ${crew.map((v, j) => `<div class="slr"><label>${LET[j]}</label><input type="range" min="-3" max="3" step="1" value="${vals[gi][j]}" data-gi="${gi}" data-j="${j}" aria-label="Exponent of ${v.short}"><output>${vals[gi][j]}</output></div>`).join('')}
        <div class="calcbox scroll-x"></div></div>`).join('')}</div>`;
      G.forEach((g, gi) => paint(gi));
    }
    return {
      mount(el) {
        root = el; this.reset();
        root.addEventListener('input', (e) => { const r = e.target.closest('input[type=range]'); if (!r) return; const gi = +r.dataset.gi; vals[gi][+r.dataset.j] = +r.value; r.nextElementSibling.textContent = r.value; ui.msg(''); paint(gi); });
      },
      reset() { vals = G.map(() => crew.map(() => 0)); render(); },
      hint() {
        const gi = G.findIndex((g, i) => !balanced(i));
        if (gi < 0) return ui.msg('Both groups are already balanced. Press the check button.');
        const i = net(gi).findIndex((x) => x !== 0);
        ui.msg(`Hint for ${G[gi].title}: start with ${D[i]}. Which variable carries ${D[i]}, and does it need a negative power to cancel the ${G[gi].t.short}?`);
      },
      check() {
        const bad = G.findIndex((g, i) => !balanced(i));
        if (bad >= 0) return ui.msg(`${G[bad].title} is not balanced yet: ${D.filter((d, i) => net(bad)[i] !== 0).join(' and ')} still has a net exponent.`, 'bad');
        ui.msg('Both groups are dimensionless, so both are valid Π groups. ✓', 'ok'); ui.done();
      },
    };
  });
})();
