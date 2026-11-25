/* Feedback page: why the feedback matters and a link to the Google Form. Wording: data/feedback.js. */
(function () {
  const P = PiLab;
  P.templates.feedback = (d) => `<div class="page fb">
    <div class="crumb"><a href="#/">Home</a> / Feedback</div>
    <h1>${d.title}</h1><p class="lead fb__lead">${d.lead}</p>
    <div class="fb__grid">
      <section class="sk fb__why" aria-labelledby="fb-why"><h2 id="fb-why">${d.why.title}</h2>${d.why.paragraphs.map((p) => `<p>${p}</p>`).join('')}</section>
      <section class="sk fb__go" aria-labelledby="fb-exp"><h2 id="fb-exp">${d.expect.title}</h2>
        <ul class="fb__list">${d.expect.items.map(([ic, t]) => `<li><span class="fb__ic" aria-hidden="true">${ic}</span><span>${t}</span></li>`).join('')}</ul>
        <a class="btn btn--p fb__btn" href="${d.formUrl}" target="_blank" rel="noopener noreferrer">${d.button} <span aria-hidden="true">↗</span></a>
        <p class="note">${d.host}</p>
        <p class="fb__thanks">${d.thanks}</p></section>
    </div></div>`;
})();
