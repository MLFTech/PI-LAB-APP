PiLab.home = {
  tag: 'Free · Step by step · No units required',
  headline: 'Mastering <span class="hl">your model</span> starts here.',
  brief: 'Test a small model, then predict how the full-size machine behaves. BuckinghamEdu teaches the Buckingham Pi theorem with short lessons, practice problems and a calculator that finds the dimensionless numbers for you.',
  ctas: [{ label: 'Start the guide', href: '#/guide' }, { label: 'Try the exercises', href: '#/exercise' }],
  sketch: `<svg viewBox="0 0 560 370" role="img" aria-label="Five variables, three dimensions, two groups" font-family="Shantell Sans,Comic Relief,sans-serif" stroke-linecap="round" stroke-linejoin="round">
    <rect x="28" y="28" width="176" height="270" rx="14" fill="#fff" stroke="#22252b" stroke-width="2.5"/>
    <text x="116" y="58" text-anchor="middle" font-size="16" font-weight="700" fill="#22252b">n = 5 variables</text>
    <g font-family="Source Serif 4,DejaVu Serif,serif" font-style="italic" font-size="24" fill="#22252b"><text x="50" y="100">Δp</text><text x="50" y="144">ρ</text><text x="50" y="188">V</text><text x="50" y="232">D</text><text x="50" y="276">μ</text></g>
    <g font-size="14" fill="#6b7280"><text x="96" y="98">pressure</text><text x="96" y="142">density</text><text x="96" y="186">velocity</text><text x="96" y="230">diameter</text><text x="96" y="274">viscosity</text></g>
    <path d="M212 163 H256 M246 156 L256 163 L246 170" fill="none" stroke="#22252b" stroke-width="2.5"/>
    <rect x="264" y="68" width="140" height="190" rx="14" fill="#fffbd6" stroke="#22252b" stroke-width="2.5"/>
    <text x="334" y="96" text-anchor="middle" font-size="15" font-weight="700" fill="#22252b">k = 3 dimensions</text>
    <text x="334" y="170" text-anchor="middle" font-size="32" font-family="Source Serif 4,DejaVu Serif,serif" font-style="italic" fill="#22252b">M  L  T</text>
    <text x="334" y="226" text-anchor="middle" font-size="12" fill="#6b7280">mass · length · time</text>
    <path d="M412 163 H446 M436 156 L446 163 L436 170" fill="none" stroke="#22252b" stroke-width="2.5"/>
    <rect x="454" y="108" width="84" height="110" rx="14" fill="#eaf0ff" stroke="#22252b" stroke-width="2.5"/>
    <g font-size="30" font-family="Source Serif 4,DejaVu Serif,serif" font-style="italic" fill="#22252b" text-anchor="middle"><text x="496" y="150">Π₁</text><text x="496" y="198">Π₂</text></g>
    <text x="300" y="332" text-anchor="middle" font-size="20" fill="#22252b">5 − 3 = 2 groups</text><path d="M190 344 H410" stroke="#3b6fd4" stroke-width="2.5" fill="none"/></svg>`,
  intro: {
    title: 'What is the Buckingham Pi theorem?',
    paragraphs: ['If a physical problem has <b>n</b> variables and they involve <b>k</b> basic dimensions (mass, length, time…), the problem can be rewritten using only <b>n − k</b> dimensionless groups, called Π terms.', 'Instead of testing every variable separately, you test a few ratios that carry the same physics.'],
    formula: 'Π₁ = f ( Π₂, Π₃, … )', formulaNote: 'n − k groups in total',
  },
  benefits: [
    { title: 'Fewer experiments', text: 'Five variables become two groups, so a test plan shrinks dramatically.' },
    { title: 'Reliable scale models', text: 'Match the Π groups on a model and its results transfer to the full-size system.' },
    { title: 'Results that travel', text: 'One dimensionless correlation works for any fluid, size or unit system.' },
  ],
  examples: { title: 'Two numbers that changed engineering', cards: [
    { title: 'Reynolds number: fluid mechanics', chips: ['ρ', 'V', 'D', 'μ', 'Δp'], eq: 'Re = ρVD / μ',
      history: 'In 1883 Osborne Reynolds sent a thread of dye through a glass pipe in Manchester and saw smooth flow break into eddies at a repeatable value. Arnold Sommerfeld named it the Reynolds number in 1908.',
      use: 'It predicts laminar or turbulent flow (about 2,300 in a pipe), sizes pipes and pumps, and lets wind-tunnel and ship-model tests stand in for full-size aircraft and hulls.' },
    { title: 'Nusselt number: heat transfer', chips: ['h', 'L', 'k', 'c<sub>p</sub>', 'μ'], eq: 'Nu = hL / k &nbsp; Pr = c<sub>p</sub>μ / k',
      history: 'In 1915, a year after Buckingham’s paper, Wilhelm Nusselt used dimensional analysis to show that convection depends on a few dimensionless groups. In 1916 he also explained film condensation.',
      use: 'It turns convection tests into correlations of the form Nu = f(Re, Pr), used to size heat exchangers, boilers, radiators and electronics cooling.' },
  ] },
};
