"""Turns a calculator request into a JSON-ready answer: engine (Π groups) + named-number recognition."""
from .engine import PiError, Problem, parse_variables, set_key, combine, LETTERS
from . import named_groups as ng

MAX_ALTERNATIVES = 5
# guideline: prefer simple, common variables as repeating ones (one geometric, one flow, one fluid property)
GEOMETRIC = {'length'}
FLOW = {'velocity', 'frequency', 'flow_rate', 'gravity'}
FLUID = {'density', 'thermal_cond'}


def pi_label(i):
    return 'Π' + str(i + 1).translate(str.maketrans('0123456789', '₀₁₂₃₄₅₆₇₈₉'))


class Solver:
    def __init__(self, payload):
        if not isinstance(payload, dict):
            raise PiError('The request is not in the expected format.')
        self.vars = parse_variables(payload.get('variables'))
        dep = payload.get('dependent', 0)
        self.p = Problem(self.vars, dep if dep is not None else None)
        self.kinds = [ng.identify(v['name'], v['dims']) for v in self.vars]

    # ---- recognition helpers
    def named(self, exps, direct_only=False):
        return ng.recognise(exps, self.vars, self.kinds, direct_only)

    def rearrange(self, groups):
        """Multiply unnamed groups by other groups (Π₁ ÷ Π₄ ...) until they become named numbers.
        Each step replaces one group with a product of itself and an unchanged group, so the set stays
        independent, and the dependent variable stays in a single group."""
        cur = [dict(g['exps']) for g in groups]
        how = [None] * len(cur)
        dep = next((i for i, g in enumerate(groups) if g['has_dependent']), None)
        def sym(e):
            r = self.named(e, direct_only=True)
            return r and r['symbol']
        for i in range(len(cur)):
            r = self.named(cur[i])
            if r and r['type'] in ('named', 'ratio', 'given'):   # already meaningful: leave it alone
                continue
            for j in range(len(cur)):
                if j == i or how[j] or (j == dep and i != dep):
                    continue
                hit = None
                taken = {sym(cur[m]) for m in range(len(cur)) if m != i} - {None}
                for e in (1, -1):
                    new = combine(cur[i], cur[j], e)
                    if new and sym(new) and sym(new) not in taken:     # a new named number, not a repeat
                        hit = (new, e)
                        break
                if hit:
                    cur[i] = hit[0]
                    how[i] = f'{pi_label(i)} {"×" if hit[1] == 1 else "÷"} {pi_label(j)}'
                    break
        return cur, how

    def score(self, S, groups):
        cur, _ = self.rearrange(groups)
        hits = [self.named(e) for e in cur]
        named = len({h['symbol'] for h in hits if h and h['type'] == 'named'})     # each named number once
        named += 2 / 3 * sum(1 for h in hits if h and h['type'] in ('ratio', 'given'))   # ratios count a bit less
        k = [self.kinds[j] for j in S]
        pref = sum(2 for x in k if x in GEOMETRIC | FLOW | FLUID)
        mix = 3 if (set(k) & GEOMETRIC and set(k) & FLOW and set(k) & FLUID) else 0
        size = sum(abs(e) for g in groups for e in g['exps'].values())
        scaled = sum(1 for g in groups if g['scale'] != 1)
        return 3 * named + pref + mix - 0.05 * size - 4 * scaled

    # ---- output
    def term_list(self, exps):
        """[{var, name, exp}] with the group's own variable first, then the rest in input order."""
        return [{'var': i, 'name': self.vars[i]['name'], 'exp': e} for i, e in sorted(exps.items())]

    def group_out(self, g, idx):
        return {
            'id': pi_label(idx), 'target': g['target'], 'target_name': self.vars[g['target']]['name'],
            'has_dependent': g['has_dependent'], 'given': g['given'],
            'terms': self.term_list(g['exps']), 'check': self.p.check(g['exps']),
            'letters': [{**l, 'name': self.vars[l['var']]['name']} for l in g['letters']],
            'equations': g['equations'], 'scale': g['scale'],
            'named': self.named(g['exps']),
        }

    def set_out(self, S, groups):
        out = {'repeating': S, 'repeating_names': [self.vars[j]['name'] for j in S],
               'groups': [self.group_out(g, i) for i, g in enumerate(groups)]}
        cur, how = self.rearrange(groups)
        if any(how):
            out['rearranged'] = [{'id': pi_label(i) + ('′' if how[i] else ''), 'from': how[i],
                                  'terms': self.term_list(e), 'check': self.p.check(e),
                                  'named': self.named(e)} for i, e in enumerate(cur)]
        return out

    def solve(self):
        p = self.p
        chosen = [i for i, v in enumerate(self.vars) if v['repeating']]
        if chosen:
            p.check_repeating(chosen)
        sets, seen = [], set()
        for S in p.candidate_sets():
            g = p.build(S)
            if g is None or set_key(g) in seen:
                continue
            seen.add(set_key(g))
            sets.append((self.score(S, g), S, g))
        if not sets:
            raise PiError(p.no_set_reason())
        sets.sort(key=lambda x: -x[0])                  # stable: ties keep input order
        if chosen:
            primary = (None, chosen, p.build(chosen))
            others = [s for s in sets if set_key(s[2]) != set_key(primary[2])]
        else:
            primary, others = sets[0], sets[1:]

        warnings = []
        appear = {i for g in primary[2] for i in g['exps']}
        for i, v in enumerate(self.vars):
            if i not in appear:
                warnings.append(f'{v["name"]} does not appear in any group: no combination of the other variables can '
                                f'cancel its dimensions, so it cannot affect a dimensionless result. Check that it belongs '
                                f'in the problem, or add the variable that pairs with it.')
        for g in primary[2]:
            if g['scale'] != 1:
                warnings.append(f'The powers for the group of {self.vars[g["target"]]["name"]} came out as fractions, so the '
                                f'group was raised to the power {g["scale"]} to clear them (a power of a Π group is still a Π group).')
        if p.dep is not None and not any(self.vars[p.dep]['dims']):
            warnings.append(f'The dependent variable {self.vars[p.dep]["name"]} is already dimensionless, so it is a group on its own.')

        return {
            'ok': True, 'n': p.n, 'k': p.k, 'n_pi': p.n_pi, 'dims': p.used_names,
            'dependent': p.dep, 'auto': not chosen, 'warnings': warnings,
            'variables': [{'name': v['name'], 'dims': v['dims'], 'kind': k, 'kind_label': ng.KINDS[k][0] if k else None}
                          for v, k in zip(self.vars, self.kinds)],
            'result': self.set_out(primary[1], primary[2]),
            'alternatives': [self.set_out(S, g) for _, S, g in others[:MAX_ALTERNATIVES]],
            'alternatives_total': len(others),
            'letters': LETTERS[:p.k],
        }


def solve(payload):
    return Solver(payload).solve()
