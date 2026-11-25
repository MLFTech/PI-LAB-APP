/* BuckinghamEdu core helpers + registries. Data files call PiLab.registerGuide / registerExercise. */
(function () {
  const PiLab = (window.PiLab = window.PiLab || {});
  PiLab.guides = []; PiLab.exercises = []; PiLab.activities = {}; PiLab.templates = {}; PiLab.shared = {}; PiLab.home = null;
  PiLab.registerGuide = (g) => PiLab.guides.push(g);
  PiLab.registerExercise = (e) => PiLab.exercises.push(e);
  PiLab.registerActivity = (type, fn) => (PiLab.activities[type] = fn);

  const SUP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
  PiLab.sup = (n) => String(n).split('').map((c) => SUP[c] || c).join('');
  PiLab.DIMS = ['M', 'L', 'T', 'Θ'];
  /** [m,l,t(,θ)] exponent vector -> "M L⁻³" */
  PiLab.dimStr = (v) => {
    const p = v.map((e, i) => [PiLab.DIMS[i], e]).filter((x) => x[1] !== 0).map(([s, e]) => (e === 1 ? s : s + PiLab.sup(e)));
    return p.length ? p.join(' ') : '1';
  };
  PiLab.frac = (n, d) => `<span class="fr"><span>${n}</span><span>${d}</span></span>`;
  PiLab.sub = (s) => `<sub>${s}</sub>`;
  PiLab.$ = (s, r = document) => r.querySelector(s);
  PiLab.$$ = (s, r = document) => [...r.querySelectorAll(s)];
  PiLab.store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
  };
  /** Drag-and-drop with tap-to-select fallback (touch). Delegated, bind once per root. */
  PiLab.dnd = function (root, { item = '[data-drag]', zone = '[data-zone]', onDrop }) {
    let picked = null;
    const clear = () => { PiLab.$$('.is-picked', root).forEach((e) => e.classList.remove('is-picked')); picked = null; };
    root.addEventListener('dragstart', (e) => {
      const it = e.target.closest(item); if (!it || it.classList.contains('ghost')) return e.preventDefault();
      e.dataTransfer.setData('text/plain', it.dataset.drag); e.dataTransfer.effectAllowed = 'move'; it.classList.add('is-dragging');
    });
    root.addEventListener('dragend', (e) => { e.target.classList?.remove('is-dragging'); PiLab.$$('.over', root).forEach((z) => z.classList.remove('over')); });
    root.addEventListener('dragover', (e) => { const z = e.target.closest(zone); if (z) { e.preventDefault(); z.classList.add('over'); } });
    root.addEventListener('dragleave', (e) => { const z = e.target.closest(zone); if (z && !z.contains(e.relatedTarget)) z.classList.remove('over'); });
    root.addEventListener('drop', (e) => { const z = e.target.closest(zone); if (!z) return; e.preventDefault(); z.classList.remove('over'); onDrop(e.dataTransfer.getData('text/plain'), z); clear(); });
    root.addEventListener('click', (e) => {
      const it = e.target.closest(item), z = e.target.closest(zone);
      if (picked && z && !(it && it.dataset.drag === picked)) { const id = picked; clear(); onDrop(id, z); return; } // drop on a zone, even if clicking one of its tiles
      if (it && !it.classList.contains('ghost')) { const was = it.classList.contains('is-picked'); clear(); if (!was) { it.classList.add('is-picked'); picked = it.dataset.drag; } return; }
    });
  };
  /** parallel check & rank helpers for [M,L,T] vectors */
  PiLab.det3 = (a, b, c) => a[0] * (b[1] * c[2] - b[2] * c[1]) - a[1] * (b[0] * c[2] - b[2] * c[0]) + a[2] * (b[0] * c[1] - b[1] * c[0]);
  /** rank of a list of exponent vectors (any length), by Gaussian elimination */
  PiLab.rank = (vs) => {
    const m = vs.map((v) => v.slice()); let r = 0;
    for (let c = 0; c < (m[0] || []).length && r < m.length; c++) {
      let p = r; while (p < m.length && Math.abs(m[p][c]) < 1e-9) p++;
      if (p === m.length) continue;
      [m[r], m[p]] = [m[p], m[r]];
      for (let i = 0; i < m.length; i++) if (i !== r) { const f = m[i][c] / m[r][c]; m[i] = m[i].map((x, j) => x - f * m[r][j]); }
      r++;
    }
    return r;
  };
  PiLab.parallel = (a, b) => PiLab.rank([a, b]) < 2;
  /** solve the square system A·x = b (A as rows); returns null when singular */
  PiLab.solve = (A, b) => {
    const n = A.length, m = A.map((r, i) => [...r, b[i]]);
    for (let c = 0; c < n; c++) {
      let p = c; while (p < n && Math.abs(m[p][c]) < 1e-9) p++; if (p === n) return null;
      [m[c], m[p]] = [m[p], m[c]];
      for (let i = 0; i < n; i++) if (i !== c) { const f = m[i][c] / m[c][c]; m[i] = m[i].map((x, j) => x - f * m[c][j]); }
    }
    return m.map((r, i) => Math.round((r[n] / r[i]) * 1000) / 1000);
  };
})();
