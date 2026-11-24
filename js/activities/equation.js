(function () {
  const P = PiLab;
  P.registerActivity('equation', ({ cfg, ex, ui }) => {
    let slots, re, root, marks;
    const T = cfg.tiles, tileById = (id) => T.find((t) => t.id === id);
    const NR = cfg.rhsSlots || 1, RHS = [...Array(NR).keys()].map((i) => 'rhs' + i), hasCurve = cfg.curve !== false;
    const pi1 = (Re) => (Math.PI / 8) * (24 / Re + 6 / (1 + Math.sqrt(Re)) + 0.4);
    const fmt = (Re) => { const e = Math.floor(Math.log10(Re) + 1e-9), m = Re / Math.pow(10, e); return Math.abs(m - 1) < 0.04 ? `10<sup>${e}</sup>` : `${m.toFixed(1)}×10<sup>${e}</sup>`; };
    const X0 = 50, X1 = 380, Y0 = 24, Y1 = 200, lyMin = -1, lyMax = 1.2;
    const px = (lr) => X0 + ((X1 - X0) * lr) / 5, py = (v) => Y1 - ((Math.log10(v) - lyMin) / (lyMax - lyMin)) * (Y1 - Y0);
    function curve() {
      let d = ''; for (let i = 0; i <= 100; i++) { const lr = (5 * i) / 100; d += (i ? 'L' : 'M') + px(lr).toFixed(1) + ' ' + py(pi1(Math.pow(10, lr))).toFixed(1); }
      return `<svg viewBox="0 0 420 250" id="eqcurve" aria-label="Force group versus Reynolds number"><line x1="${X0}" y1="${Y1}" x2="${X1}" y2="${Y1}" stroke="#22252b" stroke-width="2"/><line x1="${X0}" y1="${Y0}" x2="${X0}" y2="${Y1}" stroke="#22252b" stroke-width="2"/>
      ${[0, 1, 2, 3, 4, 5].map((e) => `<line x1="${px(e)}" y1="${Y1}" x2="${px(e)}" y2="${Y1 + 5}" stroke="#22252b"/><text x="${px(e)}" y="${Y1 + 18}" font-size="11" text-anchor="middle" fill="#6b7280">10${P.sup(e)}</text>`).join('')}
      <path d="${d}" fill="none" stroke="#3b6fd4" stroke-width="3" stroke-linecap="round"/><text x="${(X0 + X1) / 2}" y="${Y1 + 38}" font-size="12" text-anchor="middle" fill="#6b7280">Reynolds number Re (log scale)</text>
      <text x="${X0 + 4}" y="${Y0 - 8}" font-size="12" fill="#6b7280" font-style="italic">force group Π₁ (log)</text><text x="${X0 + 190}" y="${Y0 + 60}" font-size="12" fill="#3b6fd4">drag the dot</text>
      <circle id="eqdot" r="10" fill="#ffe66d" stroke="#22252b" stroke-width="2.5" style="cursor:grab"/></svg>`;
    }
    function moveDot() {
      if (!hasCurve) return;
      const lr = Math.log10(re), dot = P.$('#eqdot', root); dot.setAttribute('cx', px(lr)); dot.setAttribute('cy', py(pi1(re)));
      P.$('.rev', root).innerHTML = fmt(re); P.$('.piv', root).textContent = pi1(re).toFixed(pi1(re) < 1 ? 3 : 2); P.$('.reslider', root).value = lr;
    }
    const slotHtml = (key) => { const t = slots[key] && tileById(slots[key]); return `<div class="slotq ${t ? 'filled' : ''} ${marks[key] || ''}" data-zone="${key}" ${t ? `data-drag="${t.id}" draggable="true"` : ''}>${t ? t.html : 'drop here'}</div>`; };
    function render() {
      const used = Object.values(slots), n = used.filter(Boolean).length;
      root.innerHTML = `<div class="grid-eq"><div class="stack"><div class="pool" data-zone="pool"><h4>Group tiles</h4><div class="tiles">${T.map((t) => (used.includes(t.id) ? '<div class="tile ghost">placed</div>' : `<div class="tile" draggable="true" data-drag="${t.id}">${t.html}</div>`)).join('')}</div><p class="note" style="margin-top:10px">${cfg.tip}</p></div>
        <div class="eqrow">${slotHtml('lhs')} = f ( ${RHS.map(slotHtml).join(' , ')} )</div>
        ${hasCurve ? '<div class="sk rerow sk--sm"><span>Reynolds number</span><b>Re = <span class="rev"></span></b><span>force group = <b class="piv"></b> · falls as Re rises</span></div>' : ''}</div>
        ${hasCurve ? `<div class="sk curve sk--sm"><h4 style="font-size:15px;margin-bottom:6px">Sketch of the relationship</h4>${curve()}
        <input class="reslider" type="range" min="0" max="5" step="0.01" style="width:100%;accent-color:#22252b" aria-label="Reynolds number (log10)"><p style="font-size:12px;color:var(--mute)">${cfg.curveNote}</p></div>` : `<div class="sk panel sk--sm">${cfg.side || ''}</div>`}</div>`;
      moveDot(); ui.progress(n, NR + 1, `equation ${n} of ${NR + 1} tiles placed`);
    }
    return {
      mount(el) {
        root = el; this.reset();
        P.dnd(root, { onDrop(id, z) {
          const k = z.dataset.zone; if (!id) return; marks = {}; ui.msg('');
          Object.keys(slots).forEach((s) => { if (slots[s] === id) slots[s] = null; });
          if (k !== 'pool') slots[k] = id; render();
        } });
        const lr = (e) => { const r = P.$('#eqcurve', root).getBoundingClientRect(); return Math.max(0, Math.min(5, ((((e.clientX - r.left) / r.width) * 420 - X0) / (X1 - X0)) * 5)); };
        let drag = false;
        if (!hasCurve) return;
        root.addEventListener('pointerdown', (e) => { if (e.target.closest('#eqcurve')) { drag = true; re = Math.pow(10, lr(e)); moveDot(); } });
        root.addEventListener('pointermove', (e) => { if (drag) { re = Math.pow(10, lr(e)); moveDot(); } });
        window.addEventListener('pointerup', () => (drag = false));
        root.addEventListener('input', (e) => { if (e.target.classList.contains('reslider')) { re = Math.pow(10, +e.target.value); moveDot(); } });
      },
      reset() { slots = { lhs: null }; RHS.forEach((k) => (slots[k] = null)); re = 1000; marks = {}; render(); },
      hint() { ui.msg(cfg.hint || 'Hint: the group that holds the force goes on the left. The right side needs the force-free group, written in its famous named form.'); },
      check() {
        const l = tileById(slots.lhs), rs = RHS.map((k) => tileById(slots[k]));
        if (!l || rs.some((r) => !r)) return ui.msg(NR === 1 ? 'Place a tile in both boxes first.' : 'Fill every box in the equation first.', 'bad');
        marks = {};
        l.kind === 'lhs' ? (marks.lhs = 'right') : (marks.lhs = 'wrong');
        RHS.forEach((k, i) => (marks[k] = rs[i].kind === 'ok' ? 'right' : 'wrong'));
        render();
        if (l.kind === 'lhs' && rs.every((r) => r.kind === 'ok')) { ui.msg(cfg.success, 'ok'); return ui.done(); }
        if (l.kind !== 'lhs') return ui.msg(cfg.lhsMsg || 'The left side should be the group that contains the force, the thing we want to predict.', 'bad');
        const bad = rs.find((r) => r.kind !== 'ok');
        if (bad.msg) return ui.msg(bad.msg, 'bad');
        if (bad.kind === 'inv') return ui.msg('That is a valid group, but it is the inverse of the Reynolds number. Invert it to match the named form.', 'bad');
        ui.msg(cfg.rhsMsg || 'The right side should be the group without the force.', 'bad');
      },
    };
  });
})();
