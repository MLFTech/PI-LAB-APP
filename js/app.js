/* Shell: header, hash router, data loading. */
(function () {
  const P = PiLab, view = P.$('#view'), chrome = P.$('#chrome');
  const NAV = [['Home', '#/'], ['Guide', '#/guide'], ['Exercise', '#/exercise'], ['Calculator', '#/calculator'], ['Feedback', '#/feedback']];
  const load = (src) => new Promise((ok, no) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = () => no(new Error('Could not load ' + src)); document.body.appendChild(s); });
  async function boot() {
    const m = window.PiLabManifest;
    try { for (const f of [...m.shared, ...m.guides, ...m.exercises]) await load(f); } catch (e) { view.innerHTML = `<div class="page"><div class="sk soon"><h2>Something went missing</h2><p>${e.message}</p></div></div>`; return; }
    window.addEventListener('hashchange', route); route();
  }
  function header(active) {
    chrome.innerHTML = `<nav class="sk nav" aria-label="Main"><a class="logo" href="#/"><img src="img/logo.svg" alt="" width="44" height="44">Pi Lab</a>
      <div class="nav__links" id="links">${NAV.map(([l, h]) => `<a href="${h}" class="${l === active ? 'on' : ''}">${l}</a>`).join('')}</div>
      <button class="nav__burger" aria-label="Menu" aria-expanded="false">☰</button></nav>`;
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
      view.innerHTML = P.templates.feedback(P.feedback);
    } else {
      header('Home'); document.title = 'Pi Lab · Learn the Buckingham Pi theorem'; view.innerHTML = P.templates.home(P.home);
    }
    window.scrollTo(0, 0);
  }
  // bench links use #act-N which would clash with the router; intercept them
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#act-"],a[href^="#step-"]'); if (!a) return;
    e.preventDefault(); const t = document.getElementById(a.getAttribute('href').slice(1)); if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  boot();
})();
