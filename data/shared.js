/* Content shared by every guide. */
PiLab.shared.guidelines = [
  'The <b>number of repeating variables</b> must equal the <b>number of fundamental dimensions</b> (k). With M, L and T, pick exactly three.',
  'Choose <b>one of each kind</b> of property: a geometric property, a flow property and a fluid property (see the box below).',
  'Never pick the <b>dependent variable</b>, or it will show up in every Π.',
  'The chosen set must not form a dimensionless group by itself, or the other Π’s cannot be built.',
  'Together they must cover all the primary dimensions (M, L, T).',
  'Never pick a variable that is already dimensionless.',
  'Never pick two variables with the same dimensions, or dimensions that differ only by an exponent.',
  'Prefer dimensional constants over changing variables, so only one Π contains the changing variable.',
  'Prefer common variables, since they can appear in every Π.',
  'Prefer simple variables over complex ones.',
];
/* how to solve for the exponents (Step 5 of every guide) */
PiLab.shared.exponentSteps = [
  'Write the Π group: the repeating variables raised to unknown powers a, b, d, times one remaining variable.',
  'Replace every variable with its fundamental dimensions from Step 2, keeping the unknown powers. A Π group is dimensionless, so the whole product equals M⁰ L⁰ T⁰.',
  'Collect the powers of M, L and T. Each total must be zero, which gives one equation per dimension.',
  'Read off the powers that make every equation true, then put them back into the group to get the original Π group.',
];
/* the three kinds of property a good set of repeating variables draws from (guideline 2) */
PiLab.shared.propertyKinds = [
  { name: 'Geometric property', html: 'Describes size or shape, for example length <i>L</i>, diameter <i>D</i>, height <i>H</i> or chord <i>c</i>.' },
  { name: 'Flow property', html: 'Describes the motion of the flow (its kinematics or dynamics), for example velocity <i>V</i>, flow rate <i>Q</i> or acceleration.' },
  { name: 'Fluid property', html: 'Describes the fluid itself, for example density <i>ρ</i>, dynamic viscosity <i>μ</i> or specific weight <i>γ</i>.' },
];
