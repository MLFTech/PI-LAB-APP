"""Run with:  python backend/manage.py test pigroups"""
import json

from django.test import SimpleTestCase

from .engine import PiError, solve_exact, matrix_rank
from .named_groups import identify
from .service import solve


def V(name, dims, rep=False):
    return {'name': name, 'dims': dims, 'repeating': rep}


AIRFOIL = [V('R', [1, 1, -2, 0]), V('ρ∞', [1, -3, 0, 0]), V('v∞', [0, 1, -1, 0]),
           V('c', [0, 1, 0, 0]), V('μ∞', [1, -1, -1, 0]), V('a∞', [0, 1, -1, 0])]
RADIATOR = [V('Q', [1, 2, -3, 0]), V('V', [0, 1, -1, 0]), V('ρ', [1, -3, 0, 0]), V('μ', [1, -1, -1, 0]),
            V('k', [1, 1, -3, -1]), V('cp', [0, 2, -2, -1]), V('D', [0, 1, 0, 0]), V('ΔT', [0, 0, 0, 1])]


def exps(group):
    return {t['name']: t['exp'] for t in group['terms']}


def displays(groups):
    return [g['named'] and g['named']['display'] for g in groups]


class LinearAlgebra(SimpleTestCase):
    def test_rank_and_solve(self):
        self.assertEqual(matrix_rank([[1, 0, 0], [0, 1, 1], [-3, 1, 1]]), 2)
        self.assertEqual(solve_exact([[1, 0], [0, 1], [1, 1]], [1, 2, 3]), [1, 2])
        self.assertIsNone(solve_exact([[1, 0], [0, 1], [1, 1]], [1, 2, 4]))     # inconsistent


class Identify(SimpleTestCase):
    def test_symbol_and_dimensions_together(self):
        self.assertEqual(identify('h', [1, 0, -3, -1]), 'htc')
        self.assertEqual(identify('h', [0, 1, 0, 0]), 'length')
        self.assertEqual(identify('a∞', [0, 1, -1, 0]), 'sound')
        self.assertEqual(identify('V', [0, 1, -1, 0]), 'velocity')
        self.assertEqual(identify('cₚ', [0, 2, -2, -1]), 'specific_heat')
        self.assertEqual(identify('α', [0, 2, -1, 0]), 'thermal_diff')
        self.assertEqual(identify('Q', [1, 2, -3, 0]), 'heat_rate')


class Engine(SimpleTestCase):
    def test_airfoil_auto(self):
        r = solve({'dependent': 0, 'variables': AIRFOIL})
        self.assertEqual((r['n'], r['k'], r['n_pi']), (6, 3, 3))
        self.assertTrue(r['auto'])
        self.assertEqual(r['result']['repeating_names'], ['ρ∞', 'v∞', 'c'])
        g = r['result']['groups']
        self.assertEqual(exps(g[0]), {'R': 1, 'ρ∞': -1, 'v∞': -2, 'c': -2})
        self.assertEqual(displays(g), ['C_F', '1/Re', '1/Ma'])
        self.assertTrue(g[0]['has_dependent'])
        self.assertEqual(g[0]['check'], 'M⁰ L⁰ T⁰')

    def test_radiator_four_dimensions_and_rearranging(self):
        vs = [dict(v, repeating=v['name'] in ('ρ', 'V', 'D', 'k')) for v in RADIATOR]
        r = solve({'dependent': 0, 'variables': vs})
        g = r['result']['groups']
        self.assertEqual(exps(g[0]), {'Q': 1, 'V': -3, 'ρ': -1, 'D': -2})
        self.assertEqual(exps(g[2]), {'V': 1, 'ρ': 1, 'k': -1, 'cp': 1, 'D': 1})
        self.assertEqual(displays(g)[1:3], ['1/Re', 'Pe'])
        re = r['result']['rearranged']
        self.assertEqual(re[0]['from'], 'Π₁ ÷ Π₄')
        self.assertEqual(re[0]['named']['symbol'], 'Nu')                 # Q/(k D ΔT)

    def test_working_shows_power_equations_and_powers(self):
        g = solve({'dependent': 0, 'variables': AIRFOIL})['result']['groups'][0]
        self.assertEqual(g['equations'][0], {'dim': 'M', 'text': '1 + a = 0'})
        self.assertEqual([l['value'] for l in g['letters']], ['−1', '−2', '−2'])
        self.assertNotIn('steps', g)

    def test_dimensionless_input_is_its_own_group(self):
        r = solve({'dependent': 0, 'variables': [V('F', [1, 1, -2, 0]), V('V', [0, 1, -1, 0]), V('α', [0, 0, 0, 0]),
                                                  V('c', [0, 1, 0, 0]), V('ρ', [1, -3, 0, 0]), V('μ', [1, -1, -1, 0])]})
        self.assertIn({'α': 1}, [exps(g) for g in r['result']['groups']])

    def test_fractional_powers_are_cleared(self):
        r = solve({'dependent': 0, 'variables': [V('t', [0, 0, 1, 0]), V('L', [0, 1, 0, 0]), V('g', [0, 1, -2, 0])]})
        self.assertEqual(exps(r['result']['groups'][0]), {'t': 2, 'L': -1, 'g': 1})
        self.assertTrue(r['warnings'])

    def test_bad_repeating_choices(self):
        cases = [
            ([0, 1, 2], 'dependent variable'),
            ([1, 2], 'must equal the number of fundamental dimensions'),
            ([2, 5, 3], 'do not contain M'),
        ]
        for idx, msg in cases:
            vs = [dict(v, repeating=i in idx) for i, v in enumerate(AIRFOIL)]
            with self.assertRaisesMessage(PiError, msg):
                solve({'dependent': 0, 'variables': vs})

    def test_input_errors(self):
        for vs, msg in [([V('Q', [1, 2, -3, 0])], 'at least two'),
                        ([V('Q', [1, 2, -3, 0]), V('Q', [0, 0, 0, 1])], 'Two variables'),
                        ([V('Q', [1, 2, -3, 0]), V('x', [0, 0.5, 0, 0])], 'whole number'),
                        ([V('Q', [1, 2, -3, 0]), V('T', [0, 0, 0, 1])], 'no group to form')]:
            with self.assertRaisesMessage(PiError, msg):
                solve({'dependent': 0, 'variables': vs})


class Api(SimpleTestCase):
    def post(self, data):
        return self.client.post('/api/pi-groups/', json.dumps(data), content_type='application/json')

    def test_solve(self):
        res = self.post({'dependent': 0, 'variables': AIRFOIL})
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()['n_pi'], 3)

    def test_error_is_400_with_message(self):
        res = self.post({'dependent': 0, 'variables': AIRFOIL[:1]})
        self.assertEqual(res.status_code, 400)
        self.assertFalse(res.json()['ok'])

    def test_bad_json(self):
        res = self.client.post('/api/pi-groups/', 'nope', content_type='application/json')
        self.assertEqual(res.status_code, 400)

    def test_csrf_is_enforced(self):
        from django.test import Client
        c = Client(enforce_csrf_checks=True)
        res = c.post('/api/pi-groups/', json.dumps({'variables': AIRFOIL}), content_type='application/json')
        self.assertEqual(res.status_code, 403)
        c.get('/')                                       # the page sets the csrftoken cookie
        token = c.cookies['csrftoken'].value
        res = c.post('/api/pi-groups/', json.dumps({'variables': AIRFOIL}), content_type='application/json',
                     HTTP_X_CSRFTOKEN=token)
        self.assertEqual(res.status_code, 200)

    def test_page_and_files_are_served(self):
        self.assertContains(self.client.get('/'), 'Pi Lab')
        self.assertEqual(self.client.get('/js/app.js').status_code, 200)
        self.assertEqual(self.client.get('/api/named-groups/').status_code, 200)
