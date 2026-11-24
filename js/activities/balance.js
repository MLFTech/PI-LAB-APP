(function () {
  const P = PiLab;
  P.registerActivity('balance', ({ cfg, ex, ui }) => {
    const V = ex.variables.filter((v) => v.role !== 'out'), n = V.length, D = ex.dims || ['M', 'L', 'T'];
    const rows = D.map((d, i) => ({ d, i })).filter((r) => V.some((v) => v.dim[r.i] !== 0)), k = rows.length;
    let locked, pi, root;
    const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
    function scale() {
      const right = locked.size + pi, th = clamp((right - n) * 5, -14, 14), a = (th * Math.PI) / 180, L = 195, cx = 280, cy = 110;
      const lx = cx - L * Math.cos(a), ly = cy - L * Math.sin(a), rx = cx + L * Math.cos(a), ry = cy + L * Math.sin(a);
      const items = (list, x, y, cls) => list.map((t, i) => { const col = i % 4, row = Math.floor(i / 4); const bx = x - 60 + col * 32, by = y + 64 - row * 32 - 28; return `<g><rect x="${bx}" y="${by}" width="28" height="28" rx="${cls === 'v' ? 14 : 5}" fill="${cls === 'v' ? '#fff' : cls === 'pi' ? '#eaf0ff' : '#ffe66d'}" stroke="#22252b" stroke-width="2"/><text x="${bx + 14}" y="${by + 20}" text-anchor="middle" font-size="16" font-family="var(--serif)" font-style="italic" fill="#22252b">${t}</text></g>`; }).join('');
      const blocks = [...D.filter((d) => locked.has(d)), ...Array(pi).fill('Π')];
      const pan = (x, y) => `<path d="M${x - 70} ${y + 70} H${x + 70} M${x} ${y} L${x - 66} ${y + 70} M${x} ${y} L${x + 66} ${y + 70}" stroke="#22252b" stroke-width="2.2" fill="none"/>`;
      return `<svg viewBox="0 0 560 310" role="img" aria-label="Balance scale"><polygon points="${cx - 36},282 ${cx + 36},282 ${cx},${cy}" fill="#fffbd6" stroke="#22252b" stroke-width="2.5" stroke-linejoin="round"/>
        <line x1="${lx}" y1="${ly}" x2="${rx}" y2="${ry}" stroke="#22252b" stroke-width="5" stroke-linecap="round"/><circle cx="${cx}" cy="${cy}" r="8" fill="#ffe66d" stroke="#22252b" stroke-width="2.5"/>
        ${pan(lx, ly)}${pan(rx, ry)}${items(V.map((v) => v.short), lx, ly, 'v')}${items(blocks, rx, ry, 'b')}
        <text x="${lx}" y="${ly + 100}" text-anchor="middle" font-size="14" fill="#22252b" font-family="var(--sans)">n = ${n} variables</text><text x="${rx}" y="${ry + 100}" text-anchor="middle" font-size="14" fill="#22252b" font-family="var(--sans)">k = ${locked.size} dimensions + ${pi} Π</text></svg>`;
    }
    function render() {
      const diff = locked.size + pi - n;
      root.innerHTML = `<div class="grid-bal"><div class="panel"><h4>Dimension matrix <span style="font-weight:400;color:var(--mute)">exponent of each dimension</span></h4><div class="scroll-x"><table class="mx"><tr><th></th>${V.map((v) => `<th>${v.sym}</th>`).join('')}</tr>
        ${rows.map((r) => `<tr class="${locked.has(r.d) ? 'locked' : ''}"><td class="rowh"><button class="lockbtn ${locked.has(r.d) ? 'on' : ''}" data-lock="${r.d}" aria-pressed="${locked.has(r.d)}"><i></i>${r.d}</button></td>${V.map((v) => `<td>${v.dim[r.i]}</td>`).join('')}</tr>`).join('')}</table></div>
        <p style="font-size:13px;color:var(--mute);margin-top:8px">Locked rows: ${locked.size ? [...locked].join(', ') : 'none yet'}. Every locked dimension drops one block on the right pan.</p></div>
        <div class="scale"><div class="cap-blue">${n} vs ${locked.size + pi} · ${diff === 0 ? 'the scale is level ✓' : diff < 0 ? 'the scale still tips left' : 'now it tips right: too many blocks'}</div>${scale()}
        <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap"><button class="btn btn--sm" data-pi="1">+ Π block</button><button class="btn btn--sm" data-pi="-1">− Π block</button><span class="pill">Π groups so far: ${pi}</span></div></div></div>`;
      ui.progress(locked.size + pi, n, `${locked.size + pi} of ${n} blocks placed`);
    }
    return {
      mount(el) {
        root = el; this.reset();
        root.addEventListener('click', (e) => {
          const l = e.target.closest('[data-lock]'), p = e.target.closest('[data-pi]');
          if (l) { const d = l.dataset.lock; locked.has(d) ? locked.delete(d) : locked.add(d); ui.msg(''); render(); }
          if (p) { pi = Math.max(0, Math.min(n, pi + +p.dataset.pi)); ui.msg(''); render(); }
        });
      },
      reset() { locked = new Set(); pi = 0; render(); },
      hint() { ui.msg(locked.size < k ? `Hint: each of the ${k} dimensions (${rows.map((r) => r.d).join(', ')}) carries weight, so lock every row.` : `Hint: the right pan needs ${n} blocks in total. You have ${locked.size} dimensions, so how many Π blocks are missing?`); },
      check() {
        if (locked.size < k) return ui.msg(`Lock all ${k} dimension rows first.`, 'bad');
        if (pi !== n - k) return ui.msg(pi < n - k ? 'Still tipping left: add more Π blocks.' : 'Too heavy on the right: remove a Π block.', 'bad');
        ui.msg(`Level! n − k = ${n} − ${k} = ${pi} dimensionless groups. ✓`, 'ok'); ui.done();
      },
    };
  });
})();
