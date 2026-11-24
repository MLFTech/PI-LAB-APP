/* Symbol keyboard content: every key the keyboard shows, grouped into tabs.
   A tab with `symbols: 'fluid'` takes its keys from data/symbols/ (variables with their M, L, T, Θ powers).
   Other keys are [label, name] or [label, name, textToInsert]. If textToInsert is left out, the label is inserted.
   Edit or add tabs here; the keyboard (js/components/symbol-keyboard.js) builds itself from this list. */
window.PiLab.keyboard = {
  title: 'Symbol keyboard',
  hint: 'Tap a box in the Variable column, then tap keys to type its name. A variable key from the Fluid mechanics or Heat transfer tab also fills in its M, L, T and Θ powers. Hover a key to see what it means.',
  tabs: [
    // the variable tabs come from data/symbols/ (each key there also carries its M, L, T, Θ powers)
    { id: 'fluid', symbols: 'fluid' },
    { id: 'heat', symbols: 'heat' },
    {
      id: 'greek', label: 'Greek',
      groups: [
        { title: 'Lower case', keys: 'α β γ δ ε ζ η θ ι κ λ μ ν ξ ο π ρ σ τ υ φ χ ψ ω ϕ ϑ'.split(' ').map((s) => [s, 'Greek ' + s]) },
        { title: 'Upper case', keys: 'Γ Δ Θ Λ Ξ Π Σ Υ Φ Ψ Ω'.split(' ').map((s) => [s, 'Greek ' + s]) },
      ],
    },
    {
      id: 'power', label: 'Powers & subscripts',
      groups: [
        { title: 'Quick powers', keys: [['²', 'squared'], ['³', 'cubed'], ['⁻¹', 'power −1'], ['⁻²', 'power −2'], ['⁻³', 'power −3'], ['½', 'power ½', '^(1/2)'], ['ⁿ', 'power n']] },
        { title: 'Superscript (power)', keys: '⁰ ¹ ² ³ ⁴ ⁵ ⁶ ⁷ ⁸ ⁹ ⁺ ⁻ ⁼ ⁽ ⁾ ⁿ ⁱ ᵃ ᵇ ᵐ'.split(' ').map((s) => [s, 'superscript ' + s]) },
        { title: 'Subscript', keys: [
          ...'₀ ₁ ₂ ₃ ₄ ₅ ₆ ₇ ₈ ₉ ₊ ₋ ₌ ₍ ₎ ₐ ₑ ₒ ₓ ₕ ᵢ ⱼ ₖ ₗ ₘ ₙ ₚ ᵣ ₛ ₜ ᵤ ᵥ'.split(' ').map((s) => [s, 'subscript ' + s]),
          ['∞', 'free stream (∞)'], ['_', 'start a text subscript, e.g. C_D'], ['ʹ', 'prime'], ['″', 'double prime'], ['◌̇', 'dot above (rate), add after a letter', '̇'],
        ] },
      ],
    },
    {
      id: 'ops', label: 'Operators & numbers',
      groups: [
        { title: 'Numbers', keys: [...'7 8 9 4 5 6 1 2 3 0 .'.split(' ').map((s) => [s, s]), ['π', 'pi'], ['e', "Euler's number"]] },
        { title: 'Operators', keys: [
          ['+', 'plus'], ['−', 'minus'], ['×', 'times'], ['·', 'multiply (dot)'], ['÷', 'divide'], ['/', 'fraction bar'], ['^', 'power'],
          ['=', 'equals'], ['≈', 'approximately'], ['≠', 'not equal'], ['∝', 'proportional to'], ['±', 'plus or minus'],
          ['<', 'less than'], ['>', 'greater than'], ['≤', 'less or equal'], ['≥', 'greater or equal'], ['(', 'open bracket'], [')', 'close bracket'],
          ['[', 'open square bracket'], [']', 'close square bracket'], ['√', 'square root'], ['∂', 'partial derivative'], ['∇', 'del / gradient'],
          ['Δ', 'change in'], ['∫', 'integral'], ['Σ', 'sum'], ['∞', 'infinity'], ['→', 'tends to'], ['f( )', 'function of', 'f('], [',', 'comma'],
        ] },
      ],
    },
  ],
};
