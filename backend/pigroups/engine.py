"""Buckingham Pi engine for BuckinghamEdu.

The method follows BuckinghamPy (Mokbel Karam & Tony Saad, MIT licence; see BuckinghamPy-master/):
build the dimension matrix, try each set of k repeating variables that leaves out the dependent
variable, and for every other variable solve for the powers that make the product dimensionless.

Differences from BuckinghamPy:
  * the linear algebra is exact (fractions.Fraction), so no numpy / scipy / sympy is needed and
    there is no float rounding;
  * every solve keeps its working (power equations and the order they were solved in), so the
    page can show the student how each group was found;
  * a set the user picks is validated with plain-language reasons (guidelines from the guide page).
"""
from fractions import Fraction
from itertools import combinations
from math import lcm

DIMS = ('M', 'L', 'T', 'Θ')
LETTERS = 'abcdefgh'
MAX_VARIABLES = 12
MAX_EXPONENT = 10
SUP = str.maketrans('0123456789-', '⁰¹²³⁴⁵⁶⁷⁸⁹⁻')


class PiError(ValueError):
    """A problem with the user's input, worded so it can be shown on the page as is."""


# ---------------------------------------------------------------- formatting helpers
def fmt(x):
    """Fraction or int -> '−1', '1/2', '3' (with a real minus sign)."""
    x = Fraction(x)
    s = str(x.numerator) if x.denominator == 1 else f'{x.numerator}/{x.denominator}'
    return s.replace('-', '−')


def power_equation(const, coefs, letters):
    """The power equation of one dimension:  const + Σ coef·letter = 0."""
    out = fmt(const) if const else ''
    for c, l in zip(coefs, letters):
        if not c:
            continue
        mag = '' if abs(c) == 1 else str(abs(c))
        term = mag + l
        if out:
            out += (' − ' if c < 0 else ' + ') + term
        else:
            out = ('−' if c < 0 else '') + term
    return (out or '0') + ' = 0'


# ---------------------------------------------------------------- exact linear algebra
def matrix_rank(rows):
    m = [[Fraction(x) for x in r] for r in rows]
    if not m or not m[0]:
        return 0
    rank = 0
    for c in range(len(m[0])):
        p = next((i for i in range(rank, len(m)) if m[i][c]), None)
        if p is None:
            continue
        m[rank], m[p] = m[p], m[rank]
        for i in range(len(m)):
            if i != rank and m[i][c]:
                f = m[i][c] / m[rank][c]
                m[i] = [a - f * b for a, b in zip(m[i], m[rank])]
        rank += 1
        if rank == len(m):
            break
    return rank


def solve_exact(A, b):
    """Solve A·x = b exactly. A has one row per equation. Returns the unique solution, or None."""
    n = len(A[0]) if A else 0
    m = [[Fraction(x) for x in row] + [Fraction(y)] for row, y in zip(A, b)]
    r = 0
    for c in range(n):
        p = next((i for i in range(r, len(m)) if m[i][c]), None)
        if p is None:
            return None                       # not a unique solution
        m[r], m[p] = m[p], m[r]
        piv = m[r][c]
        m[r] = [x / piv for x in m[r]]
        for i in range(len(m)):
            if i != r and m[i][c]:
                f = m[i][c]
                m[i] = [a - f * bb for a, bb in zip(m[i], m[r])]
        r += 1
    if any(m[i][n] for i in range(r, len(m))):
        return None                           # inconsistent
    return [m[i][n] for i in range(n)]


# ---------------------------------------------------------------- input
def parse_variables(raw):
    """Validate the variables sent by the page: [{name, dims:[M,L,T,Θ], repeating}]."""
    if not isinstance(raw, list) or len(raw) < 2:
        raise PiError('Enter at least two variables.')
    if len(raw) > MAX_VARIABLES:
        raise PiError(f'Use at most {MAX_VARIABLES} variables.')
    out, seen = [], set()
    for i, v in enumerate(raw, 1):
        if not isinstance(v, dict):
            raise PiError(f'Variable {i} is not in the expected format.')
        name = str(v.get('name', '')).strip()
        if not name:
            raise PiError(f'Variable {i} has no name. Type a symbol such as ρ or V.')
        if len(name) > 24:
            raise PiError(f'The name of variable {i} is too long (24 characters at most).')
        if name in seen:
            raise PiError(f'Two variables are called “{name}”. Give each one its own name.')
        seen.add(name)
        dims = v.get('dims', [])
        if not isinstance(dims, list) or not 1 <= len(dims) <= len(DIMS):
            raise PiError(f'{name}: give the powers of M, L, T and Θ.')
        clean = []
        for d, x in zip(DIMS, dims):
            try:
                f = float(x if x not in ('', None) else 0)
            except (TypeError, ValueError):
                raise PiError(f'{name}: the power of {d} must be a whole number.')
            if f != int(f) or abs(f) > MAX_EXPONENT:
                raise PiError(f'{name}: the power of {d} must be a whole number between −{MAX_EXPONENT} and {MAX_EXPONENT}.')
            clean.append(int(f))
        clean += [0] * (len(DIMS) - len(clean))
        out.append({'name': name, 'dims': clean, 'repeating': bool(v.get('repeating'))})
    return out


# ---------------------------------------------------------------- the problem
class Problem:
    def __init__(self, variables, dependent=None):
        self.vars = variables
        self.n = len(variables)
        if dependent is not None and not (isinstance(dependent, int) and 0 <= dependent < self.n):
            raise PiError('The dependent variable is not one of the rows.')
        self.dep = dependent
        self.used = [d for d in range(len(DIMS)) if any(v['dims'][d] for v in variables)]
        self.dimensional = [i for i, v in enumerate(variables) if any(v['dims'])]
        self.k = matrix_rank([[variables[i]['dims'][d] for i in self.dimensional] for d in self.used])
        self.n_pi = self.n - self.k
        if self.n_pi < 1:
            raise PiError(f'With n = {self.n} variables and k = {self.k} independent dimensions there is no group to form '
                          f'(n − k = {self.n_pi}). Add every variable the problem depends on.')

    def name(self, i):
        return self.vars[i]['name']

    def names(self, idx):
        idx = [self.name(i) for i in idx]
        return idx[0] if len(idx) == 1 else ', '.join(idx[:-1]) + ' and ' + idx[-1]

    @property
    def used_names(self):
        return [DIMS[d] for d in self.used]

    def rank_of(self, idx):
        return matrix_rank([[self.vars[j]['dims'][d] for j in idx] for d in self.used])

    # ---- repeating variables
    def check_repeating(self, chosen):
        """Raise PiError with a plain reason when `chosen` cannot be the repeating set."""
        k, dims = self.k, ', '.join(self.used_names)
        if self.dep is not None and self.dep in chosen:
            raise PiError(f'{self.name(self.dep)} is the dependent variable, so it cannot be a repeating variable '
                          f'(it would show up in every Π). Untick it.')
        flat = [i for i in chosen if not any(self.vars[i]['dims'])]
        if flat:
            raise PiError(f'{self.names(flat)} {"is" if len(flat) == 1 else "are"} already dimensionless, '
                          f'so cannot be a repeating variable. Untick {"it" if len(flat) == 1 else "them"}.')
        if len(chosen) != k:
            raise PiError(f'You ticked {len(chosen)} repeating variable{"s" if len(chosen) != 1 else ""}, but the number of '
                          f'repeating variables must equal the number of fundamental dimensions: k = {k} ({dims}). '
                          f'Tick exactly {k}, or untick them all and BuckinghamEdu will choose.')
        missing = [DIMS[d] for d in self.used if all(self.vars[j]['dims'][d] == 0 for j in chosen)]
        if missing:
            raise PiError(f'Together, {self.names(chosen)} do not contain {" or ".join(missing)}, '
                          f'so they cannot cancel {"it" if len(missing) == 1 else "them"} in every group. Swap one of them.')
        if self.rank_of(chosen) < k:
            raise PiError(f'{self.names(chosen)} are not independent: their dimensions can be combined into a dimensionless '
                          f'group (or two of them have related dimensions). Swap one of them for another variable.')

    def candidate_sets(self):
        """Every valid repeating set, in input order (as BuckinghamPy enumerates them)."""
        pool = [i for i in self.dimensional if i != self.dep]
        return [list(c) for c in combinations(pool, self.k) if self.rank_of(c) == self.k]

    def no_set_reason(self):
        only_dep = [DIMS[d] for d in self.used
                    if self.dep is not None and self.vars[self.dep]['dims'][d]
                    and all(v['dims'][d] == 0 for i, v in enumerate(self.vars) if i != self.dep)]
        if only_dep:
            return (f'Only the dependent variable {self.name(self.dep)} contains {" and ".join(only_dep)}, so no group can '
                    f'make it dimensionless. Add the variable that brings in {" and ".join(only_dep)}.')
        return 'No set of repeating variables works for these dimensions. Check the powers of M, L, T and Θ.'

    # ---- building the groups
    def build(self, S):
        """Form every Π for the repeating set S (list of indices). Returns a list of group dicts."""
        letters = LETTERS[:len(S)]
        R = [[self.vars[j]['dims'][d] for j in S] for d in self.used]
        rest = [i for i in range(self.n) if i not in S]
        if self.dep is not None and self.dep in rest:
            rest.remove(self.dep)
            rest.insert(0, self.dep)
        groups = []
        for i in rest:
            x = self.vars[i]['dims']
            g = {'target': i, 'has_dependent': i == self.dep, 'given': not any(x),
                 'letters': [], 'equations': [], 'scale': 1}
            if g['given']:
                g['exps'] = {i: 1}
                groups.append(g)
                continue
            sol = solve_exact(R, [-x[d] for d in self.used])
            if sol is None:                   # cannot happen for a valid set, kept as a guard
                return None
            scale = lcm(*(f.denominator for f in sol)) if sol else 1
            exps = {i: scale}
            for j, a in zip(S, sol):
                if a:
                    exps[j] = int(a * scale)
            g.update(exps=exps, scale=scale,
                     letters=[{'letter': l, 'var': j, 'value': fmt(a)} for l, j, a in zip(letters, S, sol)],
                     equations=[{'dim': DIMS[d], 'text': power_equation(x[d], [self.vars[j]['dims'][d] for j in S], letters)}
                                for d in self.used])
            groups.append(g)
        return groups

    def check(self, exps):
        """Dimensions of a product (should all be zero), as 'M⁰ L⁰ T⁰'."""
        tot = [sum(e * self.vars[i]['dims'][d] for i, e in exps.items()) for d in range(len(DIMS))]
        assert all(tot[d] == 0 for d in self.used), 'group is not dimensionless'
        return ' '.join(DIMS[d] + '⁰' for d in self.used) or 'dimensionless'


def set_key(groups):
    """Same set of groups regardless of order or inversion (BuckinghamPy's duplicate check, done on exponents)."""
    key = []
    for g in groups:
        a = tuple(sorted(g['exps'].items()))
        b = tuple(sorted((i, -e) for i, e in g['exps'].items()))
        key.append(min(a, b))
    return frozenset(key)


def combine(a, b, e=1):
    """Exponent dict of  a · b^e."""
    out = dict(a)
    for i, x in b.items():
        out[i] = out.get(i, 0) + e * x
    return {i: x for i, x in out.items() if x}
