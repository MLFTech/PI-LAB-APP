/* Symbol keyboard: an on-screen keyboard of fluid-mechanics and heat-transfer symbols, operators and powers.
   Content comes from data/keyboard.js (PiLab.keyboard). Usage:
     const kb = PiLab.symbolKeyboard.mount(hostEl, { scope: someEl, targets: 'input.c-nm', describe: (input) => 'Variable 2',
                                                     onSymbol: (input, { label, name, dims }) => {} });
   Keys type into the text box (matching `targets`, inside `scope`) that was focused last.
   Variable keys from data/symbols/ carry their powers of M, L, T, Θ; after one is typed, onSymbol is called with them. */
(function () {
  const P = PiLab;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const isMark = (ch) => /[̀-ͯ]/.test(ch);
  const DIM = ['M', 'L', 'T', 'Θ'];
  const dimTxt = (d) => d.map((e, i) => (e ? DIM[i] + (e === 1 ? '' : P.sup(e)) : '')).filter(Boolean).join(' ') || 'dimensionless';
  /** a key as {label, name, ins, dims}: [label, name, ins?] or, from data/symbols, [label, name, M, L, T, Θ, ins?] */
  function key(k) {
    if (typeof k[2] === 'number') return { label: k[0], name: k[1], dims: k.slice(2, 6), ins: k[6] == null ? k[0] : k[6] };
    return { label: k[0], name: k[1], ins: k[2] == null ? k[0] : k[2] };
  }
  /** tabs with `symbols: 'fluid'` take their label and keys from PiLab.symbols.fluid (data/symbols/) */
  const tabsOf = (data) => data.tabs.map((t) => (t.symbols ? { id: t.id, ...(P.symbols && P.symbols[t.symbols]) } : t)).filter((t) => t.groups);

  P.symbolKeyboard = {
    mount(host, opt = {}) {
      const data = P.keyboard && { ...P.keyboard, tabs: tabsOf(P.keyboard) }, scope = opt.scope || document, sel = opt.targets || 'input[type=text],input:not([type]),textarea';
      if (!data) { host.innerHTML = ''; return null; }
      let target = null, tab = 0, open = opt.open !== false;
      try { const t = +localStorage.getItem('pilab:kb:tab'); if (t >= 0 && t < data.tabs.length) tab = t; } catch (e) {}

      host.classList.add('skb');
      host.innerHTML = `<div class="skb__bar">
          <button type="button" class="skb__toggle" aria-expanded="${open}"><span aria-hidden="true">⌨</span> ${esc(data.title)}</button>
          <span class="skb__target" aria-live="polite"></span></div>
        <div class="skb__panel"${open ? '' : ' hidden'}>
          <p class="skb__hint">${esc(data.hint)}</p>
          <div class="skb__tabs" role="tablist">${data.tabs.map((t, i) => `<button type="button" role="tab" data-tab="${i}">${esc(t.label)}</button>`).join('')}</div>
          <div class="skb__keys" role="tabpanel"></div>
          <div class="skb__ctl">
            <button type="button" data-ctl="left" title="Move cursor left" aria-label="Move cursor left">◀</button>
            <button type="button" data-ctl="right" title="Move cursor right" aria-label="Move cursor right">▶</button>
            <button type="button" data-ctl="space" class="skb__space" title="Space">space</button>
            <button type="button" data-ctl="back" title="Delete the character before the cursor" aria-label="Backspace">⌫</button>
            <button type="button" data-ctl="clear" title="Clear this box">Clear</button>
          </div>
        </div>`;
      const $ = (s) => P.$(s, host), panel = $('.skb__panel'), keysEl = $('.skb__keys'), tgtEl = $('.skb__target');

      function drawKeys() {
        P.$$('[data-tab]', host).forEach((b, i) => { b.setAttribute('aria-selected', i === tab); b.classList.toggle('on', i === tab); });
        keysEl.innerHTML = data.tabs[tab].groups.map((g) => `<div class="skb__grp"><h4>${esc(g.title)}</h4><div class="skb__row">${
          g.keys.map(key).map((k, n) => { const tip = k.name + (k.dims ? ' · ' + dimTxt(k.dims) : '');
            return `<button type="button" class="skb__k${k.label.length > 3 ? ' skb__k--w' : ''}${k.dims ? ' skb__k--var' : ''}" data-ins="${esc(k.ins)}"${k.dims ? ` data-g="${esc(g.title)}" data-n="${n}"` : ''} title="${esc(tip)}" aria-label="${esc(k.label + ', ' + tip)}">${esc(k.label)}</button>`; }).join('')
        }</div></div>`).join('');
      }
      function showTarget() {
        const live = target && target.isConnected;
        tgtEl.textContent = live ? 'Typing into: ' + (opt.describe ? opt.describe(target) : target.getAttribute('aria-label') || 'text box') : 'Tap a box to type into';
        tgtEl.classList.toggle('off', !live);
        P.$$('.skb-on', scope).forEach((e) => e !== target && e.classList.remove('skb-on'));
        if (live && open) target.classList.add('skb-on');
        else if (target) target.classList.remove('skb-on');
      }
      /** the box to type into: last focused one, else the first empty one, else the last one */
      function getTarget() {
        const a = document.activeElement;
        if (a && a !== target && a.matches(sel) && scope.contains(a)) { target = a; showTarget(); }
        if (target && target.isConnected) return target;
        const all = P.$$(sel, scope); target = all.find((e) => !e.value) || all[all.length - 1] || null; showTarget(); return target;
      }
      function edit(fn) {
        const t = getTarget(); if (!t) return;
        const s = t.selectionStart ?? t.value.length, e = t.selectionEnd ?? t.value.length;
        fn(t, s, e);
        t.dispatchEvent(new Event('input', { bubbles: true }));
        if (!matchMedia('(pointer:coarse)').matches) t.focus(); // on touch screens, keep the phone keyboard closed
      }
      const insert = (txt) => edit((t, s, e) => { t.setRangeText(txt, s, e, 'end'); });
      const ctl = {
        left: () => edit((t, s) => { const p = Math.max(0, s - 1); t.setSelectionRange(p, p); }),
        right: () => edit((t, s, e) => { const p = Math.min(t.value.length, e + 1); t.setSelectionRange(p, p); }),
        space: () => insert(' '),
        clear: () => edit((t) => { t.value = ''; }),
        back: () => edit((t, s, e) => {
          if (s !== e) return t.setRangeText('', s, e, 'end');
          if (!s) return;
          let from = s - 1;
          if (/[\udc00-\udfff]/.test(t.value[from]) && from > 0) from--;           // surrogate pair
          while (from > 0 && isMark(t.value[from])) from--;                         // letter + combining dot
          t.setRangeText('', from, s, 'end');
        }),
      };

      // keep focus (and the caret) in the text box while tapping keys
      host.addEventListener('mousedown', (e) => { if (e.target.closest('.skb__k,[data-ctl]')) e.preventDefault(); });
      host.addEventListener('click', (e) => {
        const k = e.target.closest('.skb__k');
        if (k) {
          insert(k.dataset.ins);
          if (k.dataset.n != null && opt.onSymbol && target) {
            const g = data.tabs[tab].groups.find((x) => x.title === k.dataset.g), v = key(g.keys[+k.dataset.n]);
            opt.onSymbol(target, v);
          }
          return;
        }
        const c = e.target.closest('[data-ctl]'); if (c) return ctl[c.dataset.ctl]();
        const tb = e.target.closest('[data-tab]');
        if (tb) { tab = +tb.dataset.tab; try { localStorage.setItem('pilab:kb:tab', tab); } catch (err) {} drawKeys(); return; }
        if (e.target.closest('.skb__toggle')) { open = !open; panel.hidden = !open; $('.skb__toggle').setAttribute('aria-expanded', open); showTarget(); }
      });
      const onFocus = (e) => { if (e.target.matches && e.target.matches(sel)) { target = e.target; showTarget(); } };
      scope.addEventListener('focusin', onFocus);
      scope.addEventListener('pointerdown', onFocus);

      drawKeys(); showTarget();
      return { refresh: showTarget, setTarget(el) { target = el; showTarget(); } };
    },
  };
})();
