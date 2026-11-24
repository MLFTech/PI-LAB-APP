/* Calculator content: labels and the starting table.
   The Π groups themselves come from the Python solver (backend/, Django) through `api`. */
window.PiLab.calculator = {
  title: 'Π-group calculator',
  lead: 'Enter the variables of your problem and let Pi Lab build the dimensionless groups.',
  maxRows: 12,
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
  api: { piGroups: 'api/pi-groups/' },
  answer: {
    title: 'Answer',
    empty: 'Fill in your variables, then press <b>Calculate Π groups</b>. The groups, the working and any well-known numbers (Reynolds, Nusselt, Prandtl …) will appear here.',
    offline: 'Could not reach the Pi Lab solver. Start the Django server from the pilab folder with <code>python backend/manage.py runserver</code>, then open <code>http://127.0.0.1:8000/#/calculator</code>.'
  }
};
