(function () {
  const P = PiLab;
  P.registerActivity('crew', ({ cfg, ex, ui }) => {
    const V = ex.variables.filter((v) => v.role !== 'out'), dep = V.find((v) => v.role === 'dep');
    const DIMS = (ex.dims || ['M', 'L', 'T']).filter((d, i) => V.some((v) => v.dim[i] !== 0)), K = DIMS.length;
    const dimIdx = DIMS.map((d) => (ex.dims || ['M', 'L', 'T']).indexOf(d));
    const listTxt = (a) => (a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]);
    let crew, root, banner;
    const dimsOf = () => crew.map((id) => V.find((v) => v.id === id));
    function rules() {
      const c = dimsOf(), n = c.length, S = (t, s) => ({ t, s });
      const res = [];
      res.push({ st: n ? 'pass' : 'pend', t: 'Not the dependent variable', s: `${dep.sym} stays out` });
      const cover = n === K ? (P.rank(c.map((v) => v.dim)) === K ? 'pass' : 'fail') : 'pend';
      res.push({ st: cover, t: `Together they cover ${listTxt(DIMS)}`, s: cover === 'fail' ? 'they cannot form every dimension: some Π would be impossible' : `all ${K === 3 ? 'three' : K === 4 ? 'four' : K} lamps lit` });
      res.push({ st: n ? (c.some((v) => v.dim.every((x) => x === 0)) ? 'fail' : 'pass') : 'pend', t: 'None is already dimensionless', s: 'each carries a dimension' });
      let share = false; for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) if (P.parallel(c[i].dim, c[j].dim)) share = true;
      res.push({ st: n ? (share ? 'fail' : 'pass') : 'pend', t: 'No two share the same dimensions', s: share ? 'two differ only by an exponent' : c.map((v) => v.short).join(', ') + ' all differ' });
      const rare = c.filter((v) => v.common === false);
      res.push({ st: n ? (rare.length ? 'fail' : 'pass') : 'pend', t: 'Prefer simple, common variables', s: rare.length ? rare[0].crewNote || `${rare[0].short} is less basic: it would sit in every Π` : cfg.simpleText || 'a density, a speed, a length' });
      return res;
    }
    function render() {
      const c = dimsOf(), R = rules(), pass = R.filter((r) => r.st === 'pass').length;
      root.innerHTML = `<div class="grid-crew"><div class="stack"><div class="pool"><h4>Candidates</h4><div class="cand">${V.map((v) => {
        const isDep = v.id === dep.id, inC = crew.includes(v.id);
        return `<div class="tile ${inC ? 'in' : ''} ${isDep ? 'blocked' : ''}" data-cand="${v.id}" role="button" tabindex="0"><div class="sy">${v.sym}</div><div class="nmx">${v.name}</div><div class="dm">[ ] ${P.dimStr(v.dim)}</div><small>${isDep ? 'dependent · locked' : inC ? '✓ in crew' : 'tap to add'}</small></div>`;
      }).join('')}</div></div>
        <div class="crew"><div><b>Your crew</b><div style="font-size:12px;color:var(--mute)">${crew.length} of ${K} slots</div></div><div class="crew__slots">${DIMS.map((i) => `<div class="slot ${c[i] ? 'full' : ''}">${c[i] ? c[i].sym : ''}</div>`).join('')}</div>
        <div class="lamps">coverage ${DIMS.map((d, i) => `<span class="lamp ${c.some((v) => v.dim[dimIdx[i]] !== 0) ? 'on' : ''}">${d}</span>`).join('')}</div></div>
        ${banner ? `<div class="banner">${banner}</div>` : ''}</div>
        <div class="sk rules sk--sm"><h4>Live rule check</h4>${R.map((r) => `<div class="rule ${r.st}"><span class="ic">${r.st === 'pass' ? '✓' : r.st === 'fail' ? '✗' : '·'}</span><span><b>${r.t}</b><small>${r.s}</small></span></div>`).join('')}</div></div>`;
      ui.progress(pass, 5, `${crew.length === K ? 'crew complete' : 'pick ' + K} · ${pass} of 5 rules pass`);
    }
    function toggle(id) {
      if (id === dep.id) { banner = `<b>last try</b> · adding ${dep.sym} to the crew was blocked: the answer you want to predict cannot be a repeating variable.`; ui.msg(''); return render(); }
      banner = '';
      if (crew.includes(id)) crew = crew.filter((x) => x !== id);
      else if (crew.length >= K) return ui.msg(`The crew is full (${K}). Tap a member to remove it first.`, 'bad');
      else crew.push(id);
      ui.msg(''); render();
    }
    return {
      mount(el) {
        root = el; this.reset();
        root.addEventListener('click', (e) => { const t = e.target.closest('[data-cand]'); if (t) toggle(t.dataset.cand); });
        root.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { const t = e.target.closest('[data-cand]'); if (t) { e.preventDefault(); toggle(t.dataset.cand); } } });
      },
      reset() { crew = []; banner = ''; render(); },
      hint() { ui.msg(cfg.hint || 'Hint: you need a variable that holds mass, one that holds length and one that holds time, and the plainest ones are best. Try swapping a viscosity for a length and watch the checklist.'); },
      check() {
        const R = rules();
        if (crew.length < K) return ui.msg(`Pick ${K} repeating variables first.`, 'bad');
        const f = R.find((r) => r.st === 'fail');
        if (f) return ui.msg(`Not yet: “${f.t}”. ${f.s}.`, 'bad');
        ui.msg('Crew locked: ' + dimsOf().map((v) => v.short).join(', ') + '. ✓', 'ok'); ui.done();
      },
    };
  });
})();
