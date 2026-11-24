"""Run with:  python backend/manage.py test feedback"""
import csv
import io
import json
import zipfile

from django.contrib.auth.models import User
from django.core.management import call_command
from django.test import Client, TestCase

from .export import to_csv, to_xlsx
from .models import Response
from .questions import QUESTIONS, sus_score


def full_answers(**over):
    a = {}
    for q in QUESTIONS:
        if q['type'] in ('likert', 'rating'):
            a[q['code']] = 4
        elif q['type'] == 'scale10':
            a[q['code']] = 9
    a.update(name='Test Person', occupation='Undergraduate student', prior='I had heard of it',
             used=['Exercises', 'Guide (worked examples)'], liked='The calculator')
    a.update(over)
    return a


class Privacy(TestCase):
    def test_page(self):
        with self.settings(CONTACT_EMAIL='owner@example.com'):
            res = self.client.get('/privacy/')
        self.assertContains(res, 'Privacy policy')
        self.assertContains(res, 'mailto:owner@example.com')


class Scoring(TestCase):
    def test_sus(self):
        best = {f'SUS{i}': (5 if i % 2 else 1) for i in range(1, 11)}
        self.assertEqual(sus_score(best), 100)
        self.assertEqual(sus_score({f'SUS{i}': 3 for i in range(1, 11)}), 50)
        self.assertIsNone(sus_score({'SUS1': 3}))


def google_user(n=1, email=None):
    return User.objects.create_user(f'google:{n}', email or f'person{n}@example.com')


class Api(TestCase):
    def setUp(self):
        self.user = google_user()
        self.client.force_login(self.user)

    def post(self, answers, **extra):
        return self.client.post('/api/feedback/', json.dumps({'answers': answers, **extra}), content_type='application/json')

    def test_questions_start_with_name_and_occupation(self):
        r = self.client.get('/api/feedback/questions/').json()
        first = [q['code'] for q in r['sections'][0]['questions']][:2]
        self.assertEqual(first, ['name', 'occupation'])

    def test_save(self):
        res = self.post(full_answers())
        self.assertEqual(res.status_code, 200, res.content)
        r = Response.objects.get()
        self.assertEqual((r.name, r.occupation), ('Test Person', 'Undergraduate student'))
        self.assertEqual(r.answers['used'], ['Guide (worked examples)', 'Exercises'])        # list order kept
        self.assertEqual(r.sus_score, 50.0)                    # all 4s: (3+1)*5*2.5
        self.assertEqual((r.user, r.email), (self.user, 'person1@example.com'))
        self.assertNotIn('name', r.answers)

    def test_other_occupation(self):
        res = self.post(full_answers(occupation='Other'))
        self.assertEqual(res.json()['field'], 'occupation')
        self.post(full_answers(occupation='Other'), occupation_other='Lab technician')
        self.assertEqual(Response.objects.get().occupation, 'Other: Lab technician')

    def test_sign_in_required(self):
        self.client.logout()
        res = self.post(full_answers())
        self.assertEqual(res.status_code, 401)
        admin = User.objects.create_superuser('admin', 'a@example.com', 'pw-for-tests-only')
        self.client.force_login(admin)                       # an admin login is not a Google account
        self.assertEqual(self.post(full_answers()).status_code, 401)
        self.assertEqual(Response.objects.count(), 0)

    def test_one_response_per_account(self):
        self.assertEqual(self.post(full_answers()).status_code, 200)
        res = self.post(full_answers(name='Again'))
        self.assertEqual(res.status_code, 409)
        self.assertTrue(res.json()['already'])
        me = self.client.get('/auth/me/').json()
        self.assertTrue(me['responded'])
        # a different account is fine
        self.client.force_login(google_user(2))
        self.assertEqual(self.post(full_answers()).status_code, 200)
        self.assertEqual(Response.objects.count(), 2)

    def test_errors(self):
        for answers, field in [(full_answers(name='  '), 'name'),
                               (full_answers(SUS3=None), 'SUS3'),
                               (full_answers(SUS3=6), 'SUS3'),
                               (full_answers(L1='4.5'), 'L1'),
                               (full_answers(occupation='Astronaut'), 'occupation'),
                               (full_answers(used=['Nope']), 'used')]:
            res = self.post(answers)
            self.assertEqual(res.status_code, 400)
            self.assertEqual(res.json()['field'], field)
        self.assertEqual(self.post({**full_answers(), 'hack': 1}).status_code, 400)
        self.assertEqual(self.client.post('/api/feedback/', 'x', content_type='application/json').status_code, 400)
        self.assertEqual(Response.objects.count(), 0)

    def test_csrf_is_enforced(self):
        c = Client(enforce_csrf_checks=True)
        c.force_login(self.user)
        body = json.dumps({'answers': full_answers()})
        self.assertEqual(c.post('/api/feedback/', body, content_type='application/json').status_code, 403)
        c.get('/')
        res = c.post('/api/feedback/', body, content_type='application/json', HTTP_X_CSRFTOKEN=c.cookies['csrftoken'].value)
        self.assertEqual(res.status_code, 200)


class Export(TestCase):
    def setUp(self):
        Response.objects.create(email='p@example.com', name='=cmd()', occupation='Lecturer / teaching staff', answers=full_answers(), sus_score=50)

    def test_xlsx_is_a_valid_workbook(self):
        z = zipfile.ZipFile(io.BytesIO(to_xlsx(Response.objects.all())))
        self.assertIn('xl/worksheets/sheet3.xml', z.namelist())
        sheet = z.read('xl/worksheets/sheet1.xml').decode()
        self.assertIn('SUS10', sheet)
        self.assertIn('t="inlineStr"', sheet)                # text cells are text, never formulas

    def test_csv_blocks_formulas(self):
        rows = list(csv.reader(io.StringIO(to_csv(Response.objects.all()).lstrip('﻿'))))
        self.assertEqual(rows[0][:5], ['ID', 'Submitted', 'Email', 'Name', 'Occupation'])
        self.assertEqual(rows[1][2:4], ['p@example.com', "'=cmd()"])

    def test_download_needs_staff(self):
        self.assertEqual(self.client.get('/api/feedback/export.xlsx').status_code, 302)       # to the admin login
        User.objects.create_superuser('admin', 'a@example.com', 'pw-for-tests-only')
        self.client.login(username='admin', password='pw-for-tests-only')
        res = self.client.get('/api/feedback/export.xlsx')
        self.assertEqual(res.status_code, 200)
        self.assertIn('attachment', res['Content-Disposition'])
        self.assertEqual(self.client.get('/admin/feedback/response/').status_code, 200)

    def test_command(self):
        import tempfile
        from pathlib import Path
        with tempfile.TemporaryDirectory() as d:
            out = Path(d) / 'r.xlsx'
            call_command('export_feedback', str(out), stdout=io.StringIO())
            self.assertTrue(zipfile.is_zipfile(out))
