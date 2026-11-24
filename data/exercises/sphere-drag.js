/* Exercise data: drag on a sphere. Activities are configured here; behaviour lives in js/activities/*. */
(function () {
  const SER = 'font-family="Source Serif 4,DejaVu Serif,serif" font-style="italic"';
  const figure = `<svg viewBox="0 0 640 300" font-family="Shantell Sans,Comic Relief,sans-serif" stroke-linecap="round" stroke-linejoin="round" role="img" aria-label="Sphere in a wind tunnel">
  <defs><marker id="ax" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M1 1 L9 5 L1 9" fill="none" stroke="#22252b" stroke-width="1.8"/></marker><marker id="bx" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M1 1 L9 5 L1 9" fill="none" stroke="#3b6fd4" stroke-width="1.8"/></marker></defs>
  <path d="M20 20 H620 M20 280 H620" stroke="#22252b" stroke-width="2.5" fill="none"/><path d="M30 20 l-10 -12 M70 20 l-10 -12 M110 20 l-10 -12 M150 20 l-10 -12 M190 20 l-10 -12 M230 20 l-10 -12 M270 20 l-10 -12 M310 20 l-10 -12 M350 20 l-10 -12 M390 20 l-10 -12 M430 20 l-10 -12 M470 20 l-10 -12 M510 20 l-10 -12 M550 20 l-10 -12 M590 20 l-10 -12" stroke="#9aa1ad" stroke-width="1.5"/>
  <path d="M20 280 l10 12 M60 280 l10 12 M100 280 l10 12 M140 280 l10 12 M180 280 l10 12 M220 280 l10 12 M260 280 l10 12 M300 280 l10 12 M340 280 l10 12 M380 280 l10 12 M420 280 l10 12 M460 280 l10 12 M500 280 l10 12 M540 280 l10 12 M580 280 l10 12" stroke="#9aa1ad" stroke-width="1.5"/>
  <text x="620" y="42" text-anchor="end" font-size="13" fill="#3b6fd4">wind tunnel test section</text>
  <text x="34" y="52" font-size="13" fill="#6b7280">air: density ρ,</text><text x="34" y="68" font-size="13" fill="#6b7280">viscosity μ</text>
  <path d="M30 150 H130" stroke="#22252b" stroke-width="2.5" fill="none" marker-end="url(#ax)"/><text x="56" y="134" ${SER} font-size="30" fill="#22252b">V</text><text x="30" y="176" font-size="13" fill="#6b7280">fluid velocity</text>
  <path d="M130 90 C 210 80 260 70 330 70 S 480 80 600 90 M130 210 C 210 220 260 230 330 230 S 480 220 600 210" stroke="#9aa1ad" stroke-width="1.8" fill="none"/>
  <circle cx="330" cy="150" r="62" fill="#fffbd6" stroke="#22252b" stroke-width="3"/><path d="M290 190 l40 -60 M310 200 l50 -70 M335 205 l40 -60" stroke="#c9c2a0" stroke-width="1.6"/>
  <path d="M398 150 H520" stroke="#3b6fd4" stroke-width="4" fill="none" marker-end="url(#bx)"/><text x="530" y="144" ${SER} font-size="28" font-weight="700" fill="#3b6fd4">F<tspan font-size="18" dy="5">D</tspan></text><text x="440" y="176" font-size="13" fill="#3b6fd4">drag force</text>
  <path d="M268 262 H392" stroke="#22252b" stroke-width="2" fill="none" marker-start="url(#ax)" marker-end="url(#ax)"/><text x="330" y="250" text-anchor="middle" ${SER} font-size="22" fill="#22252b">D</text><text x="330" y="276" text-anchor="middle" font-size="12" fill="#6b7280">sphere diameter</text>
  <rect x="430" y="236" width="190" height="32" rx="10" fill="#ffe66d" stroke="#22252b" stroke-width="2"/><text x="525" y="257" text-anchor="middle" font-size="14" font-weight="700" fill="#22252b">Activity 1: collect them</text></svg>`;
  const S = PiLab.sub;
  PiLab.registerExercise({
    id: 'sphere-drag', tabLabel: 'Exercise 1 · Sphere drag', crumb: 'Drag on a sphere',
    title: 'Sphere in the wind', highlight: 'learn Pi by doing', minutes: 35,
    subtitle: 'Six hands-on activities. Drag, solve and build your way from raw variables to a wind-tunnel prediction, no quiz boxes.',
    problem: {
      text: 'An engineer places a sphere in an airflow and wants the aerodynamic drag force acting on it. Experience says the drag depends on four things: the fluid density, the fluid velocity, the sphere diameter and the dynamic viscosity.',
      equation: `F${S('D')} = f ( ρ, V, D, μ )`,
      partB: `<b>Part B · similarity</b><br>A 1:5 scale model is tested in a wind tunnel. Full size: D = 0.50 m at 10 m/s, same fluid.`,
      goal: '<b>Goal:</b> replace the variables with a few dimensionless groups, then predict a full-size sphere from a small model.', figure,
    },
    /* dim = exponents of [M, L, T]; role: dep | ind | out; common:false marks a "less basic" variable */
    variables: [
      { id: 'F', sym: 'F<sub>D</sub>', short: 'F', name: 'Drag force', dim: [1, 1, -2], role: 'dep', hint: 'the drag force is the quantity you want to predict, so it is the dependent variable.' },
      { id: 'rho', sym: 'ρ', short: 'ρ', name: 'Fluid density', dim: [1, -3, 0], role: 'ind', common: true },
      { id: 'V', sym: 'V', short: 'V', name: 'Fluid velocity', dim: [0, 1, -1], role: 'ind', common: true },
      { id: 'D', sym: 'D', short: 'D', name: 'Sphere diameter', dim: [0, 1, 0], role: 'ind', common: true },
      { id: 'mu', sym: 'μ', short: 'μ', name: 'Dynamic viscosity', dim: [1, -1, -1], role: 'ind', common: false },
      { id: 'g', sym: 'g', short: 'g', name: 'Gravity', dim: [0, 1, -2], role: 'out', hint: 'gravity is not part of the drag problem in this flow, so it is not involved.' },
    ],
    crew: ['rho', 'V', 'D'],
    activities: [
      { type: 'sort', pill: 'Select', pillSub: 'Select & sort · 6 min', title: 'Pick the variables, then sort them', subtitle: 'Task 1 · Identify the variables and their fundamental dimensions', tag: 'Select & sort', checkLabel: 'Check my sort',
        intro: 'Six candidates are on the bench, but only five really act in this problem. Drag each relevant variable into the Dependent box (what we want to predict) or the Independent box (what we can set). Each card shows its dimensions in M, L, T. One variable is a decoy.' },
      { type: 'balance', pill: 'Count', pillSub: 'Balance scale · 4 min', title: 'Balance the scale', subtitle: 'Task 2 · Count the dimensionless groups with the Buckingham Pi theorem', tag: 'Lock & balance', checkLabel: 'Check balance',
        intro: 'Lock each fundamental dimension row in the matrix. Every locked dimension drops a block onto the right pan. Then add Π blocks until the scale levels: variables on the left, dimensions plus groups on the right.' },
      { type: 'crew', pill: 'Choose', pillSub: 'Crew picker · 5 min', title: 'Pick your crew', subtitle: 'Task 3 · Select suitable repeating variables', tag: 'Crew picker', checkLabel: 'Lock crew',
        intro: 'Choose three repeating variables, one for each fundamental dimension (k = 3). Tap candidates to move them into the crew. The rule checklist and the M·L·T lamps update live, so you can try combinations and see why one fails.' },
      { type: 'exponents', pill: 'Solve', pillSub: 'Power equations · 8 min', title: 'Form the dimensionless groups', subtitle: 'Task 4 · Write the power equation for each dimension and solve for the exponents', tag: 'Power equations', checkLabel: 'Check groups',
        intro: 'Each group is one leftover variable times the repeating variables raised to unknown powers a, b and c. Expand every variable into its dimensions, then the power of each dimension must add up to zero. Solve the equations and enter the powers: each equation turns green when it balances.',
        groups: [{ title: 'Π₁', target: 'F' }, { title: 'Π₂', target: 'mu' }] },
      { type: 'equation', pill: 'Relate', pillSub: 'Equation builder · 4 min', title: 'Build the equation, then ride the curve', subtitle: 'Task 5 · Establish the final functional relationship', tag: 'Build & explore', checkLabel: 'Check equation',
        intro: 'Drag the groups into the equation: the group that holds the force goes on the left, everything else goes inside f( ). Then slide Reynolds number along the curve and watch how the force group responds.',
        tip: 'tip: a group can be inverted and still be a group',
        success: 'Equation built: the drag group depends only on the Reynolds number. ✓',
        curveNote: 'Illustrative sphere-drag correlation (log–log), not a measurement.',
        tiles: [
          { id: 'p1', kind: 'lhs', html: `F${S('D')} / (ρV²D²)` }, { id: 'p2', kind: 'inv', html: 'μ / (ρVD)' }, { id: 're', kind: 'ok', html: 'Re = ρVD / μ' }] },
      { type: 'tunnel', pill: 'Predict', pillSub: 'Tunnel simulator · 8 min', title: 'Run the wind tunnel', subtitle: 'Similarity · 1:5 model, same fluid, Reynolds similarity', tag: 'Tunnel simulator', checkLabel: 'Check match',
        intro: 'Slide the tunnel speed for the 1:5 model until its Reynolds number matches the full-size sphere. Only then does the force-ratio panel unlock, and you can drag the scaling terms together to predict the model-to-prototype drag.',
        Vp: 10, Dp: 0.5, Dm: 0.1, start: 30, Vmax: 80, tol: 0.02, scaleLabel: '1 : 5',
        tiles: [{ id: 'v', ok: true, html: `V${S('m')} / V${S('p')}` }, { id: 'd', ok: true, html: `D${S('m')} / D${S('p')}` }, { id: 'r', ok: false, html: `ρ${S('m')} / ρ${S('p')}` }] },
    ],
    finalResult: {
      groups: [`Π₁ = ${PiLab.frac(`F${S('D')}`, 'ρ V² D²')}`, `Π₂ = ${PiLab.frac('ρ V D', 'μ')} = Re`],
      fn: `${PiLab.frac(`F${S('D')}`, 'ρ V² D²')} = f ( Re )`,
    },
    footer: [{ label: '← Guide', href: '#/guide' }, { label: 'Open the calculator →', href: '#/calculator', primary: true }],
    source: 'Pi Lab · exercises adapted from the sphere drag and 1:5 model similarity problem',
  });
})();
