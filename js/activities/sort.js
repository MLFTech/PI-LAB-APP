(function () {
  const P = PiLab;
  P.registerActivity('sort', ({ cfg, ex, ui }) => {
    const V = ex.variables, ZN = { dep: 'Dependent', ind: 'Independent', out: 'Not involved' };
    let st, wrong, root;
    const tile = (v, cls = '') => `<div class="tile ${cls}" draggable="true" data-drag="${v.id}"><div class="sy">${v.sym}</div><div class="nmx">${v.name}</div><div class="dm">[ ] ${P.dimStr(v.dim)}</div></div>`;
    const chip = (v) => `<div class="tile ${wrong.has(v.id) ? 'wrong' : ''}" draggable="true" data-drag="${v.id}"><div class="sy">${v.sym}</div><div><div class="nmx" style="color:var(--ink)">${v.name}</div><div class="nmx">${P.dimStr(v.dim)}</div></div></div>`;
    const inZ = (z) => V.filter((v) => st[v.id] === z).map(chip).join('');
    function render() {
      const placed = V.filter((v) => st[v.id] !== 'pool').length;
      root.innerHTML = `<div class="grid-sort"><div class="pool" data-zone="pool"><h4>Variable pool · ${V.length} candidates <span>drag from here</span></h4>
        <div class="pool__grid">${V.map((v) => (st[v.id] === 'pool' ? tile(v) : `<div class="tile ghost"><div class="sy" style="opacity:.4">${v.sym}</div><div class="nmx">placed</div></div>`)).join('')}</div></div>
        <div class="zones"><div class="zone zone--dep" data-zone="dep"><div class="zone__h"><b>Dependent</b> what we predict · 1 slot</div>${inZ('dep')}</div>
        <div class="zone" data-zone="ind"><div class="zone__h"><b>Independent</b> what we control or set</div>${inZ('ind') || '<span class="nmx" style="color:var(--mute);font-size:13px">drop here</span>'}</div>
        <div class="zone" data-zone="out" style="border-color:var(--dash)"><div class="zone__h"><b style="background:#fff">Not involved</b> bin them here</div>${inZ('out')}</div></div></div>`;
      ui.progress(placed, V.length, `${placed} / ${V.length} placed`);
    }
    function drop(id, zoneEl) {
      const z = zoneEl.dataset.zone; wrong.clear(); ui.msg('');
      if (z === 'dep') V.forEach((v) => { if (st[v.id] === 'dep') st[v.id] = 'pool'; });
      st[id] = z; render();
    }
    return {
      mount(el) { root = el; this.reset(); P.dnd(root, { onDrop: drop }); },
      reset() { st = {}; V.forEach((v) => (st[v.id] = 'pool')); wrong = new Set(); render(); },
      hint() {
        const v = V.find((x) => st[x.id] !== x.role);
        ui.msg(v ? 'Hint: ' + (v.hint || `${v.name} belongs in “${ZN[v.role]}”.`) : 'Everything is already in the right box. Press check.');
      },
      check() {
        if (V.some((v) => st[v.id] === 'pool')) return ui.msg(`Place all ${V.length} variables first.`, 'bad');
        wrong = new Set(V.filter((v) => st[v.id] !== v.role).map((v) => v.id));
        const ok = V.length - wrong.size; render();
        const cnt = (r) => V.filter((v) => v.role === r).length, w = (n) => ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'][n] || n;
        if (!wrong.size) { ui.msg(`All sorted: ${w(cnt('dep'))} dependent variable, ${w(cnt('ind'))} you can set, and ${w(cnt('out'))} that ${cnt('out') === 1 ? 'does' : 'do'} not matter. ✓`, 'ok'); ui.done(); }
        else ui.msg(`${ok} of ${V.length} are in the right box. The red ones need another look.`, 'bad');
      },
    };
  });
})();
