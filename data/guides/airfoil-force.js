/* Guide data: Example 1 (airfoil force). Rendered by js/templates/guide.js. */
(function () {
  const arrowDefs = (a, b) => `<defs><marker id="${a}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M1 1 L9 5 L1 9" fill="none" stroke="#22252b" stroke-width="1.8"/></marker><marker id="${b}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M1 1 L9 5 L1 9" fill="none" stroke="#3b6fd4" stroke-width="1.8"/></marker></defs>`;
  const figure = `<svg viewBox="0 0 640 400" font-family="Shantell Sans,Comic Relief,sans-serif" stroke-linecap="round" stroke-linejoin="round" role="img" aria-label="Airfoil in a wind tunnel">${arrowDefs('a1', 'b1')}
  <path d="M20 36 H620 M20 352 H620" fill="none" stroke="#22252b" stroke-width="2.5"/><path d="M30 36 l-10 -12 M70 36 l-10 -12 M110 36 l-10 -12 M150 36 l-10 -12 M190 36 l-10 -12 M230 36 l-10 -12 M270 36 l-10 -12 M310 36 l-10 -12 M350 36 l-10 -12 M390 36 l-10 -12 M430 36 l-10 -12 M470 36 l-10 -12 M510 36 l-10 -12 M550 36 l-10 -12 M590 36 l-10 -12" stroke="#9aa1ad" stroke-width="1.5"/>
  <text x="620" y="62" text-anchor="end" font-size="13" fill="#6b7280">wind tunnel test section</text>
  <g fill="none" stroke="#22252b" stroke-width="2.5" marker-end="url(#a1)"><path d="M30 110 H140"/><path d="M30 190 H140"/><path d="M30 270 H140"/></g>
  <text x="52" y="98" font-family="Source Serif 4,DejaVu Serif,serif" font-style="italic" font-size="24" fill="#22252b">v∞</text>
  <g font-size="14" fill="#6b7280"><text x="30" y="132">freestream velocity</text><text x="30" y="212">density ρ∞, viscosity μ∞</text><text x="30" y="292">speed of sound a∞</text></g>
  <g transform="rotate(-8 330 195)"><path d="M200 196 C215 150 330 138 460 196 C360 214 270 222 200 196 Z" fill="#fffbd6" stroke="#22252b" stroke-width="2.5"/><path d="M200 196 H460" stroke="#22252b" stroke-width="1.8" stroke-dasharray="7 6" fill="none"/></g>
  <path d="M205 330 H455" stroke="#22252b" stroke-width="2.2" fill="none" marker-start="url(#a1)" marker-end="url(#a1)"/><path d="M205 318 V342 M455 318 V342" stroke="#22252b" stroke-width="2" fill="none"/>
  <text x="330" y="318" text-anchor="middle" font-size="14" fill="#6b7280">chord length</text><text x="330" y="346" text-anchor="middle" font-family="Source Serif 4,DejaVu Serif,serif" font-style="italic" font-size="24" fill="#22252b">c</text>
  <path d="M335 170 L372 70" stroke="#3b6fd4" stroke-width="4" fill="none" marker-end="url(#b1)"/><text x="388" y="86" font-family="Source Serif 4,DejaVu Serif,serif" font-style="italic" font-weight="700" font-size="30" fill="#3b6fd4">R</text><text x="412" y="112" font-size="14" fill="#3b6fd4">resultant force</text>
  <rect x="470" y="300" width="150" height="40" rx="10" fill="#ffe66d" stroke="#22252b" stroke-width="2"/><text x="545" y="325" text-anchor="middle" font-size="15" font-weight="700" fill="#22252b">Step 1: list them</text></svg>`;
  PiLab.registerGuide({
    id: 'airfoil-force', tabLabel: 'Example 1 · Airfoil force', crumb: 'Example 1',
    subtitle: 'Follow one worked example from a list of variables to three dimensionless numbers.',
    problem: {
      text: 'An airfoil is mounted in a wind tunnel. We want to know the <b>resultant aerodynamic force R</b> acting on it. Experience says R depends on five things: the freestream velocity, the freestream density, the fluid viscosity, the chord length and the speed of sound.',
      equation: 'R = f ( ρ∞, v∞, c, μ∞, a∞ )',
      goal: '<b>Goal:</b> replace these six quantities with a few dimensionless groups.', figure,
    },
    steps: [
      { title: 'Identify the variables', blocks: [
        { type: 'p', html: 'List the quantity you want, R, and every quantity it depends on. Together they make <b>n = 6</b> variables.' },
        { type: 'table', head: ['Symbol', 'Quantity', 'Role'], rows: [
          ['R', 'Resultant aerodynamic force', '<b>Dependent</b> · what we want to predict'], ['ρ∞', 'Freestream density', '<b>Independent</b> · fluid property'],
          ['v∞', 'Freestream velocity', '<b>Independent</b> · flow condition'], ['c', 'Chord length', '<b>Independent</b> · geometry'],
          ['μ∞', 'Viscosity', '<b>Independent</b> · fluid property'], ['a∞', 'Speed of sound', '<b>Independent</b> · compressibility of the fluid']] }] },
      { title: 'Write each variable in fundamental dimensions', blocks: [
        { type: 'p', html: 'Use mass (M), length (L) and time (T). Three different dimensions appear, so <b>k = 3</b>.' },
        { type: 'cells', cols: 3, items: [{ html: '[R] = M L T⁻²' }, { html: '[ρ∞] = M L⁻³' }, { html: '[v∞] = L T⁻¹' }, { html: '[c] = L' }, { html: '[μ∞] = M L⁻¹ T⁻¹' }, { html: '[a∞] = L T⁻¹' }] }] },
      { title: 'Count the dimensionless groups', blocks: [
        { type: 'p', html: 'The theorem says the number of groups is the number of variables minus the number of dimensions.' },
        { type: 'equation', html: 'n − k = 6 − 3 = 3 groups&nbsp; (Π₁, Π₂, Π₃)', size: 'clamp(20px,3.2vw,38px)' }] },
      { title: 'Choose the repeating variables', blocks: [
        { type: 'p', html: 'The <b>number of repeating variables must be the same as the number of fundamental dimensions</b>. Step 2 found k = 3 (M, L and T), so pick exactly three variables that together contain M, L and T. Each remaining variable is then paired with them to form one group.' },
        { type: 'equation', html: 'repeating variables = fundamental dimensions = k = 3', size: 'clamp(17px,2.4vw,28px)' },
        { type: 'p', html: 'Use these guidelines to choose well:' },
        { type: 'repeating',
          dependent: ['It is the quantity whose value <b>depends on the others</b>: the result you are trying to predict. In our problem it is the force R. Change the velocity, density or chord and R responds.',
            'The other five are <b>independent variables</b>: you set them freely in the tunnel. R cannot be a repeating variable because it would appear in Π₂ and Π₃ as well, and we could no longer isolate it in Π₁.'],
          kinds: { 'Geometric property': 'chord length c', 'Flow property': 'freestream velocity v∞', 'Fluid property': 'freestream density ρ∞' },
          check: { title: 'Check our choice: ρ∞, v∞, c', items: ['✓ Three repeating variables for k = 3 dimensions (rule 1)', '✓ One of each kind: c is geometric, v∞ is a flow property, ρ∞ is a fluid property (rule 2)', '✓ R is left out (rule 3)', '✓ Together they cover M, L and T (rule 5)', '✓ None is dimensionless, none share dimensions (rules 6–7)', '✗ a∞ is not chosen: same dimensions as v∞ (rule 7)'] },
          pis: ['Π₁ = f ( ρ∞, v∞, c, R )', 'Π₂ = f ( ρ∞, v∞, c, μ∞ )', 'Π₃ = f ( ρ∞, v∞, c, a∞ )'] },
        { type: 'note', html: 'tip: other choices work too, but some give more familiar numbers' }] },
      { title: 'Solve for the exponents', blocks: [
        { type: 'p', html: 'Give each repeating variable an unknown power, then require every dimension to cancel. Work through all three groups the same way:' },
        { type: 'exponents', groups: [
          { title: 'Π₁ = ρ∞ᵃ v∞ᵇ cᵈ R', dims: '(M L⁻³)ᵃ (L T⁻¹)ᵇ (L)ᵈ (M L T⁻²) = M⁰ L⁰ T⁰',
            lines: ['M: 0 = a + 1', 'L: 0 = −3a + b + d + 1', 'T: 0 = −b − 2'],
            solution: 'a = −1, &nbsp;b = −2, &nbsp;d = −2', result: 'Π₁ = ρ∞⁻¹ v∞⁻² c⁻² R = R / (ρ∞ v∞² c²)' },
          { title: 'Π₂ = ρ∞ᵃ v∞ᵇ cᵈ μ∞', dims: '(M L⁻³)ᵃ (L T⁻¹)ᵇ (L)ᵈ (M L⁻¹ T⁻¹) = M⁰ L⁰ T⁰',
            lines: ['M: 0 = a + 1', 'L: 0 = −3a + b + d − 1', 'T: 0 = −b − 1'],
            solution: 'a = −1, &nbsp;b = −1, &nbsp;d = −1', result: 'Π₂ = ρ∞⁻¹ v∞⁻¹ c⁻¹ μ∞ = μ∞ / (ρ∞ v∞ c)' },
          { title: 'Π₃ = ρ∞ᵃ v∞ᵇ cᵈ a∞', dims: '(M L⁻³)ᵃ (L T⁻¹)ᵇ (L)ᵈ (L T⁻¹) = M⁰ L⁰ T⁰',
            lines: ['M: 0 = a', 'L: 0 = −3a + b + d + 1', 'T: 0 = −b − 1'],
            solution: 'a = 0, &nbsp;b = −1, &nbsp;d = 0', result: 'Π₃ = ρ∞⁰ v∞⁻¹ c⁰ a∞ = a∞ / v∞' }] }] },
      { title: 'Read the results and tidy them up', blocks: [
        { type: 'p', html: 'Substitute the exponents from Step 5 to get the <b>actual result</b> of each group. Because a dimensionless group stays dimensionless when inverted or multiplied by a constant, we can then <b>change</b> it into the familiar named form.' },
        { type: 'results', rows: [
          { p: 'Π₁', rawSub: '= ρ∞⁻¹ v∞⁻² c⁻² R', raw: '= R / (ρ∞ v∞² c²)', change: 'multiply by ½,<br>replace c² with area S', finalSub: 'same as R / (q∞ S), q∞ = ½ ρ∞ v∞²', final: '= R / (½ ρ∞ v∞² S)', name: 'Force coefficient', sym: 'C<sub>R</sub>' },
          { p: 'Π₂', rawSub: '= ρ∞⁻¹ v∞⁻¹ c⁻¹ μ∞', raw: '= μ∞ / (ρ∞ v∞ c)', change: 'take the<br>inverse', final: '= ρ∞ v∞ c / μ∞', name: 'Reynolds number', sym: 'Re' },
          { p: 'Π₃', rawSub: '= ρ∞⁰ v∞⁻¹ c⁰ a∞', raw: '= a∞ / v∞', change: 'take the<br>inverse', final: '= v∞ / a∞', name: 'Mach number', sym: 'M<sub>∞</sub>' }],
          final: 'C<sub>R</sub> = f ( Re, M<sub>∞</sub> )', note: 'the force on the airfoil now depends on just two dimensionless numbers instead of five variables' }] },
    ],
    footer: [{ label: '← Introduction', href: '#/' }, { label: 'Try the exercises →', href: '#/exercise', primary: true }],
    source: 'Worked example adapted from Ian’s Guides, “Buckingham Pi Theorem” (iansguides.com) · Variable-selection guidelines adapted from lecture slide 7-16',
  });
})();
