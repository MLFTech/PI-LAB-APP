/* Shell: header, hash router, data loading. */
(function () {
  const P = PiLab, view = P.$('#view'), chrome = P.$('#chrome');
  const NAV = [['Home', '#/'], ['Guide', '#/guide'], ['Exercise', '#/exercise'], ['Calculator', '#/calculator'], ['Feedback', '#/feedback']];
  const load = (src) => new Promise((ok, no) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = () => no(new Error('Could not load ' + src)); document.body.appendChild(s); });
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  P.csrf = () => (document.cookie.match(/(?:^|;\s*)csrftoken=([^;]+)/) || [])[1] || '';

  /* Sign in with Google (backend/accounts). me = null when the page is not served by Django. */
  P.auth = {
    me: null, error: null,
    async load() {
      try {
        const r = await fetch('auth/me/', { credentials: 'same-origin', cache: 'no-store' });
        this.me = (r.headers.get('content-type') || '').includes('json') ? await r.json() : null;
      } catch (e) { this.me = null; }
      if (this.me && this.me.error) this.error = this.me.error;      // a failed sign-in, shown once
      return this.me;
    },
    /** Google sign-in, coming back to the page the person is on */
    loginUrl: () => 'auth/google/login/?next=' + encodeURIComponent('/' + (location.hash || '#/')),
    async signOut() {
      try { await fetch('auth/logout/', { method: 'POST', credentials: 'same-origin', headers: { 'X-CSRFToken': P.csrf() } }); } catch (e) {}
      await this.load(); route();
    },
  };

  async function boot() {
    const m = window.PiLabManifest, who = P.auth.load();
    try { for (const f of [...m.shared, ...m.guides, ...m.exercises]) await load(f); } catch (e) { view.innerHTML = `<div class="page"><div class="sk soon"><h2>Something went missing</h2><p>${e.message}</p></div></div>`; return; }
    await who;
    window.addEventListener('hashchange', route); route();
  }
  /** the sign-in button (desktop) and menu entry (phone), or who is signed in */
  function account() {
    const me = P.auth.me;
    if (!me) return { side: '', menu: '' };                       // static server: no accounts
    if (me.signed_in) {
      const who = esc(me.email || me.name);
      return { side: `<div class="nav__user"><span class="nav__av" aria-hidden="true">${esc((me.name || me.email || '?').trim()[0].toUpperCase())}</span>
          <span class="nav__em" title="${who}">${who}</span><button class="btn btn--sm" type="button" data-signout>Sign out</button></div>`,
        menu: `<button class="nav__acct" type="button" data-signout>Sign out (${who})</button>` };
    }
    return { side: `<a class="btn btn--sm nav__signin" href="${P.auth.loginUrl()}">Sign in with Google</a>`,
      menu: `<a class="nav__acct" href="${P.auth.loginUrl()}">Sign in with Google</a>` };
  }
  function header(active) {
    const acc = account();
    chrome.innerHTML = `<nav class="sk nav" aria-label="Main"><a class="logo" href="#/"><img src="img/logo.svg" alt="" width="44" height="44">Pi Lab</a>
      <div class="nav__links" id="links">${NAV.map(([l, h]) => `<a href="${h}" class="${l === active ? 'on' : ''}">${l}</a>`).join('')}${acc.menu}</div>
      <button class="nav__burger" aria-label="Menu" aria-expanded="false">☰</button>${acc.side}</nav>
      ${P.auth.error && active !== 'Feedback' ? `<p class="note warn nav__err" role="alert">${esc(P.auth.error)}</p>` : ''}`;
    if (active !== 'Feedback') P.auth.error = null;              // the feedback page shows it in its own sign-in card
    P.$$('[data-signout]', chrome).forEach((b) => { b.onclick = () => P.auth.signOut(); });
    const b = P.$('.nav__burger', chrome), l = P.$('#links', chrome);
    b.onclick = () => { const o = l.classList.toggle('open'); b.setAttribute('aria-expanded', o); };
    l.onclick = () => l.classList.remove('open');
  }
  function route() {
    const [, area = '', id = ''] = (location.hash || '#/').slice(1).split('/');
    window.onscroll = null;
    if (area === 'guide' || area === 'exercise') {
      const list = area === 'guide' ? P.guides : P.exercises, item = list.find((x) => x.id === id);
      if (!id || !item) { location.replace(`#/${area}/${list[0].id}`); return; }
      header(area === 'guide' ? 'Guide' : 'Exercise');
      view.innerHTML = P.templates[area](item, list);
      document.title = `${item.title || 'Guide'} · Pi Lab`;
      if (area === 'exercise') P.mountExercise(item, view);
    } else if (area === 'calculator') {
      header('Calculator'); document.title = 'Calculator · Pi Lab';
      view.innerHTML = P.templates.calculator(P.calculator); P.mountCalculator(P.calculator, view);
    } else if (area === 'feedback') {
      header('Feedback'); document.title = 'Feedback · Pi Lab';
      view.innerHTML = P.templates.feedback(P.feedback); P.mountFeedback(P.feedback, view);
    } else {
      header('Home'); document.title = 'Pi Lab · Learn the Buckingham Pi theorem'; view.innerHTML = P.templates.home(P.home);
    }
    window.scrollTo(0, 0);
    const a = location.hash.match(/^#act-(\d+)$/); // in-page bench links are handled natively
  }
  // bench links use #act-N which would clash with the router; intercept them
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#act-"],a[href^="#step-"]'); if (!a) return;
    e.preventDefault(); const t = document.getElementById(a.getAttribute('href').slice(1)); if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  boot();
})();
