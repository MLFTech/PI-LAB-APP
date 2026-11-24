/* Feedback page: layout + behaviour. Wording: data/feedback.js. Questions: backend/feedback/questions.py,
   fetched from the Django server, and the answers are posted back to it (saved in its database). */
(function () {
  const P = PiLab, DRAFT = 'pilab:feedback:draft';
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const csrf = () => P.csrf();
  const store = {
    key: DRAFT,
    get() { try { return JSON.parse(localStorage.getItem(this.key)) || {}; } catch (e) { return {}; } },
    set(v) { try { localStorage.setItem(this.key, JSON.stringify(v)); } catch (e) {} },
    clear() { try { localStorage.removeItem(this.key); } catch (e) {} },
  };

  P.templates.feedback = (d) => `<div class="page fb">
    <div class="crumb"><a href="#/">Home</a> / Feedback</div>
    <h1>${d.title}</h1><p class="lead fb__lead">${d.lead}</p>
    <p class="note fb__privacy">🔒 ${d.privacy}</p>
    <div id="fb-body" aria-live="polite"><div class="think" aria-hidden="true"><i></i><i></i><i></i></div></div></div>`;

  /* ---- one question ---- */
  function field(q, agree, d) {
    const id = 'q-' + q.code, req = q.required ? `<span class="fb__req">${d.required}</span>` : '';
    const head = (tag) => `<${tag} class="fb__q-t">${esc(q.label)} ${req}</${tag}>`;
    const radios = (opts, values, cls) => `<div class="fb__opts ${cls}">${opts.map((o, n) => `<label class="fb__o">
        <input type="radio" name="${q.code}" value="${esc(values[n])}"><span>${esc(o)}</span></label>`).join('')}</div>`;
    switch (q.type) {
      case 'text':
        return `<div class="fb__q" data-q="${q.code}"><label class="fb__q-t" for="${id}">${esc(q.label)} ${req}</label>
          <input id="${id}" class="inp" name="${q.code}" maxlength="${q.max || 200}" placeholder="${esc(q.placeholder || '')}" autocomplete="${q.code === 'name' ? 'name' : 'off'}"></div>`;
      case 'long':
        return `<div class="fb__q" data-q="${q.code}"><label class="fb__q-t" for="${id}">${esc(q.label)} ${req}</label>
          <textarea id="${id}" class="inp ta" name="${q.code}" rows="3" maxlength="${q.max || 2000}"></textarea></div>`;
      case 'choice':
        return `<fieldset class="fb__q" data-q="${q.code}">${head('legend')}${radios(q.options, q.options, 'fb__opts--list')}
          ${q.other ? `<input class="inp fb__other" name="occupation_other" maxlength="100" placeholder="${esc(d.otherLabel)}" aria-label="${esc(d.otherLabel)}" hidden>` : ''}</fieldset>`;
      case 'multi':
        return `<fieldset class="fb__q" data-q="${q.code}">${head('legend')}<div class="fb__opts fb__opts--list">${q.options.map((o) => `<label class="fb__o fb__o--cb">
          <input type="checkbox" name="${q.code}" value="${esc(o)}"><span class="cb" aria-hidden="true"></span><span>${esc(o)}</span></label>`).join('')}</div></fieldset>`;
      case 'likert':
        return `<fieldset class="fb__q fb__q--lk" data-q="${q.code}">${head('legend')}${radios(agree, [1, 2, 3, 4, 5], 'fb__opts--scale')}</fieldset>`;
      case 'rating':
        return `<fieldset class="fb__q" data-q="${q.code}">${head('legend')}${radios(q.options.map((o, n) => `${'★'.repeat(n + 1)} ${o}`), [1, 2, 3, 4, 5], 'fb__opts--scale fb__opts--star')}</fieldset>`;
      case 'scale10':
        return `<fieldset class="fb__q" data-q="${q.code}">${head('legend')}${radios([...Array(11).keys()].map(String), [...Array(11).keys()], 'fb__opts--ten')}
          <div class="fb__ends"><span>0 = ${esc(q.low)}</span><span>10 = ${esc(q.high)}</span></div></fieldset>`;
      default: return '';
    }
  }

  /** sign-in card, "already answered" card, or a notice */
  function gate(body, d, me) {
    const s = d.signin, err = P.auth.error; P.auth.error = null;
    if (!me.configured) { body.innerHTML = `<p class="note warn">${s.notSetUp}</p>`; return; }
    if (me.responded) {
      const when = me.responded_at ? new Date(me.responded_at).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' }) : '';
      body.innerHTML = `<div class="sk fb__done"><span class="fb__tick" aria-hidden="true">✓</span><h2>${s.doneTitle}</h2>
        <p>${s.doneText(esc(me.email), when)}</p><div class="row-act"><a class="btn btn--p" href="#/">Back to home</a></div></div>`;
      return;
    }
    body.innerHTML = `<div class="sk fb__gate"><span class="fb__lock" aria-hidden="true">🔑</span><h2>${s.title}</h2><p>${s.text}</p>
      ${me.signed_in ? `<p class="note warn">${s.notGoogle}</p>` : ''}${err ? `<p class="note warn bad" role="alert">${esc(err)}</p>` : ''}
      <a class="btn btn--p fb__g" href="${P.auth.loginUrl()}"><span class="fb__gi" aria-hidden="true">G</span>${s.button}</a>
      <p class="note">${s.why}</p></div>`;
  }

  P.mountFeedback = async function (d, view) {
    const body = P.$('#fb-body', view);
    const me = await P.auth.load();
    if (!view.isConnected) return;
    if (!me) { body.innerHTML = `<p class="note warn">${d.offline}</p>`; return; }
    if (!me.google || me.responded || !me.configured) { gate(body, d, me); return; }
    let form;
    try {
      const res = await fetch(d.api.questions, { credentials: 'same-origin' });
      if (!(res.headers.get('content-type') || '').includes('application/json')) throw new Error('offline');
      form = await res.json();
    } catch (e) { body.innerHTML = `<p class="note warn">${d.offline}</p>`; return; }
    if (!view.isConnected) return;
    store.key = DRAFT + ':' + me.email;                            // drafts never mix between accounts
    const questions = form.sections.flatMap((s) => s.questions), required = questions.filter((q) => q.required);

    body.innerHTML = `<form class="fb__form" novalidate>
      <p class="fb__who">${d.signin.as} <b>${esc(me.email)}</b> · <button class="linkb" type="button" data-signout>${d.signin.notYou}</button></p>
      <div class="sk sk--sm fb__bar"><div class="fb__track"><i id="fb-fill"></i></div><span id="fb-count" class="note"></span></div>
      ${form.sections.map((s, n) => `<section class="sk fb__sec" aria-labelledby="fs-${s.id}">
        <div class="cp__h"><span class="num">${String.fromCharCode(65 + n)}</span><h2 id="fs-${s.id}">${esc(s.title)}</h2></div>
        ${s.intro ? `<p class="fb__intro">${esc(s.intro)}</p>` : ''}
        ${s.questions.map((q) => field(q, form.agree, d)).join('')}</section>`).join('')}
      <div class="fb__send"><p class="note">${d.draftNote}</p><p class="note warn bad" id="fb-err" hidden></p>
        <button class="btn btn--p" type="submit">${d.submit}</button></div></form>`;
    const f = P.$('form', body), other = P.$('.fb__other', body);

    /* read the form -> {answers, occupation_other} */
    function read() {
      const answers = {};
      questions.forEach((q) => {
        if (q.type === 'multi') answers[q.code] = P.$$(`input[name="${q.code}"]:checked`, f).map((i) => i.value);
        else if (['text', 'long'].includes(q.type)) answers[q.code] = f.elements[q.code].value;
        else {
          const c = P.$(`input[name="${q.code}"]:checked`, f);
          answers[q.code] = c ? (['likert', 'rating', 'scale10'].includes(q.type) ? +c.value : c.value) : null;
        }
      });
      return { answers, occupation_other: other ? other.value : '' };
    }
    const answered = (q, a) => { const v = a[q.code]; return Array.isArray(v) ? v.length > 0 : v !== null && v !== undefined && String(v).trim() !== ''; };
    function update() {
      const data = read(), done = required.filter((q) => answered(q, data.answers)).length;
      P.$('#fb-fill', f).style.width = (100 * done / required.length) + '%';
      P.$('#fb-count', f).textContent = d.progress(done, required.length);
      if (other) other.hidden = data.answers.occupation !== 'Other';
      store.set(data);
      return data;
    }
    /* put a saved draft back */
    const draft = store.get();
    if (draft.answers) {
      questions.forEach((q) => {
        const v = draft.answers[q.code]; if (v == null) return;
        if (['text', 'long'].includes(q.type)) f.elements[q.code].value = v;
        else P.$$(`input[name="${q.code}"]`, f).forEach((i) => { i.checked = Array.isArray(v) ? v.includes(i.value) : String(v) === i.value; });
      });
      if (other && draft.occupation_other) other.value = draft.occupation_other;
    }
    if (!f.elements.name.value && me.name) f.elements.name.value = me.name;     // from the Google account
    P.$('[data-signout]', f).onclick = () => P.auth.signOut();
    function flag(code, msg) {
      P.$$('.fb__q.bad', f).forEach((e) => e.classList.remove('bad'));
      const err = P.$('#fb-err', f); err.textContent = msg; err.hidden = false;
      const q = code && P.$(`[data-q="${code}"]`, f);
      if (q) { q.classList.add('bad'); q.scrollIntoView({ behavior: 'smooth', block: 'center' }); const i = P.$('input,textarea', q); i && i.focus({ preventScroll: true }); }
    }
    f.addEventListener('input', () => { update(); });
    f.addEventListener('change', (e) => {
      update();
      const q = e.target.closest('.fb__q'); if (q && q.classList.contains('bad')) { q.classList.remove('bad'); P.$('#fb-err', f).hidden = true; }
    });
    f.addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = update(), miss = required.find((q) => !answered(q, data.answers));
      if (miss) return flag(miss.code, d.missing);
      if (data.answers.occupation === 'Other' && !other.value.trim()) return flag('occupation', d.otherLabel + '.');
      const btn = P.$('button[type=submit]', f), label = btn.textContent; btn.disabled = true; btn.textContent = 'Sending…';
      try {
        const res = await fetch(d.api.submit, { method: 'POST', credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrf() }, body: JSON.stringify(data) });
        if (!(res.headers.get('content-type') || '').includes('application/json')) throw new Error(res.status === 403 ? 'The page lost its security token. Reload the page and try again.' : 'offline');
        const r = await res.json();
        if (r.signin || r.already) { if (r.already) store.clear(); return P.mountFeedback(d, view); }   // signed out, or answered in another tab
        if (!r.ok) return flag(r.field, r.error);
        store.clear(); P.auth.load();
        body.innerHTML = `<div class="sk fb__done"><span class="fb__tick" aria-hidden="true">✓</span><h2>${d.thanks.title}</h2><p>${d.thanks.text}</p>
          <div class="row-act"><a class="btn btn--p" href="#/">Back to home</a></div></div>`;
        view.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } catch (err) {
        flag(null, err.message === 'offline' ? 'Could not reach the Pi Lab server. Check it is running, then press Send again.' : err.message);
      } finally { if (btn.isConnected) { btn.disabled = false; btn.textContent = label; } }
    });
    update();
  };
})();
