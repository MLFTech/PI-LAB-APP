"""Run with:  python backend/manage.py test accounts   (Google itself is never contacted: the code swap is mocked)"""
import base64
import json
import time
from unittest import mock
from urllib.parse import parse_qs, urlparse

from django.contrib.auth.models import User
from django.test import TestCase

from . import google

ENV = {'PILAB_GOOGLE_CLIENT_ID': 'test-client.apps.googleusercontent.com', 'PILAB_GOOGLE_CLIENT_SECRET': 'shh'}


def id_token(**over):
    c = {'iss': 'https://accounts.google.com', 'aud': ENV['PILAB_GOOGLE_CLIENT_ID'], 'sub': '1234567890',
         'email': 'Student@Example.com', 'email_verified': True, 'name': 'Sam Student', 'given_name': 'Sam',
         'family_name': 'Student', 'exp': time.time() + 600}
    c.update(over)
    part = lambda d: base64.urlsafe_b64encode(json.dumps(d).encode()).decode().rstrip('=')
    return f'{part({"alg": "RS256"})}.{part(c)}.signature'


@mock.patch.dict('os.environ', ENV)
class GoogleSignIn(TestCase):
    def start(self, nxt='/#/feedback'):
        res = self.client.get('/auth/google/login/', {'next': nxt})
        self.assertEqual(res.status_code, 302)
        return res, parse_qs(urlparse(res['Location']).query)

    def finish(self, q, **claims):
        with mock.patch.object(google, 'exchange_code', return_value={'id_token': id_token(nonce=q['nonce'][0], **claims)}):
            return self.client.get('/auth/google/callback/', {'code': 'abc', 'state': q['state'][0]})

    def test_redirects_to_google(self):
        res, q = self.start()
        self.assertTrue(res['Location'].startswith(google.AUTH_URL))
        self.assertEqual(q['scope'], ['openid email profile'])
        self.assertEqual(q['redirect_uri'], ['http://testserver/auth/google/callback/'])

    def test_full_sign_in(self):
        _, q = self.start()
        res = self.finish(q)
        self.assertEqual(res['Location'], '/#/feedback')
        u = User.objects.get()
        self.assertEqual((u.username, u.email, u.has_usable_password()), ('google:1234567890', 'student@example.com', False))
        me = self.client.get('/auth/me/').json()
        self.assertEqual((me['signed_in'], me['google'], me['email'], me['name']), (True, True, 'student@example.com', 'Sam Student'))
        # signing in again reuses the same user
        _, q = self.start()
        self.finish(q, email='new@example.com')
        self.assertEqual(User.objects.get().email, 'new@example.com')

    def test_bad_state_or_token_is_refused(self):
        _, q = self.start()
        q['state'] = ['forged']
        self.finish(q)
        self.assertIn('expired', self.client.get('/auth/me/').json()['error'])
        for bad in ({'aud': 'someone-else'}, {'email_verified': False}, {'exp': time.time() - 3600}):
            _, q = self.start()
            self.finish(q, **bad)
            me = self.client.get('/auth/me/').json()
            self.assertFalse(me['signed_in'])
            self.assertTrue(me['error'])
        self.assertEqual(User.objects.count(), 0)

    def test_cancel_and_open_redirect(self):
        self.start()
        self.client.get('/auth/google/callback/', {'error': 'access_denied'})
        self.assertEqual(self.client.get('/auth/me/').json()['error'], 'Sign-in was cancelled.')
        res, _ = self.start('https://evil.example.com/')
        flow = self.client.session['google_oauth']
        self.assertEqual(flow['next'], '/')

    def test_sign_out(self):
        _, q = self.start()
        self.finish(q)
        self.client.post('/auth/logout/')
        self.assertFalse(self.client.get('/auth/me/').json()['signed_in'])


class EnsureAdmin(TestCase):
    def run_cmd(self, **env):
        from io import StringIO
        from django.core.management import call_command
        with mock.patch.dict('os.environ', env):
            out = StringIO()
            call_command('ensure_admin', stdout=out)
            return out.getvalue()

    def test_creates_once_and_never_overwrites(self):
        self.assertIn('skipping', self.run_cmd(PILAB_ADMIN_USERNAME='', PILAB_ADMIN_PASSWORD=''))
        self.assertIn('created', self.run_cmd(PILAB_ADMIN_USERNAME='boss', PILAB_ADMIN_PASSWORD='a-long-password-1'))
        self.assertIn('unchanged', self.run_cmd(PILAB_ADMIN_USERNAME='boss', PILAB_ADMIN_PASSWORD='another-password-2'))
        u = User.objects.get(username='boss')
        self.assertTrue(u.is_superuser and u.check_password('a-long-password-1'))

    def test_short_password_refused(self):
        from django.core.management.base import CommandError
        with self.assertRaises(CommandError):
            self.run_cmd(PILAB_ADMIN_USERNAME='boss', PILAB_ADMIN_PASSWORD='short')


class NotSetUp(TestCase):
    @mock.patch.dict('os.environ', {'PILAB_GOOGLE_CLIENT_ID': '', 'PILAB_GOOGLE_CLIENT_SECRET': ''})
    def test_message_when_no_credentials(self):
        with self.settings(GOOGLE_OAUTH_FILE=google.settings.BASE_DIR / 'no-such-file.json'):
            res = self.client.get('/auth/google/login/', {'next': '/#/feedback'})
            self.assertEqual(res['Location'], '/#/feedback')
            me = self.client.get('/auth/me/').json()
            self.assertFalse(me['configured'])
            self.assertIn('not set up', me['error'])

    def test_reads_googles_downloaded_file(self):
        import tempfile
        from pathlib import Path
        with tempfile.TemporaryDirectory() as d:
            p = Path(d) / 'g.json'
            p.write_text(json.dumps({'web': {'client_id': 'id1', 'client_secret': 's1', 'redirect_uris': []}}))
            with self.settings(GOOGLE_OAUTH_FILE=p), mock.patch.dict('os.environ', {'PILAB_GOOGLE_CLIENT_ID': '', 'PILAB_GOOGLE_CLIENT_SECRET': ''}):
                self.assertEqual(google.config(), ('id1', 's1'))
