/* Activity "exponents": form each Π group as  X · r1^a · r2^b · ...  (r = repeating variables),
   write the power equation for every dimension, then solve them for the unknown powers.
   cfg.groups: [{ title: 'Π₁', target: '<variable id>' }, ...]; repeating variables come from ex.crew. */
(function () {
  const P = PiLab;
  P.registerActivity('exponents', ({ cfg, ex, ui }) => {
    const byId = (id) => ex.variables.find((v) => v.id === id);
    const ALL = ex.dims || ['M', 'L', 'T'], crew = ex.crew.map(byId), LET = 'abcdefgh'.split('').slice(0, crew.length);
    const used = ALL.map((d, i) => i).filter((i) => ex.variables.some((v) => v.role !== 'out' && v.dim[i] !== 0));
    const n = ex.variables.filter((v) => v.role !== 'out').length, k = used.length;
    const G = cfg.groups.map((g) => {
      const t = byId(g.target);
      const sol = P.solve(used.map((i) => crew.map((v) => v.dim[i])), used.map((i) => -t.dim[i]));
      return { ...g, t, sol };
    });
    let vals, root;

    const mn = (x) => String(x).replace('-', '−'), supE = (e) => (e === 1 ? '' : `<sup>${mn(e)}</sup>`);
    const dimHtml = (v) => { const s = v.map((e, i) => (e ? ALL[i] + supE(e) : '')).join(''); return s || '1'; };
    /* the power equation for dimension i:  const + Σ coef·letter = 0 */
    function eqn(g, i) {
      let out = g.t.dim[i] ? mn(g.t.dim[i]) : '';
      crew.forEach((v, j) => {
        const c = v.dim[i]; if (!c) return;
        const term = (Math.abs(c) === 1 ? '' : Math.abs(c)) + LET[j];
        out += out ? (c < 0 ? ' − ' : ' + ') + term : (c < 0 ? '−' : '') + term;
      });
      return (out || '0') + ' = 0';
    }
    const num = (s) => { const x = parseFloat(String(s).replace('−', '-').replace(',', '.')); return isNaN(x) ? null : x; };
    const lhs = (gi, i) => G[gi].t.dim[i] + crew.reduce((s, v, j) => s + v.dim[i] * (num(vals[gi][j]) ?? NaN), 0);
    const eqOk = (gi, i) => Math.abs(lhs(gi, i)) < 1e-9;
    const solved = (gi) => used.every((i) => eqOk(gi, i));
    const nSolved = () => G.filter((g, gi) => solved(gi)).length;

    function expr(gi) {
      const top = [G[gi].t.sym], bot = [];
      crew.forEach((v, j) => { const e = num(vals[gi][j]); if (e > 0) top.push(v.sym + supE(e)); if (e < 0) bot.push(v.sym + supE(-e)); });
      return bot.length ? P.frac(top.join(' '), bot.join(' ')) : top.join(' ');
    }
    const product = (g) => `${g.t.sym} ${crew.map((v, j) => `${v.sym}<sup>${LET[j]}</sup>`).join(' ')}`;
    const expand = (g) => `(${dimHtml(g.t.dim)}) ${crew.map((v, j) => `(${dimHtml(v.dim)})<sup>${LET[j]}</sup>`).join(' ')}`;

    function paint(gi) {
      const el = P.$(`[data-g="${gi}"]`, root), ok = solved(gi);
      el.classList.toggle('locked', ok);
      P.$('.badge', el).textContent = ok ? 'solved ✓' : 'in progress';
      used.forEach((i) => {
        const r = P.$(`[data-eq="${i}"]`, el), filled = vals[gi].every((v) => num(v) !== null);
        r.classList.toggle('is-ok', eqOk(gi, i)); r.classList.toggle('is-bad', filled && !eqOk(gi, i));
        P.$('.pw__st', r).textContent = eqOk(gi, i) ? '✓' : filled ? '✗' : '';
      });
      P.$('.built', el).innerHTML = ok ? `built group <span class="eq">${expr(gi)}</span>` : 'Solve the equations, then enter the powers.';
      ui.progress(nSolved(), G.length, `${nSolved()} of ${G.length} groups solved`);
    }
    function render() {
      root.innerHTML = `<div class="sk panel sk--sm pw-form"><p class="note">Since n − k = ${n} − ${k} = ${G.length} groups, each with the repeating variables ${crew.map((v) => v.sym).join(', ')}:</p>
        ${G.map((g) => `<div class="pw-line math">${g.title} = ${product(g)} = ${expand(g)}</div>`).join('')}
        <p class="pw-cap">For a dimensionless group the total power of every dimension must be zero. Fill in the powers for ${used.map((i) => ALL[i]).join(', ')}.</p></div>
        <div class="grid-pw">${G.map((g, gi) => `<div class="sk tgroup sk--sm" data-g="${gi}">
          <div class="tgroup__h"><span><span class="badge">in progress</span> &nbsp;For ${g.title}</span><span class="math" style="font-size:17px">${product(g)}</span></div>
          <div class="pw-eqs">${used.map((i) => `<div class="pw-eq" data-eq="${i}"><b>${ALL[i]}:</b><span class="math">${eqn(g, i)}</span><span class="pw__st" aria-hidden="true"></span></div>`).join('')}</div>
          <div class="pw-ins">${LET.map((l, j) => `<label class="pw-in"><span class="math">${l} =</span><span class="pw-step"><button type="button" data-step="-1" data-gi="${gi}" data-j="${j}" aria-label="Decrease ${l}">−</button><input type="text" inputmode="text" autocomplete="off" value="${vals[gi][j]}" data-gi="${gi}" data-j="${j}" aria-label="${g.title}: power ${l} of ${crew[j].short}"><button type="button" data-step="1" data-gi="${gi}" data-j="${j}" aria-label="Increase ${l}">+</button></span></label>`).join('')}</div>
          <div class="built"></div></div>`).join('')}</div>`;
      G.forEach((g, gi) => paint(gi));
    }
    return {
      mount(el) {
        root = el; this.reset();
        root.addEventListener('input', (e) => {
          const t = e.target.closest('input[data-gi]'); if (!t) return;
          vals[+t.dataset.gi][+t.dataset.j] = t.value; ui.msg(''); paint(+t.dataset.gi);
        });
        root.addEventListener('click', (e) => {
          const b = e.target.closest('[data-step]'); if (!b) return;
          const gi = +b.dataset.gi, j = +b.dataset.j, v = (num(vals[gi][j]) ?? 0) + +b.dataset.step;
          vals[gi][j] = String(v); P.$(`input[data-gi="${gi}"][data-j="${j}"]`, root).value = v; ui.msg(''); paint(gi);
        });
      },
      reset() { vals = G.map(() => crew.map(() => '')); render(); },
      hint() {
        const gi = G.findIndex((g, i) => !solved(i));
        if (gi < 0) return ui.msg('Every group is solved. Press the check button.');
        const g = G[gi];
        // next unknown to fix: the one from the equation with the fewest unknowns that is still wrong
        const order = used.map((i) => ({ i, js: crew.map((v, j) => j).filter((j) => crew[j].dim[i]) })).sort((x, y) => x.js.length - y.js.length);
        for (const { i, js } of order) {
          const j = js.find((jj) => num(vals[gi][jj]) !== g.sol[jj]);
          if (j === undefined) continue;
          const known = js.filter((jj) => jj !== j && num(vals[gi][jj]) === g.sol[jj]).map((jj) => LET[jj]);
          return ui.msg(`Hint for ${g.title}: look at the ${ALL[i]} equation (${eqn(g, i)}). ${known.length ? `Put in ${known.join(', ')}, then solve it for ${LET[j]}.` : js.length === 1 ? `It has only one unknown, so solve it for ${LET[j]} first.` : `Use the powers you already know, then solve it for ${LET[j]}.`}`);
        }
      },
      check() {
        const empty = G.findIndex((g, gi) => vals[gi].some((v) => num(v) === null));
        if (empty >= 0) return ui.msg(`Enter every power for ${G[empty].title} first.`, 'bad');
        const bad = G.findIndex((g, gi) => !solved(gi));
        if (bad >= 0) return ui.msg(`${G[bad].title} is not dimensionless yet: the ${used.filter((i) => !eqOk(bad, i)).map((i) => ALL[i]).join(' and ')} equation${used.filter((i) => !eqOk(bad, i)).length > 1 ? 's do' : ' does'} not add up to zero.`, 'bad');
        ui.msg(`All ${G.length} groups are dimensionless, so all are valid Π groups. ✓`, 'ok'); ui.done();
      },
    };
  });
})();
