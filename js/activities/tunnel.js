(function () {
  const P = PiLab;
  P.registerActivity('tunnel', ({ cfg, ex, ui }) => {
    const c = cfg, target = c.Vp * c.Dp, need = target / c.Dm;
    let Vm, slots, pred, root, predOk;
    const ratio = () => (Vm * c.Dm) / target, matched = () => Math.abs(ratio() - 1) <= c.tol;
    const tileById = (id) => c.tiles.find((t) => t.id === id);
    const answer = Math.pow(need / c.Vp, 2) * Math.pow(c.Dm / c.Dp, 2);
    const tilesOk = () => slots.every(Boolean) && slots.every((s) => tileById(s).ok);
    function fig() {
      const rm = 9, rp = 9 * (c.Dp / c.Dm);
      return `<svg viewBox="0 0 420 150" aria-label="Model and prototype spheres"><text x="10" y="16" font-size="11" font-weight="700" fill="#22252b">MODEL (m)</text><text x="230" y="16" font-size="11" font-weight="700" fill="#22252b">PROTOTYPE (p)</text>
      <line x1="14" y1="78" x2="52" y2="78" stroke="#22252b" stroke-width="2"/><path d="M46 73 L54 78 L46 83" fill="none" stroke="#22252b" stroke-width="2"/><text x="10" y="64" font-size="11" fill="#22252b">Vm = <tspan id="figVm">${Vm}</tspan> m/s</text>
      <circle cx="100" cy="80" r="${rm}" fill="#fffbd6" stroke="#22252b" stroke-width="2.5"/><text x="100" y="118" font-size="10" text-anchor="middle" fill="#6b7280">D = ${c.Dm.toFixed(2)} m</text>
      <text x="165" y="82" font-size="13" fill="#3b6fd4" font-weight="700">${c.scaleLabel}</text>
      <line x1="232" y1="78" x2="270" y2="78" stroke="#22252b" stroke-width="2"/><path d="M264 73 L272 78 L264 83" fill="none" stroke="#22252b" stroke-width="2"/><text x="232" y="64" font-size="11" fill="#22252b">Vp = ${c.Vp} m/s</text>
      <circle cx="350" cy="80" r="${rp}" fill="#fffbd6" stroke="#22252b" stroke-width="2.5"/><text x="350" y="${80 + rp + 14}" font-size="10" text-anchor="middle" fill="#6b7280">D = ${c.Dp.toFixed(2)} m</text></svg>`;
    }
    const slotHtml = (i) => { const t = slots[i] && tileById(slots[i]); return `<span class="slotq ${t ? 'filled' : ''}" data-zone="s${i}" ${t ? `data-drag="${t.id}" draggable="true"` : ''} style="min-width:78px">${t ? t.html : '?'}</span>`; };
    function lab() {
      const used = slots.filter(Boolean);
      return `<div class="lab sk sk--sm ${matched() ? '' : 'locked'}"><span class="lockmsg"></span><h4 style="font-size:15px;margin-bottom:8px">Force-ratio lab</h4>
        <div class="eqrow">F<sub>m</sub> / F<sub>p</sub> = ( ${slotHtml(0)} )² ( ${slotHtml(1)} )²</div>
        <div class="pool" data-zone="pool" style="margin-top:12px"><h4>Scaling tiles to drag in</h4><div class="tiles">${c.tiles.map((t) => (used.includes(t.id) ? '<div class="tile ghost">placed</div>' : `<div class="tile" draggable="true" data-drag="${t.id}">${t.html}</div>`)).join('')}</div></div>
        <div class="predict" style="margin-top:12px"><b>Your prediction</b><input type="text" inputmode="decimal" id="pred" value="${pred}" aria-label="Model drag to prototype drag ratio"> : 1 <span style="color:var(--mute)">model drag : prototype drag</span></div></div>`;
    }
    function prog() { const s = (matched() ? 1 : 0) + (tilesOk() ? 1 : 0) + (predOk ? 1 : 0); ui.progress(s, 3, matched() ? 'Re matched' + (tilesOk() ? ' · ratio built' : '') : 'Re match pending · force ratio locked'); }
    function bars() {
      const r = ratio(), good = matched();
      P.$('.bars', root).innerHTML = `<div class="bar t"><span>Re<sub>p</sub> target (VD)</span><div><i style="width:100%"></i></div><span class="v">${target.toFixed(1)} m²/s</span></div>
        <div class="bar ${good ? 'good' : ''}"><span>Re<sub>m</sub> now</span><div><i style="width:${Math.min(100, r * 100)}%"></i></div><span class="v">${(Vm * c.Dm).toFixed(1)} m²/s</span></div>
        <p class="note" style="margin-top:8px">${good ? 'Matched! Re<sub>m</sub> = Re<sub>p</sub> ✓ The force-ratio lab is unlocked.' : r < 1 ? `too low: Re<sub>m</sub> is only ${Math.round(r * 100)}% of Re<sub>p</sub>. Push the slider up.` : `too high: Re<sub>m</sub> is ${Math.round(r * 100)}% of Re<sub>p</sub>. Pull the slider back.`}</p>`;
      P.$('.vout', root).textContent = Vm + ' m/s'; P.$('#figVm', root).textContent = Vm;
      const l = P.$('.lab', root); l.classList.toggle('locked', !good); P.$('.lockmsg', l).textContent = good ? '🔓 unlocked' : '🔒 locked until Re matches';
      prog();
    }
    function render() {
      root.innerHTML = `<div class="grid-tun"><div class="stack"><div class="sk mini sk--sm" style="padding:10px">${fig()}</div>
        <div class="sk vsl sk--sm"><div class="vsl__h"><span>Model tunnel speed V<sub>m</sub></span><span class="badge vout"></span></div><input type="range" min="0" max="${c.Vmax}" step="1" value="${Vm}" id="vm" aria-label="Model tunnel speed"><div class="vsl__t">${[0, 20, 40, 60, 80].filter((x) => x <= c.Vmax).map((x) => `<span>${x}</span>`).join('')}</div><div class="bars"></div></div></div>
        <div class="labbox">${lab()}</div></div>`;
      bars();
    }
    return {
      mount(el) {
        root = el; this.reset();
        root.addEventListener('input', (e) => { if (e.target.id === 'vm') { Vm = +e.target.value; ui.msg(''); bars(); } else if (e.target.id === 'pred') pred = e.target.value; });
        P.dnd(root, { onDrop(id, z) {
          const k = z.dataset.zone; if (!id) return; ui.msg('');
          slots = slots.map((s) => (s === id ? null : s)); if (k === 's0') slots[0] = id; if (k === 's1') slots[1] = id;
          P.$('.labbox', root).innerHTML = lab(); bars();
        } });
      },
      reset() { Vm = c.start; slots = [null, null]; pred = ''; predOk = false; render(); },
      hint() {
        if (!matched()) return ui.msg(`Hint: the Reynolds numbers match when Vm × Dm = Vp × Dp. The model is ${c.Dp / c.Dm}× smaller, so it must go faster.`);
        if (!tilesOk()) return ui.msg('Hint: the force ratio scales with the speed ratio squared and the size ratio squared. The density ratio is 1 here because the fluid is the same.');
        ui.msg(`Hint: multiply (${need}/${c.Vp})² by (${c.Dm}/${c.Dp})².`);
      },
      check() {
        if (!matched()) return ui.msg('Match the Reynolds numbers first: the force-ratio lab stays locked until then.', 'bad');
        if (!tilesOk()) return ui.msg(slots.some((s) => s && !tileById(s).ok) ? 'The density ratio equals 1 here (same fluid), so it is not needed. Use the speed and size ratios.' : 'Drop the two scaling tiles into the equation.', 'bad');
        const v = parseFloat(String(pred).replace(',', '.'));
        if (isNaN(v)) return ui.msg('Type your prediction for F_m : F_p.', 'bad');
        if (Math.abs(v - answer) > 0.05 * answer) return ui.msg(`Not quite: work out (${need / c.Vp})² × (${c.Dm / c.Dp})² and try again.`, 'bad');
        predOk = true; prog(); ui.msg(`Yes: F_m : F_p = ${+answer.toFixed(2)} : 1 at matched Reynolds number. ✓`, 'ok'); ui.done();
      },
    };
  });
})();
