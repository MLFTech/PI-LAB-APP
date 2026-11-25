/* Calculator content: labels and the starting table.
   The Π groups come from the Python solver, and the variable list from the AI extractor (backend/, Django) through `api`. */
window.PiLab.calculator = {
  title: 'Π-group calculator',
  lead: 'Describe your problem or enter its variables, and let Pi Lab build the dimensionless groups.',
  maxRows: 12,
  extractor: {
    title: 'AI variable extractor',
    hint: 'Type or paste the problem statement, or add a picture of it. The AI lists the variables involved and their dimensions, ready for the table below.',
    placeholder: 'e.g. The drag force F on a smooth sphere moving through water depends on its diameter D, its speed V, and the density ρ and viscosity μ of the water.',
    sample: 'The drag force F on a smooth sphere moving through water depends on its diameter D, its speed V, and the density ρ and viscosity μ of the water.',
    sampleLabel: 'Use an example problem',
    drop: 'Add a picture', dropNote: 'Drop, paste or tap to choose a JPG or PNG',
    button: 'Extract variables', working: 'Reading the problem…',
    found: 'Variables involved', add: 'Use these in the table',
    none: 'No variables were found. Try describing the problem in more detail.',
    disclaimer: 'AI suggestions can be wrong: check each variable and its dimensions before calculating.',
  },
  input: {
    title: 'Your variables',
    hint: 'Set how many variables, then enter each name and its powers of M, L, T and Θ. Choose the dependent variable, and tick the repeating variables (as many as there are fundamental dimensions), or leave them all unticked and Pi Lab will choose.',
    columns: ['Variable', 'M', 'L', 'T', 'Θ', 'Repeat'],
    dependentLabel: 'Dependent variable',
    noDependent: 'none (no single result)',
    initial: [
      { name: 'R', d: [1, 1, -2, 0], rep: false },
      { name: 'ρ∞', d: [1, -3, 0, 0], rep: true },
      { name: 'v∞', d: [0, 1, -1, 0], rep: true },
      { name: 'c', d: [0, 1, 0, 0], rep: true },
      { name: 'μ∞', d: [1, -1, -1, 0], rep: false },
      { name: 'a∞', d: [0, 1, -1, 0], rep: false }
    ]
  },
  // the Python (Django) solver: backend/pigroups. Relative so it works wherever the site is hosted.
  api: { piGroups: 'api/pi-groups/', extract: 'api/extract-variables/' },
  answer: {
    title: 'Answer',
    empty: 'Fill in your variables, then press <b>Calculate Π groups</b>. The groups, the working and any well-known numbers (Reynolds, Nusselt, Prandtl …) will appear here.',
    offline: 'Could not reach the Pi Lab solver. Start the Django server from the pilab folder with <code>python backend/manage.py runserver</code>, then open <code>http://127.0.0.1:8000/#/calculator</code>.'
  }
};
