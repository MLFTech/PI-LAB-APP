/* Guide data: Example 2 (wing lift, adds Step 7 similarity). */
(function () {
  const S = PiLab.sub, fr = PiLab.frac;
  const defs = (a, b) => `<defs><marker id="${a}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M1 1 L9 5 L1 9" fill="none" stroke="#22252b" stroke-width="1.8"/></marker><marker id="${b}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M1 1 L9 5 L1 9" fill="none" stroke="#3b6fd4" stroke-width="1.8"/></marker></defs>`;
  const SER = 'font-family="Source Serif 4,DejaVu Serif,serif" font-style="italic"';
  const figure = `<svg viewBox="0 0 640 400" font-family="Shantell Sans,Comic Relief,sans-serif" stroke-linecap="round" stroke-linejoin="round" role="img" aria-label="Wing with lift force">${defs('a2', 'b2')}
  <g fill="none" stroke="#22252b" stroke-width="2.5" marker-end="url(#a2)"><path d="M30 120 H130"/><path d="M30 235 H130"/><path d="M30 330 H130"/></g>
  <text x="58" y="106" ${SER} font-size="24" fill="#22252b">V</text><g font-size="14" fill="#6b7280"><text x="30" y="142">flight speed</text><text x="30" y="257">air: density ρ, viscosity μ</text><text x="30" y="352">incompressible flow</text></g>
  <g transform="translate(200 190) rotate(-12)"><path d="M0 46 C15 0 130 -12 260 46 C160 64 70 72 0 46 Z" fill="#fffbd6" stroke="#22252b" stroke-width="2.8"/><path d="M0 46 H260" stroke="#22252b" stroke-width="1.8" stroke-dasharray="7 6" fill="none"/></g>
  <path d="M209.6 235 H360" stroke="#6b7280" stroke-width="1.8" stroke-dasharray="3 5" fill="none"/><path d="M279.6 235 Q282 227 278.1 220.4" stroke="#22252b" stroke-width="2.2" fill="none"/>
  <text x="296" y="232" ${SER} font-size="24" fill="#22252b">α</text><text x="326" y="256" font-size="14" fill="#6b7280">angle of attack</text>
  <path d="M330 205 L330 90" stroke="#3b6fd4" stroke-width="4" fill="none" marker-end="url(#b2)"/><text x="346" y="110" ${SER} font-weight="700" font-size="30" fill="#3b6fd4">F</text><text x="372" y="110" font-size="14" fill="#3b6fd4">lift force</text>
  <path d="M210 322 H464" stroke="#22252b" stroke-width="2.2" fill="none" marker-start="url(#a2)" marker-end="url(#a2)"/><path d="M210 310 V334 M464 310 V334" stroke="#22252b" stroke-width="2" fill="none"/>
  <text x="330" y="352" text-anchor="middle" ${SER} font-size="24" fill="#22252b">c</text><text x="330" y="306" text-anchor="middle" font-size="14" fill="#6b7280">chord length</text><text x="620" y="30" text-anchor="end" font-size="14" fill="#6b7280">airplane wing (prototype)</text>
  <rect x="470" y="352" width="150" height="36" rx="10" fill="#ffe66d" stroke="#22252b" stroke-width="2"/><text x="545" y="376" text-anchor="middle" font-size="15" font-weight="700" fill="#22252b">Step 1: list them</text></svg>`;
  const wing = (tx, ty, s, sw) => `<g transform="translate(${tx} ${ty}) rotate(-8) scale(${s})"><path d="M0 46 C15 0 130 -12 260 46 C160 64 70 72 0 46 Z" fill="#fffbd6" stroke="#22252b" stroke-width="${sw}"/></g>`;
  const simFig = `<svg viewBox="0 0 600 310" font-family="Shantell Sans,Comic Relief,sans-serif" stroke-linecap="round" stroke-linejoin="round" role="img" aria-label="Model and prototype wings">${defs('a7', 'b7')}
  <g fill="none" stroke="#22252b" stroke-width="2.5"><rect x="8" y="14" width="284" height="236" rx="14"/><rect x="308" y="14" width="284" height="236" rx="14"/></g>
  <g fill="none" stroke="#22252b" stroke-width="2.5" marker-end="url(#a7)"><path d="M22 150 H70"/><path d="M322 130 H350"/></g>
  <g ${SER} fill="#22252b" font-size="20"><text x="26" y="138">V<tspan font-size="13" dy="4">m</tspan></text><text x="324" y="118">V<tspan font-size="13" dy="4">p</tspan></text><text x="44" y="196">α</text><text x="344" y="196">α</text><text x="152" y="238">c<tspan font-size="13" dy="4">m</tspan></text><text x="462" y="244">c<tspan font-size="13" dy="4">p</tspan></text></g>
  ${wing(95, 138, 0.5, 5)}${wing(372, 100, 0.8, 3.2)}
  <g fill="none" stroke="#3b6fd4" stroke-width="3.5" marker-end="url(#b7)"><path d="M160 150 L170 92"/><path d="M470 128 L484 50"/></g>
  <g ${SER} font-weight="700" fill="#3b6fd4" font-size="22"><text x="178" y="100">F<tspan font-size="14" dy="4">m</tspan></text><text x="492" y="64">F<tspan font-size="14" dy="4">p</tspan></text></g>
  <g fill="none" stroke="#22252b" stroke-width="2" marker-start="url(#a7)" marker-end="url(#a7)"><path d="M98 214 H222"/><path d="M376 222 H566"/></g>
  <g font-size="15" font-weight="700" fill="#22252b" text-anchor="middle"><text x="150" y="42">Model in wind tunnel (m)</text><text x="450" y="42">Prototype in flight (p)</text></g>
  <rect x="150" y="262" width="300" height="36" rx="10" fill="#ffe66d" stroke="#22252b" stroke-width="2"/><text x="300" y="286" text-anchor="middle" font-size="15" font-weight="700" fill="#22252b">same shape · same α · same Re</text></svg>`;
  const fm = (a, b) => `${a}${S(b)}`;
  PiLab.registerGuide({
    id: 'wing-lift', tabLabel: 'Example 2 · Wing lift', crumb: 'Example 2',
    subtitle: 'Example 2: lift on a wing in incompressible flow.',
    problem: {
      text: 'An airplane wing (the prototype) flies through air with chord length <b>c</b> at speed <b>V</b> and angle of attack <b>α</b>. We want to know the <b>lift force F</b> it generates. Lift depends on the speed, the angle of attack, the chord length, and the density and viscosity of the air. The flow is incompressible, so the speed of sound can be ignored.',
      equation: 'F = f ( V, α, c, ρ, μ )', goal: '<b>Goal:</b> replace these six quantities with a few dimensionless groups.', figure,
    },
    steps: [
      { title: 'Identify the variables', blocks: [
        { type: 'p', html: 'List the quantity you want, the lift F, and every quantity it depends on. Count the angle of attack too: it has no dimensions, but it still takes part in the problem. Together they make <b>n = 6</b> variables.' },
        { type: 'table', head: ['Symbol', 'Quantity', 'Role'], rows: [
          ['F', 'Lift force', '<b>Dependent</b> · what we want to predict'], ['V', 'Flight speed', '<b>Independent</b> · flow condition'], ['c', 'Chord length', '<b>Independent</b> · geometry'],
          ['ρ', 'Air density', '<b>Independent</b> · fluid property'], ['μ', 'Air viscosity', '<b>Independent</b> · fluid property'], ['α', 'Angle of attack', '<b>Independent</b> · wing attitude (already dimensionless)']] }] },
      { title: 'Write each variable in fundamental dimensions', blocks: [
        { type: 'p', html: 'Use mass (M), length (L) and time (T). All three appear, so <b>k = 3</b>. The angle of attack has no dimensions at all.' },
        { type: 'cells', cols: 3, items: [{ html: '[F] = M L T⁻²' }, { html: '[V] = L T⁻¹' }, { html: '[c] = L' }, { html: '[ρ] = M L⁻³' }, { html: '[μ] = M L⁻¹ T⁻¹' }, { html: '[α] = 1', sub: 'dimensionless' }] }] },
      { title: 'Count the dimensionless groups', blocks: [
        { type: 'p', html: 'The theorem says the number of groups is the number of variables minus the number of dimensions.' },
        { type: 'equation', html: 'n − k = 6 − 3 = 3 groups&nbsp; (Π₁, Π₂, Π₃)', size: 'clamp(20px,3.2vw,38px)' },
        { type: 'note', html: 'preview: α is already dimensionless, so it will simply become one of the three groups' }] },
      { title: 'Choose the repeating variables', blocks: [
        { type: 'p', html: 'The <b>number of repeating variables must be the same as the number of fundamental dimensions</b>. Step 2 found k = 3 (M, L and T), so pick exactly three variables that together contain M, L and T. Each remaining variable that has dimensions is then paired with them to form one group.' },
        { type: 'equation', html: 'repeating variables = fundamental dimensions = k = 3', size: 'clamp(17px,2.4vw,28px)' },
        { type: 'p', html: 'Use these guidelines to choose well:' },
        { type: 'repeating',
          dependent: ['It is the quantity whose value <b>depends on the others</b>: the result you are trying to predict. In this problem it is the lift F. Change the speed, chord, angle or air and F responds.',
            'The other five are <b>independent variables</b>: you set them freely in the tunnel. F cannot be a repeating variable because it would show up in every group, and we could no longer isolate it in Π₁.'],
          kinds: { 'Geometric property': 'chord length c', 'Flow property': 'flight speed V', 'Fluid property': 'air density ρ' },
          check: { title: 'Check our choice: ρ, V, c', items: ['✓ Three repeating variables for k = 3 dimensions (rule 1)', '✓ One of each kind: c is geometric, V is a flow property, ρ is a fluid property (rule 2)', '✓ F is left out (rule 3)', '✓ ρ, V, c together cover M, L and T (rule 5)', '✓ α is skipped: already dimensionless (rule 6)', '✗ μ is not chosen: less basic, it would sit in every Π (rules 9–10)'] },
          pis: ['Π₁ = f ( ρ, V, c, F )', 'Π₂ = f ( ρ, V, c, μ )', 'Π₃ = α&nbsp; (already a group)'] },
        { type: 'note', html: 'tip: other choices work too, but some give more familiar numbers' }] },
      { title: 'Solve for the exponents', blocks: [
        { type: 'p', html: 'Give each repeating variable an unknown power, then require every dimension to cancel. Start with Π₁ (it holds the dependent variable), then Π₂.' },
        { type: 'exponents', groups: [
          { title: 'Π₁ = ρᵃ Vᵇ cᵈ F', dims: '(M L⁻³)ᵃ (L T⁻¹)ᵇ (L)ᵈ (M L T⁻²) = M⁰ L⁰ T⁰',
            lines: ['M: 0 = a + 1', 'L: 0 = −3a + b + d + 1', 'T: 0 = −b − 2'],
            solution: 'a = −1, &nbsp;b = −2, &nbsp;d = −2', result: 'Π₁ = ρ⁻¹ V⁻² c⁻² F = F / (ρ V² c²)' },
          { title: 'Π₂ = ρᵃ Vᵇ cᵈ μ', dims: '(M L⁻³)ᵃ (L T⁻¹)ᵇ (L)ᵈ (M L⁻¹ T⁻¹) = M⁰ L⁰ T⁰',
            lines: ['M: 0 = a + 1', 'L: 0 = −3a + b + d − 1', 'T: 0 = −b − 1'],
            solution: 'a = −1, &nbsp;b = −1, &nbsp;d = −1', result: 'Π₂ = ρ⁻¹ V⁻¹ c⁻¹ μ = μ / (ρ V c)' }],
          extra: { html: 'Π₃ = α', sub: 'angle of attack is already dimensionless, so there are no exponents to solve' } }] },
      { title: 'Read the results and tidy them up', blocks: [
        { type: 'p', html: 'Substitute the exponents from Step 5 to get the <b>actual result</b> of each group. Because a dimensionless group stays dimensionless when inverted or multiplied by a constant, we can then <b>change</b> it into the familiar named form.' },
        { type: 'results', rows: [
          { p: 'Π₁', rawSub: '= ρ⁻¹ V⁻² c⁻² F', raw: '= F / (ρ V² c²)', change: 'multiply by ½,<br>replace c² with area S', finalSub: 'same as F / (q S), q = ½ ρ V²', final: '= F / (½ ρ V² S)', name: 'Lift coefficient', sym: 'C<sub>L</sub>' },
          { p: 'Π₂', rawSub: '= ρ⁻¹ V⁻¹ c⁻¹ μ', raw: '= μ / (ρ V c)', change: 'take the<br>inverse', final: '= ρ V c / μ', name: 'Reynolds number', sym: 'Re' },
          { p: 'Π₃', rawSub: '= α', raw: '= α', change: 'no change<br>needed', final: '= α', name: 'Angle of attack', sym: 'α' }],
          final: 'C<sub>L</sub> = f ( Re, α )', note: 'lift now depends on just two dimensionless numbers instead of five variables' }] },
      { title: 'Apply similarity to a scaled model', blocks: [
        { type: 'p', html: 'The Π groups also tell us how to test a small model and predict a full-size prototype. This is called <b>dynamic similarity</b>.' },
        { type: 'similarity',
          principle: 'If the model is a perfect scale replica (geometric similarity) and every <b>independent</b> Π of the model equals that of the prototype, then the <b>dependent</b> Π of the prototype equals that of the model.',
          pills: ['independent: Re, α', 'dependent: lift coefficient C<sub>L</sub>'], tip: 'This holds even if the model is tested in a different fluid, such as water instead of air.', figure: simFig,
          steps: [
            { letter: 'a', title: 'Match the angle of attack', html: `α${S('m')} = α${S('p')}` },
            { letter: 'b', title: 'Match the Reynolds number', html: `Re${S('m')} = ${fr('ρ' + S('m') + 'V' + S('m') + 'c' + S('m'), 'μ' + S('m'))} = Re${S('p')} = ${fr('ρ' + S('p') + 'V' + S('p') + 'c' + S('p'), 'μ' + S('p'))}` },
            { letter: 'c', title: 'Solve for the tunnel speed', html: `V${S('m')} = ${fr('ρ' + S('p'), 'ρ' + S('m'))}${fr('c' + S('p'), 'c' + S('m'))}${fr('μ' + S('m'), 'μ' + S('p'))} V${S('p')}` },
            { letter: 'd', title: 'Measure the model lift, then scale it up', hl: true, html: `${fr('F' + S('p'), 'ρ' + S('p') + 'V' + S('p') + '²c' + S('p') + '²')} = ${fr('F' + S('m'), 'ρ' + S('m') + 'V' + S('m') + '²c' + S('m') + '²')}<br>F${S('p')} = ${fr('ρ' + S('p'), 'ρ' + S('m'))}(${fr('V' + S('p'), 'V' + S('m'))})²(${fr('c' + S('p'), 'c' + S('m'))})² F${S('m')}` }],
          numbers: { letter: 'e', title: 'Try it with numbers', cases: [
            { title: 'Same air in the tunnel', eq: `V${S('m')} = 4 × 60 = 240 m/s`, text: 'too fast: about Mach 0.7, so the flow is no longer incompressible' },
            { title: 'Water tunnel instead', eq: `V${S('m')} ≈ (1.2/998)(4)(56)(60) ≈ 16 m/s`, text: 'a comfortable speed that still matches Re' },
            { title: 'Scale up the lift', eq: `F${S('m')} = 16 kN → F${S('p')} ≈ 4.3 kN`, text: 'the predicted lift on the full-size wing', hl: true }],
            note: `assumed values: prototype c${S('p')} = 2 m, V${S('p')} = 60 m/s in air (ρ = 1.2 kg/m³, μ = 1.8×10⁻⁵ Pa·s); model c${S('m')} = 0.5 m in water (ρ = 998 kg/m³, μ = 1.0×10⁻³ Pa·s); lift referenced to c²` } }] },
    ],
    footer: [{ label: '← Example 1', href: '#/guide/airfoil-force' }, { label: 'Try the exercises →', href: '#/exercise', primary: true }],
    source: 'Example adapted from Prof. Cimbala’s “Dimensional Analysis and Similarity” notes (Penn State ME) · Variable-selection guidelines adapted from lecture slide 7-16',
  });
})();
