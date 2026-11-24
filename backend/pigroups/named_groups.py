"""Recognise well-known dimensionless numbers of fluid mechanics and heat transfer in a Π group.

1. Each variable is read as a physical *kind* (density, velocity, thermal conductivity, ...) from its
   symbol AND its dimensions: “h” with M T⁻³ Θ⁻¹ is a heat transfer coefficient, “h” with L is a length.
2. A Π group becomes a map  kind -> power.  Kinds that are combinations of others are expanded
   (ν = μ/ρ, α = k/(ρ cₚ), γ = ρ g), so ρVL/μ and VL/ν are both seen as the Reynolds number.
3. That map is compared with the catalogue below, allowing the group to be inverted or squared
   (1/Re, Fr² ...), then with products of two named numbers (Re·Pr ...).
"""
from fractions import Fraction as F
import unicodedata

# ---------------------------------------------------------------- physical kinds
# key: (label, dims [M, L, T, Θ], aliases, default for these dims?)
KINDS = {
    'density':         ('density', (1, -3, 0, 0), 'ρ rho density', True),
    'velocity':        ('velocity', (0, 1, -1, 0), 'v u w velocity speed vel', True),
    'sound':           ('speed of sound', (0, 1, -1, 0), 'a c c0 a0 cs sound speedofsound', False),
    'length':          ('length', (0, 1, 0, 0), 'l d c h x y z r b w δ ε e s k dh lc length diameter chord height width thickness roughness span', True),
    'dyn_visc':        ('dynamic viscosity', (1, -1, -1, 0), 'μ mu η eta viscosity dynamicviscosity', True),
    'kin_visc':        ('kinematic viscosity', (0, 2, -1, 0), 'ν nu kinematicviscosity', True),
    'thermal_diff':    ('thermal diffusivity', (0, 2, -1, 0), 'α alpha a thermaldiffusivity', False),
    'mass_diff':       ('mass diffusivity', (0, 2, -1, 0), 'dab dm d diffusivity massdiffusivity', False),
    'gravity':         ('gravitational acceleration', (0, 1, -2, 0), 'g a gravity acceleration', True),
    'pressure':        ('pressure or stress', (1, -1, -2, 0), 'p δp dp deltap pressure τ tau τw stress shearstress pv', True),
    'spec_weight':     ('specific weight', (1, -2, -2, 0), 'γ gamma specificweight', True),
    'surface_tension': ('surface tension', (1, 0, -2, 0), 'σ sigma γ surfacetension', True),
    'frequency':       ('frequency or rotation speed', (0, 0, -1, 0), 'f ω omega n rpm frequency', True),
    'time':            ('time', (0, 0, 1, 0), 't τ time period', True),
    'force':           ('force', (1, 1, -2, 0), 'f fd fl r l d t w drag lift thrust force weight', True),
    'power':           ('power', (1, 2, -3, 0), 'p w power', True),
    'heat_rate':       ('heat transfer rate', (1, 2, -3, 0), 'q heat heatrate qdot', False),
    'flow_rate':       ('volume flow rate', (0, 3, -1, 0), 'q v flowrate volumeflowrate', True),
    'mass_flow':       ('mass flow rate', (1, 0, -1, 0), 'm mdot massflowrate', True),
    'mass':            ('mass', (1, 0, 0, 0), 'm mass', True),
    'temp_diff':       ('temperature difference', (0, 0, 0, 1), 'δt dt deltat t θ temperature tempdiff', True),
    'thermal_cond':    ('thermal conductivity', (1, 1, -3, -1), 'k kf ks λ conductivity thermalconductivity', True),
    'specific_heat':   ('specific heat', (0, 2, -2, -1), 'cp c cv specificheat', True),
    'htc':             ('heat transfer coefficient', (1, 0, -3, -1), 'h htc hconv heattransfercoefficient', True),
    'expansion':       ('thermal expansion coefficient', (0, 0, 0, -1), 'β beta expansion', True),
    'latent':          ('latent heat', (0, 2, -2, 0), 'hfg hlv l latent latentheat', True),
    'heat_flux':       ('heat flux', (1, 0, -3, 0), 'q qflux heatflux', True),
    'energy':          ('energy or torque', (1, 2, -2, 0), 'e t τ torque energy', True),
}
# kinds that are combinations of others (used so that equivalent forms match)
EXPAND = {
    'kin_visc': {'dyn_visc': 1, 'density': -1},                                   # ν = μ / ρ
    'thermal_diff': {'thermal_cond': 1, 'density': -1, 'specific_heat': -1},      # α = k / (ρ cₚ)
    'spec_weight': {'density': 1, 'gravity': 1},                                  # γ = ρ g
}
ALIASES = {k: set(v[2].split()) for k, v in KINDS.items()}

# ---------------------------------------------------------------- named numbers
# symbol, name, field, meaning, forms [(formula, {kind: power})]. The first form is the one shown.
NAMED = [
    # fluid mechanics
    ('Re', 'Reynolds number', 'fluid', 'inertia ÷ viscous forces',
     [('ρVL/μ', {'density': 1, 'velocity': 1, 'length': 1, 'dyn_visc': -1}),
      ('ρnD²/μ', {'density': 1, 'frequency': 1, 'length': 2, 'dyn_visc': -1})]),
    ('Ma', 'Mach number', 'fluid', 'flow speed ÷ speed of sound (compressibility)',
     [('V/a', {'velocity': 1, 'sound': -1})]),
    ('Fr', 'Froude number', 'fluid', 'inertia ÷ gravity forces',
     [('V/√(gL)', {'velocity': 1, 'gravity': F(-1, 2), 'length': F(-1, 2)})]),
    ('Eu', 'Euler number (pressure coefficient)', 'fluid', 'pressure ÷ inertia forces; also the form of the cavitation number and friction factor',
     [('Δp/(ρV²)', {'pressure': 1, 'density': -1, 'velocity': -2})]),
    ('We', 'Weber number', 'fluid', 'inertia ÷ surface-tension forces',
     [('ρV²L/σ', {'density': 1, 'velocity': 2, 'length': 1, 'surface_tension': -1})]),
    ('Sr', 'Strouhal number', 'fluid', 'oscillation frequency ÷ flow speed',
     [('fL/V', {'frequency': 1, 'length': 1, 'velocity': -1})]),
    ('C_F', 'Force coefficient (drag or lift)', 'fluid', 'force ÷ dynamic pressure × area',
     [('F/(ρV²L²)', {'force': 1, 'density': -1, 'velocity': -2, 'length': -2})]),
    ('C_P', 'Power coefficient', 'fluid', 'power ÷ the flow of kinetic energy',
     [('P/(ρn³D⁵)', {'power': 1, 'density': -1, 'frequency': -3, 'length': -5}),
      ('P/(ρV³L²)', {'power': 1, 'density': -1, 'velocity': -3, 'length': -2})]),
    ('C_Q', 'Flow coefficient', 'fluid', 'volume flow rate ÷ rotor sweep rate (pumps and fans)',
     [('Q/(nD³)', {'flow_rate': 1, 'frequency': -1, 'length': -3}),
      ('Q/(VL²)', {'flow_rate': 1, 'velocity': -1, 'length': -2})]),
    ('C_H', 'Head coefficient', 'fluid', 'pump head ÷ tip speed squared',
     [('gH/(n²D²)', {'gravity': 1, 'length': -1, 'frequency': -2})]),
    ('C_T', 'Torque coefficient', 'fluid', 'torque ÷ rotational inertia (turbomachines)',
     [('T/(ρn²D⁵)', {'energy': 1, 'density': -1, 'frequency': -2, 'length': -5})]),
    ('C_m', 'Mass flow coefficient', 'fluid', 'mass flow rate ÷ ρ V A',
     [('ṁ/(ρVL²)', {'mass_flow': 1, 'density': -1, 'velocity': -1, 'length': -2})]),
    ('Ca', 'Capillary number', 'fluid', 'viscous ÷ surface-tension forces',
     [('μV/σ', {'dyn_visc': 1, 'velocity': 1, 'surface_tension': -1})]),
    ('Bo', 'Bond number', 'fluid', 'gravity ÷ surface-tension forces',
     [('ρgL²/σ', {'density': 1, 'gravity': 1, 'length': 2, 'surface_tension': -1})]),
    ('Ga', 'Galileo number', 'fluid', 'gravity ÷ viscous forces',
     [('gL³/ν²', {'gravity': 1, 'length': 3, 'kin_visc': -2})]),
    ('t*', 'Dimensionless time', 'fluid', 'time ÷ the time the flow takes to pass one length',
     [('Vt/L', {'velocity': 1, 'time': 1, 'length': -1}), ('ft', {'frequency': 1, 'time': 1})]),
    # heat transfer
    ('Pr', 'Prandtl number', 'heat', 'momentum diffusivity ÷ thermal diffusivity',
     [('cₚμ/k', {'specific_heat': 1, 'dyn_visc': 1, 'thermal_cond': -1})]),
    ('Nu', 'Nusselt number', 'heat', 'convective ÷ conductive heat transfer (the Biot number has the same form with the solid’s k)',
     [('hL/k', {'htc': 1, 'length': 1, 'thermal_cond': -1}),
      ('Q/(kLΔT)', {'heat_rate': 1, 'thermal_cond': -1, 'length': -1, 'temp_diff': -1}),
      ('q″L/(kΔT)', {'heat_flux': 1, 'length': 1, 'thermal_cond': -1, 'temp_diff': -1})]),
    ('St', 'Stanton number', 'heat', 'heat transferred ÷ heat carried by the flow',
     [('h/(ρcₚV)', {'htc': 1, 'density': -1, 'specific_heat': -1, 'velocity': -1}),
      ('Q/(ρcₚVL²ΔT)', {'heat_rate': 1, 'density': -1, 'specific_heat': -1, 'velocity': -1, 'length': -2, 'temp_diff': -1})]),
    ('Pe', 'Péclet number', 'heat', 'heat carried by the flow ÷ heat conducted (= Re·Pr)',
     [('ρcₚVL/k', {'velocity': 1, 'length': 1, 'thermal_diff': -1})]),
    ('Ec', 'Eckert number', 'heat', 'kinetic energy ÷ enthalpy difference',
     [('V²/(cₚΔT)', {'velocity': 2, 'specific_heat': -1, 'temp_diff': -1})]),
    ('Br', 'Brinkman number', 'heat', 'viscous heating ÷ heat conduction',
     [('μV²/(kΔT)', {'dyn_visc': 1, 'velocity': 2, 'thermal_cond': -1, 'temp_diff': -1})]),
    ('Gr', 'Grashof number', 'heat', 'buoyancy ÷ viscous forces (natural convection)',
     [('gβΔTL³/ν²', {'gravity': 1, 'expansion': 1, 'temp_diff': 1, 'length': 3, 'kin_visc': -2})]),
    ('Ra', 'Rayleigh number', 'heat', 'buoyancy-driven flow ÷ diffusion (= Gr·Pr)',
     [('gβΔTL³/(να)', {'gravity': 1, 'expansion': 1, 'temp_diff': 1, 'length': 3, 'kin_visc': -1, 'thermal_diff': -1})]),
    ('Fo', 'Fourier number', 'heat', 'time ÷ the time heat takes to diffuse through L',
     [('αt/L²', {'thermal_diff': 1, 'time': 1, 'length': -2})]),
    ('Ja', 'Jakob number', 'heat', 'sensible heat ÷ latent heat (boiling, condensation)',
     [('cₚΔT/h_fg', {'specific_heat': 1, 'temp_diff': 1, 'latent': -1})]),
    ('Sc', 'Schmidt number', 'heat', 'momentum diffusivity ÷ mass diffusivity',
     [('ν/D_AB', {'kin_visc': 1, 'mass_diff': -1})]),
    ('Le', 'Lewis number', 'heat', 'thermal diffusivity ÷ mass diffusivity',
     [('α/D_AB', {'thermal_diff': 1, 'mass_diff': -1})]),
    ('βΔT', 'Thermal expansion parameter', 'heat', 'fractional density change caused by heating',
     [('βΔT', {'expansion': 1, 'temp_diff': 1})]),
]
POWERS = [F(1), F(-1), F(2), F(-2), F(1, 2), F(-1, 2)]
ANGLES = {'α', 'θ', 'φ', 'ϕ', 'β', 'angle', 'aoa', 'alpha', 'theta', 'phi'}

SUBSCRIPTS = str.maketrans('₀₁₂₃₄₅₆₇₈₉ₐₑₒₓₕₖₗₘₙₚₛₜ', '0123456789aeoxhklmnpst')


def norm(name):
    """'ρ∞' -> 'ρ', 'c_p' / 'cₚ' -> 'cp', 'ṁ' -> 'm', 'ΔT' -> 'δt'."""
    s = unicodedata.normalize('NFD', str(name).translate(SUBSCRIPTS))
    s = ''.join(ch for ch in s if unicodedata.category(ch) != 'Mn').casefold()
    return ''.join(ch for ch in s if ch.isalnum())


def _variants(name):
    s = norm(name)
    out = [s, s.rstrip('0123456789')]
    if len(s) > 1:
        out.append(s[0])          # ρm, vm, cm (model / prototype subscripts) -> ρ, v, c
    return [v for i, v in enumerate(out) if v and v not in out[:i]]


def identify(name, dims):
    """The physical kind of a variable from its symbol and dimensions, or None."""
    dims = tuple(dims)
    cands = [k for k, v in KINDS.items() if v[1] == dims]
    if not cands:
        return None
    for v in _variants(name):
        for k in cands:
            if v in ALIASES[k]:
                return k
    return next((k for k in cands if KINDS[k][3]), None)


def _expand(m):
    out = {}
    for k, e in m.items():
        for kk, ee in (EXPAND[k].items() if k in EXPAND else [(k, 1)]):
            out[kk] = out.get(kk, 0) + F(e) * ee
    return {k: v for k, v in out.items() if v}


_FORMS = [(n, f, _expand(m)) for n in NAMED for f, m in n[4]]
_BY_SYMBOL = {norm(n[0]): n for n in NAMED}


def kind_map(exps, kinds):
    """{variable index: power} -> {kind: power}. Unknown variables keep their own key so they never match."""
    m = {}
    for i, e in exps.items():
        m[kinds[i] or f'#{i}'] = m.get(kinds[i] or f'#{i}', 0) + e
    return _expand(m)


def _scaled(form, p):
    return {k: v * p for k, v in form.items()}


def power_text(sym, p):
    p = F(p)
    if p == 1:
        return sym
    if p == -1:
        return f'1/{sym}'
    base = {F(2): f'{sym}²', F(3): f'{sym}³', F(1, 2): f'√{sym}'}.get(abs(p), f'{sym}^{p}')
    return base if p > 0 else f'1/{base}'


def _named(entry, p, formula):
    sym, name, field, meaning, _ = entry
    return {'type': 'named', 'symbol': sym, 'name': name, 'field': field, 'meaning': meaning,
            'formula': formula, 'power': str(p), 'display': power_text(sym, p)}


def match_direct(km, powers=POWERS):
    for p in powers:
        for entry, formula, form in _FORMS:
            if _scaled(form, p) == km:
                return _named(entry, p, formula)
    return None


def match_pair(km):
    """Π = A^p · B^q for two named numbers A, B and p, q = ±1."""
    keys = set(km)
    for ia, (ea, fa, ma) in enumerate(_FORMS):
        if not set(ma) & keys:
            continue
        for eb, fb, mb in _FORMS[ia + 1:]:
            if eb is ea or not (set(ma) | set(mb)) >= keys:
                continue
            for p, q in ((1, 1), (1, -1), (-1, 1), (-1, -1)):
                tot = dict(_scaled(ma, p))
                for k, v in mb.items():
                    tot[k] = tot.get(k, 0) + v * q
                if {k: v for k, v in tot.items() if v} == km:
                    a, b = ea[0], eb[0]
                    display = {(1, 1): f'{a}·{b}', (1, -1): f'{a}/{b}', (-1, 1): f'{b}/{a}', (-1, -1): f'1/({a}·{b})'}[(p, q)]
                    return {'type': 'combo', 'symbol': display, 'display': display,
                            'name': f'Combination of the {ea[1]} and the {eb[1]}', 'field': ea[2],
                            'meaning': f'{a} = {fa},  {b} = {fb}', 'formula': '', 'power': '1'}
    return None


def recognise(exps, variables, kinds, direct_only=False):
    """What a group (exponent dict) is, or None. `variables` gives names/dims for ratio and given checks."""
    if len(exps) == 1:                                    # a variable that is already dimensionless
        (i, e), = exps.items()
        if not any(variables[i]['dims']):
            for v in _variants(variables[i]['name']):
                if v in _BY_SYMBOL:
                    return _named(_BY_SYMBOL[v], F(e), _BY_SYMBOL[v][4][0][0])
            label = 'an angle' if set(_variants(variables[i]['name'])) & ANGLES else 'a dimensionless input'
            return {'type': 'given', 'symbol': variables[i]['name'], 'display': variables[i]['name'],
                    'name': f'Already dimensionless ({label})', 'field': '', 'formula': '', 'power': '1',
                    'meaning': 'it is a Π group on its own'}
    km = kind_map(exps, kinds)
    hit = match_direct(km)
    if hit or direct_only:
        return hit
    hit = match_pair(km)
    if hit:
        return hit
    if len(exps) == 2:                                    # X / Y with the same dimensions
        (i, a), (j, b) = exps.items()
        if a == -b and variables[i]['dims'] == variables[j]['dims']:
            label = KINDS[kinds[i]][0] if kinds[i] and kinds[i] == kinds[j] else 'same-dimension'
            return {'type': 'ratio', 'symbol': '', 'display': f'{label} ratio', 'name': f'{label.capitalize()} ratio',
                    'field': '', 'formula': '', 'power': '1',
                    'meaning': 'geometric similarity' if label == 'length' else 'two quantities of the same kind'}
    return None


def catalogue():
    return [{'symbol': n[0], 'name': n[1], 'field': n[2], 'meaning': n[3], 'forms': [f for f, _ in n[4]]} for n in NAMED]
