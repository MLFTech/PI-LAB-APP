"""Sign in with Google (OAuth 2.0 / OpenID Connect, authorization-code flow), using only the standard library.

The browser goes to Google, the person picks an account, Google sends them back to /auth/google/callback/ with a
one-time code, and the server swaps that code for an ID token directly with Google over HTTPS. Because the token
comes straight from Google's token endpoint (not through the browser), OpenID Connect Core §3.1.3.7 allows using
its claims without checking the signature; we still check audience, issuer, expiry, nonce and email_verified.

Credentials (from Google Cloud Console > APIs & Services > Credentials > OAuth client ID, type "Web application"):
  either save the JSON file Google lets you download as   backend/google_oauth.json
  or set the environment variables  PILAB_GOOGLE_CLIENT_ID  and  PILAB_GOOGLE_CLIENT_SECRET.
"""
import base64
import json
import os
import time
import urllib.error
import urllib.parse
import urllib.request

from django.conf import settings

AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
TOKEN_URL = 'https://oauth2.googleapis.com/token'
ISSUERS = {'https://accounts.google.com', 'accounts.google.com'}


class GoogleError(Exception):
    """Something went wrong signing in. The message is shown to the person."""


def config():
    """(client_id, client_secret) or None when Google sign-in is not set up."""
    cid = os.environ.get('PILAB_GOOGLE_CLIENT_ID', '').strip()
    secret = os.environ.get('PILAB_GOOGLE_CLIENT_SECRET', '').strip()
    path = settings.GOOGLE_OAUTH_FILE
    if not (cid and secret) and path.exists():
        try:
            data = json.loads(path.read_text(encoding='utf-8'))
        except (OSError, ValueError):
            return None
        data = data.get('web', data)          # Google's downloaded file wraps everything in {"web": {...}}
        cid = cid or str(data.get('client_id', '')).strip()
        secret = secret or str(data.get('client_secret', '')).strip()
    return (cid, secret) if cid and secret else None


def auth_url(client_id, redirect_uri, state, nonce):
    return AUTH_URL + '?' + urllib.parse.urlencode({
        'client_id': client_id, 'redirect_uri': redirect_uri, 'response_type': 'code',
        'scope': 'openid email profile', 'state': state, 'nonce': nonce, 'prompt': 'select_account',
    })


def exchange_code(code, client_id, secret, redirect_uri):
    """Swap the one-time code for tokens. Returns Google's JSON reply."""
    body = urllib.parse.urlencode({'code': code, 'client_id': client_id, 'client_secret': secret,
                                   'redirect_uri': redirect_uri, 'grant_type': 'authorization_code'}).encode()
    req = urllib.request.Request(TOKEN_URL, data=body, headers={'Content-Type': 'application/x-www-form-urlencoded'})
    try:
        with urllib.request.urlopen(req, timeout=15) as res:
            return json.loads(res.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        try:
            why = json.loads(e.read().decode('utf-8')).get('error_description') or ''
        except ValueError:
            why = ''
        raise GoogleError(f'Google refused the sign-in ({e.code}). {why}'.strip()) from None
    except (urllib.error.URLError, TimeoutError, ValueError):
        raise GoogleError('Could not reach Google. Check the internet connection and try again.') from None


def _b64(part):
    return base64.urlsafe_b64decode(part + '=' * (-len(part) % 4))


def claims(id_token, client_id, nonce):
    """Read and check the ID token returned by exchange_code()."""
    try:
        c = json.loads(_b64(id_token.split('.')[1]))
    except (AttributeError, IndexError, ValueError):
        raise GoogleError('Google sent an unreadable sign-in token.') from None
    aud = c.get('aud')
    if (aud if isinstance(aud, list) else [aud]).count(client_id) != 1 or c.get('iss') not in ISSUERS:
        raise GoogleError('The sign-in token was not meant for Pi Lab.')
    if float(c.get('exp', 0)) < time.time() - 60:
        raise GoogleError('The sign-in took too long. Please try again.')
    if c.get('nonce') != nonce:
        raise GoogleError('The sign-in could not be verified. Please try again.')
    if not c.get('sub') or not c.get('email') or c.get('email_verified') not in (True, 'true'):
        raise GoogleError('Your Google account needs a verified email address to sign in.')
    return c
