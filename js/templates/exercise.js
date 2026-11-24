/* Exercise template: frame (header, problem, lab bench, activity cards). Activity logic lives in js/activities/*.
   Activities are shown one at a time. Finishing the current one hides it and opens the next;
   finished activities can be reopened from the lab bench list. */
(function () {
  const P = PiLab;
  P.templates.exercise = function (ex, all) {
    const tabs = all.length > 1 ? `<div class="tabs">${all.map((x) => `<a class="${x.id === ex.id ? 'on' : ''}" href="#/exercise/${x.id}">${x.tabLabel}</a>`).join('')}</div>` : '';
    const n = ex.activities.length, at = all.indexOf(ex), next = all.length > 1 ? all[(at + 1) % all.length] : null;
    const bench = ex.activities.map((a, i) => `<button type="button" class="bench__item" data-bench="${i}"><i>${i + 1}</i><div><b>${a.pill}</b><small>${a.pillSub}</small></div><span class="bench__state" aria-hidden="true"></span></button>`).join('');
    const acts = ex.activities.map((a, i) => `<article class="sk act" id="act-${i + 1}" data-act="${i}" hidden>
      <div class="act__head"><div class="act__num">${i + 1}</div><div class="act__titles"><h2>${a.title}</h2><small>Activity ${i + 1} of ${n} · ${a.subtitle}</small></div><span class="act__tag">${a.tag}</span></div>
      <p class="act__intro">${a.intro}</p><div class="tip-touch">Tip: tap a tile, then tap where it should go.</div><div class="act__body"></div>
      <div class="act__foot"><div class="act__status"><div class="msg"></div><div class="meter"><div><i style="width:0"></i></div><span class="meter__t"></span></div></div>
        <div class="act__btns"><button class="btn btn--sm" data-do="hint">Hint</button><button class="btn btn--sm" data-do="reset">Reset</button><button class="btn btn--sm btn--p" data-do="check">${a.checkLabel}</button>${i < n - 1 ? '<button class="btn btn--sm btn--p act__next" data-do="next">Next activity →</button>' : ''}</div></div></article>`).join('');
    return `<div class="page">
      <div class="xhead"><div class="crumb"><a href="#/guide">Guide</a> &nbsp;/&nbsp; <a href="#/exercise">Exercise</a> &nbsp;/&nbsp; ${ex.crumb}</div>
        <h1>${ex.title}: <span class="hl">${ex.highlight}</span></h1><p style="margin-top:10px">${ex.subtitle}</p>${tabs}</div>
      <section class="xprob"><div class="sk pbox" style="padding:clamp(16px,2vw,26px);display:flex;flex-direction:column;gap:14px"><span class="tag">Problem statement</span><p>${ex.problem.text}</p>
        <div class="eq sk sk--sm" style="font-size:clamp(20px,2.4vw,28px)">${ex.problem.equation}</div>${ex.problem.partB ? `<div class="partb">${ex.problem.partB}</div>` : ''}<p style="font-size:clamp(14px,1.2vw,16px)">${ex.problem.goal}</p></div>
        <div class="sk fig">${ex.problem.figure}<div class="cap">← sketch: every labelled quantity goes into Activity 1</div></div></section>
      <section class="sk bench"><div style="padding:16px 18px"><h3>Your lab bench <span>· about ${ex.minutes} minutes · <b class="bench__count">0 of ${n} done</b></span></h3>
        <p class="bench__help">Finish an activity to unlock the next one. Tap a completed activity to open it again.</p><div class="bench__list">${bench}</div></div></section>
      <section class="acts">${acts}<div class="sk acts__done" hidden><h2>Exercise complete ✓</h2><p>Nice work: all ${n} activities are done. Reopen any of them from the lab bench above to review it.</p>
        ${ex.finalResult ? `<div class="final"><span class="lbl">Final result</span>${ex.finalResult.groups.map((g) => `<div class="eq math">${g}</div>`).join('')}<span class="lbl">Function</span><div class="eq math">${ex.finalResult.fn}</div></div>` : ''}
        <div class="row-done"><button class="btn" type="button" data-restart>Start again</button>${next ? `<a class="btn btn--p" href="#/exercise/${next.id}">Next exercise →</a>` : ''}</div></div></section>
      <div class="foot">${ex.footer.map((f) => `<a class="btn ${f.primary ? 'btn--p' : ''}" href="${f.href}">${f.label}</a>`).join('')}</div>
      <div class="src">${ex.source}</div></div>`;
  };

  /** called after the template HTML is in the DOM */
  P.mountExercise = function (ex, view) {
    const key = 'pilab:done:' + ex.id, n = ex.activities.length;
    const done = new Set(P.store.get(key, []).filter((i) => i >= 0 && i < n));
    const cards = P.$$('.act', view), items = P.$$('[data-bench]', view), allDone = P.$('.acts__done', view);
    const firstOpen = () => { for (let i = 0; i < n; i++) if (!done.has(i)) return i; return -1; };
    const unlocked = (i) => done.has(i) || i === firstOpen();
    let cur = -1, advanceTimer = null;

    const refreshBench = () => {
      items.forEach((b) => {
        const i = +b.dataset.bench, ok = unlocked(i);
        b.classList.toggle('done', done.has(i)); b.classList.toggle('cur', i === cur); b.classList.toggle('locked', !ok);
        b.disabled = !ok; b.setAttribute('aria-current', i === cur ? 'step' : 'false');
        b.title = done.has(i) ? 'Completed: open to review' : ok ? 'Current activity' : 'Locked: finish the previous activity first';
      });
      P.$('.bench__count', view).textContent = `${done.size} of ${n} done`;
    };
    /** show one activity (or the "all done" panel when i === -1) */
    const show = (i, scroll) => {
      clearTimeout(advanceTimer);
      cur = i;
      cards.forEach((c, j) => { c.hidden = j !== i; c.classList.toggle('enter', j === i); });
      allDone.hidden = i !== -1;
      refreshBench();
      const target = i === -1 ? allDone : cards[i];
      if (scroll && target.getBoundingClientRect().top < 0) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    const next = () => {
      const after = [...Array(n).keys()].find((j) => j > cur && unlocked(j));
      show(after === undefined ? firstOpen() : after, true);
    };

    const insts = [];
    ex.activities.forEach((cfg, i) => {
      const card = cards[i], body = P.$('.act__body', card);
      const msgEl = P.$('.msg', card), bar = P.$('.meter i', card), bt = P.$('.meter__t', card);
      if (done.has(i)) card.classList.add('complete');
      const ui = {
        msg(t, k) { msgEl.textContent = t || ''; msgEl.className = 'msg' + (k ? ' ' + k : ''); },
        progress(d, t, label) { bar.style.width = (t ? (100 * d) / t : 0) + '%'; bt.textContent = label || `${d} / ${t}`; },
        done() {
          const wasNew = !done.has(i);
          card.classList.add('complete'); done.add(i); P.store.set(key, [...done]); refreshBench();
          // first time through: leave the success message up for a moment, then move on
          if (wasNew && cur === i) { clearTimeout(advanceTimer); advanceTimer = setTimeout(next, 1600); }
        },
        undone() { card.classList.remove('complete'); done.delete(i); P.store.set(key, [...done]); refreshBench(); },
      };
      const make = P.activities[cfg.type];
      if (!make) { body.innerHTML = `<div class="banner">Unknown activity type “${cfg.type}”.</div>`; return; }
      const inst = make({ cfg, ex, ui });
      inst.mount(body); insts[i] = { inst, ui };
      card.addEventListener('click', (e) => {
        const b = e.target.closest('[data-do]'); if (!b) return;
        if (b.dataset.do === 'next') next();
        else if (b.dataset.do === 'reset') { clearTimeout(advanceTimer); ui.undone(); ui.msg(''); inst.reset(); }
        else if (inst[b.dataset.do]) inst[b.dataset.do]();
      });
    });

    P.$('[data-restart]', view).addEventListener('click', () => {
      insts.forEach((x, i) => { if (!x) return; x.ui.undone(); x.ui.msg(''); x.inst.reset(); });
      show(0, true);
    });
    P.$('.bench__list', view).addEventListener('click', (e) => {
      const b = e.target.closest('[data-bench]'); if (!b || b.disabled) return;
      show(+b.dataset.bench, true);
    });
    show(firstOpen(), false);
  };
})();
