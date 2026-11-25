/* Calculator template: layout + interface behaviour. Content: data/calculator.js.
   The Π groups are computed by the Python solver (backend/pigroups, Django) at d.api.piGroups. */
(function () {
  const P = PiLab, DIM = ['M', 'L', 'T', 'Θ'];
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const dimTxt = (d) => { const o = d.map((e, i) => e ? DIM[i] + (e === 1 ? '' : P.sup(e)) : '').filter(Boolean).join(' '); return o || 'dimensionless'; };

  /* ---- formatting helpers for the solver's answer ---- */
  const sym = (s) => esc(s).replace(/_(\w+)/, '<sub>$1</sub>');                       // C_F -> C<sub>F</sub>
  const pow = (name, e) => esc(name) + (e === 1 ? '' : `<sup>${String(e).replace('-', '−')}</sup>`);
  /** terms [{name, exp}] -> fraction HTML */
  function expr(terms) {
    const top = terms.filter((t) => t.exp > 0).map((t) => pow(t.name, t.exp)), bot = terms.filter((t) => t.exp < 0).map((t) => pow(t.name, -t.exp));
    return bot.length ? P.frac(top.join(' ') || '1', bot.join(' ')) : top.join(' ');
  }
  /** plain text version for copying */
  function exprTxt(terms) {
    const p = (t, e) => t.name + (e === 1 ? '' : P.sup(e));
    const top = terms.filter((t) => t.exp > 0).map((t) => p(t, t.exp)), bot = terms.filter((t) => t.exp < 0).map((t) => p(t, -t.exp));
    return bot.length ? `${top.join(' ') || '1'}/(${bot.join(' ')})` : top.join(' ');
  }
  /** named-number badge: "Reynolds number · 1/Re" with its formula and meaning */
  function namedHtml(n) {
    if (!n) return '<span class="pi__nn">no common name: keep it as a Π group</span>';
    const f = n.formula ? ` <span class="pi__f">where ${sym(n.symbol)} = ${esc(n.formula)}</span>` : '';
    return `<b>${esc(n.name)}</b> <span class="chip math">${sym(n.display)}</span>${f}${n.meaning ? `<span class="pi__mean">${esc(n.meaning)}</span>` : ''}`;
  }
  /** the symbol to use in "C_F = f(Re, Ma)": inverses and powers of a group are groups too, so drop them */
  const fnSym = (g) => (g.named && (g.named.type === 'named' || g.named.type === 'given') ? sym(g.named.symbol) : g.id);

  P.templates.calculator = function (d) {
    const i = d.input, a = d.answer, x = d.extractor;
    return `<div class="page">
    <div class="crumb"><a href="#/">Home</a> / Calculator</div>
    <h1>${d.title}</h1><p class="lead" style="margin-top:10px;max-width:60ch">${d.lead}</p>
    <div class="calc">
      <section class="sk cp cp--ex" aria-labelledby="c1"><div class="cp__h"><span class="num">1</span><h2 id="c1">${x.title} <span class="ai-tag">AI</span></h2></div>
        <p class="cp__hint">${x.hint}</p>
        <div class="ex">
          <div class="ex__in">
            <label class="sr" for="ex-text">Problem statement</label>
            <textarea id="ex-text" class="inp ta" rows="5" maxlength="4000" placeholder="${esc(x.placeholder)}"></textarea>
            <button class="linkb" type="button" data-act="sample">${x.sampleLabel}</button>
            <div class="or"><span>and / or</span></div>
            <label class="drop" id="ex-drop" for="ex-file"><input id="ex-file" type="file" accept="image/jpeg,image/png,image/gif,image/webp" class="sr">
              <span class="drop__ic" aria-hidden="true">🖼</span><b>${x.drop}</b><span class="note">${x.dropNote}</span>
              <img id="ex-prev" alt="Preview of the problem picture" hidden></label>
            <div class="row-act"><button class="btn btn--p" type="button" data-act="extract">${x.button}</button>
              <button class="btn btn--sm" type="button" data-act="exclear">Clear</button></div>
          </div>
          <div id="ex-out" class="ex__out" aria-live="polite"></div>
        </div>
      </section>

      <section class="sk cp cp--in" aria-labelledby="c2"><div class="cp__h"><span class="num">2</span><h2 id="c2">${i.title}</h2></div>
        <p class="cp__hint">${i.hint}</p>
        <div class="count"><label for="nvar">Number of variables</label>
          <div class="stepper"><button type="button" data-act="dec" aria-label="Fewer variables">−</button><input id="nvar" class="inp" type="number" min="1" max="${d.maxRows}" value="${i.initial.length}" inputmode="numeric"><button type="button" data-act="inc" aria-label="More variables">+</button></div>
          <span class="note" id="nstat"></span></div>
        <div class="count"><label for="dep">${i.dependentLabel}</label><select id="dep" class="inp dep"></select></div>
        <div class="grid" role="table" aria-label="Variables">
          <div class="crow crow--h" role="row"><span class="c-i"></span>${i.columns.map((c, k) => `<span class="c-${['nm', 'd', 'd', 'd', 'd', 'rp'][k]}" role="columnheader">${c}</span>`).join('')}<span class="c-x sr">Delete</span></div>
          <div id="rows"></div></div>
        <p class="note autod" id="autod" aria-live="polite"></p>
        <div id="symkb"></div>
        <div class="row-act"><button class="btn btn--sm" type="button" data-act="add">+ Add row</button><button class="btn btn--p" type="button" data-act="calc">Calculate Π groups</button></div>
      </section>

      <section class="sk cp cp--out" id="answer" aria-labelledby="c3"><div class="cp__h"><span class="num">3</span><h2 id="c3">${a.title}</h2></div>
        <div id="ans" aria-live="polite"><p class="note">${a.empty}</p></div>
      </section>
    </div></div>`;
  };

  /** the answer panel, built from the solver's JSON */
  function answerHtml(r, d) {
    const res = r.result, rows = res.rearranged, dep = res.groups.find((g) => g.has_dependent);
    const groupHtml = (g) => `<li class="sk sk--sm pi"><span class="pi__id math">${g.id}</span><span class="pi__e math">${expr(g.terms)}</span>
      <span class="pi__m">${namedHtml(g.named)}<span class="ok">✓ ${g.check}</span></span>
      ${g.given ? '' : `<details class="work"><summary>Show the working</summary>
        <p class="work__l">Unknown powers on the repeating variables:</p>
        <div class="math work__eq">${g.id} = ${esc(g.target_name)} ${g.letters.map((l) => `${esc(l.name)}<sup>${l.letter}</sup>`).join(' ')}</div>
        <div class="math work__eq">= ${dimHtml(r, g.target)} ${g.letters.map((l) => `(${dimHtml(r, l.var)})<sup>${l.letter}</sup>`).join(' ')} = ${g.check}</div>
        <p class="work__l">Power of each dimension = 0:</p><div class="math work__eqs">${g.equations.map((e) => `<div><b>${e.dim}:</b> ${esc(e.text)}</div>`).join('')}</div>
        <p class="work__l">Powers that make every equation true:</p><p class="work__sol math">${g.letters.map((l) => `${l.letter} = ${l.value}`).join(', ')}${g.scale !== 1 ? ` &nbsp;(then raised to the power ${g.scale})` : ''}</p></details>`}</li>`;
    const fnLine = (list, f) => (dep ? `${f(dep)} = f ( ${list.filter((g) => g !== dep).map(f).join(', ')} )` : `f ( ${list.map(f).join(', ')} ) = 0`);
    const final = rows || res.groups, depR = rows ? rows[res.groups.indexOf(dep)] : dep;
    const eqs = [
      ['In Π form', fnLine(res.groups, (g) => g.id)],
      ['In variables', fnLine(res.groups, (g) => expr(g.terms))],
    ];
    if (final.some((g) => g.named && g.named.type !== 'ratio')) {
      eqs.push(['With named groups', depR ? `${fnSym(depR)} = f ( ${final.filter((g) => g !== depR).map(fnSym).join(', ')} )` : `f ( ${final.map(fnSym).join(', ')} ) = 0`]);
    }
    return `<div class="sum">${[['Variables n', r.n], ['Dimensions k', r.k], ['Π groups n − k', r.n_pi]].map(([k, v]) => `<div class="sk sk--sm"><b>${v}</b><span>${k}</span></div>`).join('')}</div>
      ${r.warnings.map((w) => `<p class="note warn">${esc(w)}</p>`).join('')}
      <p class="lbl">Repeating variables</p><p>${res.repeating_names.map((n) => `<span class="chip math">${esc(n)}</span>`).join('')}
        <span class="note">${r.auto ? 'chosen by Pi Lab (none were ticked)' : 'your choice'} · k = ${r.k} for ${r.dims.join(', ')}</span></p>
      <p class="lbl">Dimensionless groups</p><ol class="pis">${res.groups.map(groupHtml).join('')}</ol>
      ${rows ? `<p class="lbl">Recognised numbers</p><p class="note">Any product of Π groups is also a Π group. Combining them like this turns the groups above into well-known numbers:</p>
        <ol class="pis">${rows.map((g) => `<li class="sk sk--sm pi ${g.from ? 'pi--new' : ''}"><span class="pi__id math">${g.id}</span><span class="pi__e math">${expr(g.terms)}</span>
          <span class="pi__m">${g.from ? `<span class="pi__from math">${esc(g.from)}</span>` : ''}${namedHtml(g.named)}</span></li>`).join('')}</ol>` : ''}
      <p class="lbl">Final equation</p>
      <div class="eqs">${eqs.map(([l, q], k) => `<div class="sk sk--sm eqb ${k === eqs.length - 1 ? 'eqb--hi' : ''}"><span class="note">${l}</span><div class="eq math">${q}</div></div>`).join('')}</div>
      <div class="row-act"><button class="btn btn--sm" type="button" data-act="copy">Copy equation</button><span class="note" id="copied" aria-live="polite"></span></div>
      <details class="kinds-read"><summary>How Pi Lab read your variables</summary><ul>${r.variables.map((v) => `<li><b class="math">${esc(v.name)}</b> [${dimTxt(v.dims)}] → ${v.kind_label ? esc(v.kind_label) : '<span class="note">not recognised (its groups can still be built)</span>'}</li>`).join('')}</ul>
        <p class="note">Named numbers are spotted from each variable's symbol and dimensions, e.g. h with M T⁻³ Θ⁻¹ is a heat transfer coefficient.</p></details>
      ${r.alternatives.length ? `<details class="alts"><summary>Other valid sets of repeating variables (${r.alternatives_total})</summary>
        ${r.alternatives.map((s, k) => `<div class="sk sk--sm alt"><div class="alt__h"><span>${s.repeating_names.map((n) => `<span class="chip math">${esc(n)}</span>`).join('')}</span>
          <button class="btn btn--sm" type="button" data-act="useset" data-k="${k}">Use this set</button></div>
          <div class="alt__g">${s.groups.map((g) => `<span class="math">${g.id} = ${expr(g.terms)}${g.named ? ` <span class="chip math">${sym(g.named.display)}</span>` : ''}</span>`).join('')}</div></div>`).join('')}</details>` : ''}`;
  }
  const dimHtml = (r, i) => r.variables[i].dims.map((e, k) => (e ? DIM[k] + (e === 1 ? '' : `<sup>${String(e).replace('-', '−')}</sup>`) : '')).filter(Boolean).join(' ') || '1';

  P.mountCalculator = function (d, view) {
    const $ = (s) => P.$(s, view), max = d.maxRows;
    let rows = d.input.initial.map((r) => ({ name: r.name, d: r.d.slice(), rep: r.rep }));
    let dep = 0, last = null;
    const rowsEl = $('#rows'), nvar = $('#nvar'), depEl = $('#dep'), ans = $('#ans');
    const blank = () => ({ name: '', d: [0, 0, 0, 0], rep: false });
    /* symbol keyboard (js/components/symbol-keyboard.js) types into the variable-name boxes */
    const kb = P.symbolKeyboard && P.symbolKeyboard.mount($('#symkb'), {
      scope: rowsEl, targets: 'input.c-nm', describe: (el) => 'variable ' + (+el.closest('.crow').dataset.i + 1),
      onSymbol: setDims,
    });
    /** a variable key (data/symbols/) was typed into a name box: fill in that row's M, L, T, Θ powers */
    function setDims(el, k, others = []) {
      const row = el.closest('.crow'); if (!row) return;
      const i = +row.dataset.i; rows[i].d = k.dims.slice(); rows[i].auto = true;
      P.$$('input[data-f="d"]', row).forEach((inp, n) => { inp.value = k.dims[n]; inp.classList.remove('auto'); void inp.offsetWidth; inp.classList.add('auto'); });
      const alt = others.filter((o) => o.dims.join() !== k.dims.join()).map((o) => `${o.name} [${dimTxt(o.dims)}]`);
      $('#autod').textContent = `Variable ${i + 1}: ${k.label} (${k.name}) set to [${dimTxt(k.dims)}].`
        + (alt.length ? ` ${k.label} can also mean ${alt.join(' or ')}: tap that key, or change the powers.` : ' Change the powers if your variable means something else.');
    }
    /* every variable symbol in data/symbols/, so a name typed any way (keyboard tab, Greek tab, own keyboard) finds its powers */
    const known = {};
    Object.values(P.symbols || {}).forEach((t) => t.groups.forEach((g) => g.keys.forEach((k) => {
      if (typeof k[2] !== 'number') return;
      const v = { label: k[0], name: k[1], dims: k.slice(2, 6) }, list = known[k[0]] || (known[k[0]] = []);
      if (!list.some((o) => o.name === v.name)) list.push(v);
    })));
    /** 'ρ∞' or 'μ₁' -> the entries for ρ / μ */
    const lookup = (name) => { const s = name.trim(); return known[s] || known[s.replace(/[∞₀-₉′″ʹ]+$/, '')] || null; };
    /** fill a row's powers from its name, unless the student has typed their own powers into that row */
    function autoFill(el, i) {
      const r = rows[i], hit = lookup(r.name);
      if (!hit || (!r.auto && r.d.some((x) => x))) return;
      setDims(el, hit[0], hit.slice(1));
    }
    function stat() {
      const k = rows.filter((r) => r.rep).length;
      $('#nstat').textContent = k ? `${k} repeating selected` : 'no repeating ticked: Pi Lab will choose';
      nvar.value = rows.length;
    }
    function drawDep() {
      if (dep !== null && dep >= rows.length) dep = 0;
      depEl.innerHTML = rows.map((r, n) => `<option value="${n}" ${n === dep ? 'selected' : ''}>${esc(r.name || `variable ${n + 1}`)}</option>`).join('')
        + `<option value="" ${dep === null ? 'selected' : ''}>${esc(d.input.noDependent)}</option>`;
    }
    function draw() {
      rowsEl.innerHTML = rows.map((r, n) => `<div class="crow" role="row" data-i="${n}">
        <span class="c-i" aria-hidden="true">${n + 1}</span>
        <input class="inp c-nm math" data-f="name" value="${esc(r.name)}" placeholder="name" aria-label="Variable ${n + 1} name">
        ${r.d.map((v, k) => `<label class="c-d"><span class="dl">${DIM[k]}</span><input class="inp" type="number" step="1" data-f="d" data-k="${k}" value="${v}" aria-label="Variable ${n + 1} exponent of ${DIM[k]}"></label>`).join('')}
        <label class="c-rp"><input type="checkbox" data-f="rep" ${r.rep ? 'checked' : ''}><span class="cb" aria-hidden="true"></span><span class="dl">Repeat</span><span class="sr">Repeating variable ${n + 1}</span></label>
        <button class="c-x del" type="button" data-act="del" aria-label="Delete row ${n + 1}">✕</button></div>`).join('') || '<p class="note empty">No variables yet. Add a row to begin.</p>';
      stat(); drawDep(); kb && kb.refresh();
    }
    function resize(n) {
      n = Math.max(1, Math.min(max, n | 0)); while (rows.length < n) rows.push(blank()); rows.length = n; draw();
    }
    rowsEl.addEventListener('input', (e) => {
      const f = e.target.dataset.f, i = +e.target.closest('.crow').dataset.i; if (!f) return;
      if (f === 'name') { rows[i].name = e.target.value; const o = depEl.options[i]; if (o) o.textContent = e.target.value || `variable ${i + 1}`; autoFill(e.target, i); }
      else if (f === 'd') { rows[i].d[+e.target.dataset.k] = e.target.value === '' ? 0 : +e.target.value; rows[i].auto = false; }
      else if (f === 'rep') { rows[i].rep = e.target.checked; stat(); }
    });
    depEl.addEventListener('change', () => { dep = depEl.value === '' ? null : +depEl.value; });
    nvar.addEventListener('input', () => { const v = parseInt(nvar.value, 10); if (v >= 1) resize(v); });
    nvar.addEventListener('blur', () => { nvar.value = rows.length; });

    const csrf = () => (document.cookie.match(/(?:^|;\s*)csrftoken=([^;]+)/) || [])[1] || '';
    /** POST JSON to the Django backend; throws 'csrf' or 'offline' when the reply is not the API's JSON */
    async function post(url, body) {
      const res = await fetch(url, { method: 'POST', credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrf() }, body: JSON.stringify(body) });
      if (!(res.headers.get('content-type') || '').includes('application/json')) throw new Error(res.status === 403 ? 'csrf' : 'offline');
      return res.json();
    }
    const failMsg = (e) => (e.message === 'csrf' ? 'The page lost its security token. Reload the page and try again.' : d.answer.offline);

    /* AI variable extractor (backend: pigroups/extract.py) */
    const x = d.extractor, exOut = $('#ex-out'), exText = $('#ex-text'), exFile = $('#ex-file'), exPrev = $('#ex-prev'), exDrop = $('#ex-drop');
    let picture = null, found = [];                                     // picture = {media_type, data (base64)}
    /** shrink the picture in the browser (longest side 1568 px, JPEG) so the upload stays small */
    function readPicture(file) {
      if (!file || !/^image\//.test(file.type)) { exOut.innerHTML = '<p class="note warn">Please choose a picture file (JPG or PNG).</p>'; return; }
      const url = URL.createObjectURL(file), img = new Image();
      img.onload = () => {
        const s = Math.min(1, 1568 / Math.max(img.naturalWidth, img.naturalHeight)), c = document.createElement('canvas');
        c.width = Math.round(img.naturalWidth * s); c.height = Math.round(img.naturalHeight * s);
        const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(img, 0, 0, c.width, c.height);
        const dataUrl = c.toDataURL('image/jpeg', 0.88);
        picture = { media_type: 'image/jpeg', data: dataUrl.split(',')[1] };
        exPrev.src = dataUrl; exPrev.hidden = false; exDrop.classList.add('has'); P.$('b', exDrop).textContent = file.name || 'Pasted picture';
        URL.revokeObjectURL(url);
      };
      img.onerror = () => { URL.revokeObjectURL(url); exOut.innerHTML = '<p class="note warn">That picture could not be opened. Try a JPG or PNG.</p>'; };
      img.src = url;
    }
    exFile.addEventListener('change', () => readPicture(exFile.files[0]));
    ['dragenter', 'dragover'].forEach((t) => exDrop.addEventListener(t, (e) => { e.preventDefault(); exDrop.classList.add('over'); }));
    ['dragleave', 'drop'].forEach((t) => exDrop.addEventListener(t, (e) => { e.preventDefault(); exDrop.classList.remove('over'); }));
    exDrop.addEventListener('drop', (e) => readPicture(e.dataTransfer.files[0]));
    $('.cp--ex').addEventListener('paste', (e) => {                    // paste a screenshot straight into the card
      const f = [...((e.clipboardData && e.clipboardData.files) || [])].find((x) => /^image\//.test(x.type));
      if (f) { e.preventDefault(); readPicture(f); }
    });
    function showFound(r) {
      found = r.variables.map((v) => ({ ...v, on: true }));
      exOut.innerHTML = `<p class="lbl">${x.found}</p>` + (found.length ? `<ul class="found">${found.map((v, n) => `<li class="sk sk--sm"><label>
          <input type="checkbox" data-n="${n}" checked><span class="cb" aria-hidden="true"></span>
          <span class="fv"><b class="math">${esc(v.symbol)}</b> <span>${esc(v.name)}</span><span class="note">[${dimTxt(v.dims)}]</span></span>
          <span class="role role--${v.role}">${v.role}</span></label>${v.reason ? `<p class="fv__why">${esc(v.reason)}</p>` : ''}</li>`).join('')}</ul>
        <button class="btn btn--p btn--sm" type="button" data-act="use">${x.add}</button>` : `<p class="note">${x.none}</p>`)
        + (r.note ? `<p class="note">${esc(r.note)}</p>` : '') + `<p class="note ex__warn">${x.disclaimer}</p>`;
    }
    exOut.addEventListener('change', (e) => {
      const n = e.target.dataset.n; if (n == null) return;
      found[n].on = e.target.checked; e.target.closest('li').classList.toggle('off', !e.target.checked);
    });
    async function extractVars(btn) {
      const text = exText.value.trim();
      if (!text && !picture) { exOut.innerHTML = '<p class="note warn">Type the problem statement or add a picture first.</p>'; exText.focus(); return; }
      btn.disabled = true; const label = btn.textContent; btn.textContent = x.working;
      exOut.innerHTML = '<div class="think" aria-hidden="true"><i></i><i></i><i></i></div>';
      try {
        const r = await post(d.api.extract, { text, image: picture });
        if (r.ok) showFound(r); else exOut.innerHTML = `<p class="note warn bad">${esc(r.error)}</p>`;
      } catch (e) { exOut.innerHTML = `<p class="note warn">${failMsg(e)}</p>`; }
      finally { btn.disabled = false; btn.textContent = label; }
    }

    /* the solver */
    async function calculate(btn) {
      btn.disabled = true; const label = btn.textContent; btn.textContent = 'Calculating…';
      ans.innerHTML = '<div class="think" aria-hidden="true"><i></i><i></i><i></i></div>';
      const payload = { dependent: dep, variables: rows.map((r) => ({ name: r.name.trim(), dims: r.d, repeating: r.rep })) };
      try {
        const r = await post(d.api.piGroups, payload);
        if (!r.ok) { last = null; ans.innerHTML = `<p class="note warn bad">${esc(r.error)}</p>`; }
        else { last = r; ans.innerHTML = answerHtml(r, d); }
      } catch (e) {
        last = null;
        ans.innerHTML = `<p class="note warn">${failMsg(e)}</p>`;
      } finally {
        btn.disabled = false; btn.textContent = label;
        const a = $('#answer'); a.classList.remove('flash'); void a.offsetWidth; a.classList.add('flash');
        if (a.getBoundingClientRect().top < 0 || a.getBoundingClientRect().top > innerHeight * 0.6) a.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
    function copyText() {
      const res = last.result, dp = res.groups.find((g) => g.has_dependent), o = res.groups.filter((g) => g !== dp);
      const t = (g) => exprTxt(g.terms);
      return dp ? `${t(dp)} = f( ${o.map(t).join(', ')} )` : `f( ${o.map(t).join(', ')} ) = 0`;
    }

    const act = {
      sample() { exText.value = x.sample; exText.focus(); },
      exclear() {
        exText.value = ''; picture = null; found = []; exFile.value = ''; exOut.innerHTML = '';
        exPrev.removeAttribute('src'); exPrev.hidden = true; exDrop.classList.remove('has'); P.$('b', exDrop).textContent = x.drop;
      },
      extract(btn) { extractVars(btn); },
      use() {                                                           // put the ticked variables into the table
        const pick = found.filter((v) => v.on); if (!pick.length) return;
        rows = pick.slice(0, max).map((v) => ({ name: v.symbol, d: v.dims.slice(), rep: false }));
        const k = pick.slice(0, max).findIndex((v) => v.role === 'dependent'); dep = k >= 0 ? k : null;
        draw(); $('#c2').scrollIntoView({ behavior: 'smooth', block: 'start' });
      },
      dec() { resize(rows.length - 1); }, inc() { resize(rows.length + 1); },
      add() { if (rows.length < max) { rows.push(blank()); draw(); const l = rowsEl.querySelector('.crow:last-child .c-nm'); l && l.focus(); } },
      del(btn) {
        const i = +btn.closest('.crow').dataset.i;
        if (rows.length > 1) { rows.splice(i, 1); if (dep !== null && dep > i) dep--; else if (dep === i) dep = 0; } else rows[0] = blank();
        draw();
      },
      calc(btn) { calculate(btn); },
      useset(btn) {
        const s = last && last.alternatives[+btn.dataset.k]; if (!s) return;
        rows.forEach((r, n) => { r.rep = s.repeating.includes(n); }); draw();
        calculate($('[data-act="calc"]'));
      },
      copy() {
        if (!last) return; const m = $('#copied'); const ok = () => { m.textContent = 'Copied'; setTimeout(() => (m.textContent = ''), 1800); };
        try { navigator.clipboard.writeText(copyText()).then(ok, () => { m.textContent = 'Copy not allowed here'; }); } catch (e) { m.textContent = 'Copy not allowed here'; }
      }
    };
    view.addEventListener('click', (e) => { const b = e.target.closest('[data-act]'); if (b && act[b.dataset.act]) act[b.dataset.act](b); });
    draw();
  };
})();
