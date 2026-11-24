/* Exercise data: heat transfer from a car radiator. Activities are configured here; behaviour lives in js/activities/*. */
(function () {
  const SER = 'font-family="Source Serif 4,DejaVu Serif,serif" font-style="italic"';
  const fins = Array.from({ length: 13 }, (_, i) => `<path d="M${262 + i * 10} 62 V238" stroke="#c9a227" stroke-width="2"/>`).join('');
  const air = [95, 150, 205].map((y) => `<path d="M40 ${y} H200" stroke="#3b6fd4" stroke-width="2.5" fill="none" marker-end="url(#rb)"/>`).join('');
  const out = [95, 150, 205].map((y) => `<path d="M420 ${y} C 450 ${y - 12}, 480 ${y + 12}, 520 ${y}" stroke="#d4493b" stroke-width="2.2" fill="none" marker-end="url(#rr)"/>`).join('');
  const figure = `<svg viewBox="0 0 640 300" font-family="Shantell Sans,Comic Relief,sans-serif" stroke-linecap="round" stroke-linejoin="round" role="img" aria-label="Air flowing through a car radiator">
  <defs><marker id="rk" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M1 1 L9 5 L1 9" fill="none" stroke="#22252b" stroke-width="1.8"/></marker>
  <marker id="rb" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M1 1 L9 5 L1 9" fill="none" stroke="#3b6fd4" stroke-width="1.8"/></marker>
  <marker id="rr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M1 1 L9 5 L1 9" fill="none" stroke="#d4493b" stroke-width="1.8"/></marker></defs>
  <text x="34" y="40" font-size="13" fill="#6b7280">cool air: ρ, μ, k, c<tspan font-size="10" dy="3">p</tspan></text>
  ${air}<text x="100" y="135" ${SER} font-size="30" fill="#3b6fd4">V</text><text x="70" y="235" font-size="13" fill="#3b6fd4">air velocity</text>
  <rect x="250" y="50" width="150" height="200" rx="10" fill="#fffbd6" stroke="#22252b" stroke-width="3"/>${fins}
  <rect x="236" y="40" width="178" height="22" rx="6" fill="#fff" stroke="#22252b" stroke-width="2.5"/><rect x="236" y="238" width="178" height="22" rx="6" fill="#fff" stroke="#22252b" stroke-width="2.5"/>
  <text x="325" y="30" text-anchor="middle" font-size="13" fill="#22252b">hot radiator, surface T<tspan font-size="10" dy="3">s</tspan></text>
  ${out}<text x="530" y="140" ${SER} font-size="30" font-weight="700" fill="#d4493b">Q</text><text x="500" y="176" font-size="13" fill="#d4493b">heat transfer rate</text>
  <path d="M250 276 H400" stroke="#22252b" stroke-width="2" fill="none" marker-start="url(#rk)" marker-end="url(#rk)"/><text x="325" y="294" text-anchor="middle" ${SER} font-size="20" fill="#22252b">D</text>
  <text x="420" y="268" font-size="13" fill="#22252b"><tspan ${SER} font-size="18">ΔT</tspan> = T<tspan font-size="10" dy="3">s</tspan><tspan dy="-3"> − T</tspan><tspan font-size="10" dy="3">air</tspan></text></svg>`;
  const S = PiLab.sub, F = PiLab.frac;
  const cp = `c${S('p')}`;
  PiLab.registerExercise({
    id: 'radiator-heat', tabLabel: 'Exercise 2 · Car radiator', crumb: 'Radiator heat transfer',
    title: 'Cooling a car radiator', highlight: 'Pi with temperature', minutes: 35,
    subtitle: 'Five hands-on activities. This time heat joins the problem, so temperature Θ becomes a fourth fundamental dimension.',
    dims: ['M', 'L', 'T', 'Θ'],
    problem: {
      text: 'An automotive engineer is studying the cooling performance of a car radiator. The heat transfer rate <b>Q</b> from the radiator depends on the following variables: air velocity over the radiator, <b>V</b>; air density, <b>ρ</b>; air viscosity, <b>μ</b>; thermal conductivity of air, <b>k</b>; specific heat of air, <b>c<sub>p</sub></b>; characteristic length of the radiator, <b>D</b>; and the temperature difference between the radiator surface and the air, <b>ΔT</b>.',
      equation: `Q = f ( V, ρ, μ, k, ${cp}, D, ΔT )`,
      goal: '<b>Goal:</b> replace the eight variables with a few dimensionless groups that describe how well the radiator cools.', figure,
    },
    /* dim = exponents of [M, L, T, Θ]; role: dep | ind | out; common:false marks a "less basic" variable */
    variables: [
      { id: 'Q', sym: 'Q', short: 'Q', name: 'Heat transfer rate', dim: [1, 2, -3, 0], role: 'dep', hint: 'the heat transfer rate is what the engineer wants to predict, so it is the dependent variable.' },
      { id: 'V', sym: 'V', short: 'V', name: 'Air velocity', dim: [0, 1, -1, 0], role: 'ind', common: true },
      { id: 'rho', sym: 'ρ', short: 'ρ', name: 'Air density', dim: [1, -3, 0, 0], role: 'ind', common: true },
      { id: 'mu', sym: 'μ', short: 'μ', name: 'Air viscosity', dim: [1, -1, -1, 0], role: 'ind', common: false },
      { id: 'k', sym: 'k', short: 'k', name: 'Thermal conductivity', dim: [1, 1, -3, -1], role: 'ind', common: true },
      { id: 'cp', sym: cp, short: 'cp', name: 'Specific heat', dim: [0, 2, -2, -1], role: 'ind', common: false, crewNote: 'cp is less basic than k here: keep it out so it appears in a single Π' },
      { id: 'D', sym: 'D', short: 'D', name: 'Characteristic length', dim: [0, 1, 0, 0], role: 'ind', common: true },
      { id: 'dT', sym: 'ΔT', short: 'ΔT', name: 'Temperature difference', dim: [0, 0, 0, 1], role: 'ind', common: false, crewNote: 'ΔT is a driving condition, not a property: keep it out so it appears in a single Π' },
      { id: 'm', sym: 'm', short: 'm', name: 'Radiator mass', dim: [1, 0, 0, 0], role: 'out', hint: 'the mass of the radiator does not change the steady heat transfer to the air, so it is not involved.' },
    ],
    crew: ['rho', 'V', 'D', 'k'],
    activities: [
      { type: 'sort', pill: 'Select', pillSub: 'Select & sort · 6 min', title: 'Pick the variables, then sort them', subtitle: 'Task 1 · Identify the variables and their fundamental dimensions', tag: 'Select & sort', checkLabel: 'Check my sort',
        intro: 'Nine candidates are on the bench, but only eight really act in this problem. Drag each relevant variable into the Dependent box (what we want to predict) or the Independent box (what we can set). Each card shows its dimensions in M, L, T and Θ. One variable is a decoy.' },
      { type: 'balance', pill: 'Count', pillSub: 'Balance scale · 4 min', title: 'Balance the scale', subtitle: 'Task 2 · Count the dimensionless groups with the Buckingham Pi theorem', tag: 'Lock & balance', checkLabel: 'Check balance',
        intro: 'Lock each fundamental dimension row in the matrix (this problem has four: M, L, T and Θ). Every locked dimension drops a block onto the right pan. Then add Π blocks until the scale levels.' },
      { type: 'crew', pill: 'Choose', pillSub: 'Crew picker · 5 min', title: 'Pick your crew', subtitle: 'Task 3 · Select suitable repeating variables', tag: 'Crew picker', checkLabel: 'Lock crew',
        intro: 'Choose four repeating variables, one for each fundamental dimension (k = 4). Tap candidates to move them into the crew. The rule checklist and the M·L·T·Θ lamps update live.',
        simpleText: 'a density, a speed, a length and a conductivity',
        hint: 'Hint: start with the plain trio from the sphere problem (a density, a speed and a length). Then you still need something that carries temperature Θ: which air property is the most basic one?' },
      { type: 'exponents', pill: 'Solve', pillSub: 'Power equations · 10 min', title: 'Form the dimensionless groups', subtitle: 'Task 4 · Write the power equation for each dimension and solve for the exponents', tag: 'Power equations', checkLabel: 'Check groups',
        intro: 'Each group is one leftover variable times the repeating variables raised to unknown powers a, b, c and d. Expand every variable into its dimensions, then the power of each dimension must add up to zero. Solve the equations and enter the powers: each equation turns green when it balances.',
        groups: [{ title: 'Π₁', target: 'Q' }, { title: 'Π₂', target: 'mu' }, { title: 'Π₃', target: 'cp' }, { title: 'Π₄', target: 'dT' }] },
      { type: 'equation', pill: 'Relate', pillSub: 'Equation builder · 4 min', title: 'Build the final equation', subtitle: 'Task 5 · Establish the final functional relationship', tag: 'Equation builder', checkLabel: 'Check equation',
        intro: 'Drag the groups into the equation: the group that holds the heat transfer rate goes on the left, the other three go inside f( ). Two tiles are decoys that still carry units.',
        rhsSlots: 3, curve: false,
        tip: 'tip: the order inside f( ) does not matter',
        hint: 'Hint: the left side is the group with Q in it. The three groups on the right are the ones you built for μ, cp and ΔT in Activity 4.',
        lhsMsg: 'The left side should be the group that contains Q, the heat transfer rate we want to predict.',
        rhsMsg: 'The right side should hold the three groups without Q.',
        success: 'Equation built: the heat-rate group depends on three other dimensionless groups. ✓',
        side: `<h4>Your groups from Activity 4</h4><ul class="pw-list">
          <li><b>Π₁</b> · holds Q, the heat transfer rate</li><li><b>Π₂</b> · holds μ: the inverse of the Reynolds number</li>
          <li><b>Π₃</b> · holds c<sub>p</sub>: equals Re × Pr, the Péclet number</li><li><b>Π₄</b> · holds ΔT, the temperature difference</li></ul>
          <p class="note" style="margin-top:10px">A combination like Q / (ρVD) still has units, so it cannot be a Π group.</p>`,
        tiles: [
          { id: 'p1', kind: 'lhs', html: F('Q', 'ρ V³ D²') },
          { id: 'p2', kind: 'ok', html: F('μ', 'ρ V D') },
          { id: 'p3', kind: 'ok', html: F(`ρ V D ${cp}`, 'k') },
          { id: 'p4', kind: 'ok', html: F('k ΔT', 'ρ V³ D') },
          { id: 'x1', kind: 'bad', html: F('Q', 'ρ V D'), msg: 'Q / (ρVD) is not dimensionless: it still has units of L³ T⁻². Look for the group with ρ V³ D² underneath.' },
          { id: 'x2', kind: 'bad', html: F('k ΔT', 'Q'), msg: 'k ΔT / Q still has units of 1/length, so it is not a Π group.' },
        ] },
    ],
    finalResult: {
      groups: [
        `Π₁ = ${F('Q', 'ρ V³ D²')}`, `Π₂ = ${F('μ', 'ρ V D')}`, `Π₃ = ${F(`ρ V D ${cp}`, 'k')}`, `Π₄ = ${F('k ΔT', 'ρ V³ D')}`,
      ],
      fn: `${F('Q', 'ρ V³ D²')} = f ( ${F('μ', 'ρ V D')}, ${F(`ρ V D ${cp}`, 'k')}, ${F('k ΔT', 'ρ V³ D')} )`,
    },
    footer: [{ label: '← Guide', href: '#/guide' }, { label: 'Open the calculator →', href: '#/calculator', primary: true }],
    source: 'Pi Lab · exercise adapted from a car radiator heat transfer problem',
  });
})();
