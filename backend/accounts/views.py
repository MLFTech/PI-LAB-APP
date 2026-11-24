"""Sign in with Google, sign out, and "who am I" for the page.

Each Google account becomes a Django user named  google:<Google's account id>  (the id never changes, even if the
email does). Its email, first and last name are copied from Google at every sign-in.
"""
import os
import secrets

from django.contrib.auth import get_user_model, login, logout
from django.http import HttpResponseRedirect, JsonResponse
from django.urls import reverse
from django.utils.http import url_has_allowed_host_and_scheme
from django.views.decorators.http import require_GET, require_POST

from . import google

PREFIX = 'google:'
NOT_SET_UP = ('Google sign-in is not set up on this server yet. The site owner needs to add a Google OAuth client '
              '(see "Google sign-in" in README.md).')


def is_google_user(user):
    return bool(user.is_authenticated and user.username.startswith(PREFIX) and user.email)


def _next(request, value):
    """Only ever send people back to a page on this site."""
    if value and value.startswith('/') and url_has_allowed_host_and_scheme(value, allowed_hosts={request.get_host()}):
        return value
    return '/'


def _redirect_uri(request):
    return os.environ.get('PILAB_GOOGLE_REDIRECT_URI') or request.build_absolute_uri(reverse('google-callback'))


@require_GET
def google_login(request):
    """/auth/google/login/?next=/%23/feedback  ->  Google's account chooser"""
    nxt = _next(request, request.GET.get('next'))
    cfg = google.config()
    if not cfg:
        request.session['auth_error'] = NOT_SET_UP
        return HttpResponseRedirect(nxt)
    state, nonce, redirect_uri = secrets.token_urlsafe(24), secrets.token_urlsafe(24), _redirect_uri(request)
    request.session['google_oauth'] = {'state': state, 'nonce': nonce, 'next': nxt, 'redirect_uri': redirect_uri}
    return HttpResponseRedirect(google.auth_url(cfg[0], redirect_uri, state, nonce))


@require_GET
def google_callback(request):
    """Google sends the person back here with ?code=…&state=…"""
    flow = request.session.pop('google_oauth', None) or {}
    nxt = flow.get('next', '/')
    try:
        if request.GET.get('error'):
            raise google.GoogleError('Sign-in was cancelled.' if request.GET['error'] == 'access_denied'
                                     else 'Google could not sign you in. Please try again.')
        cfg = google.config()
        if not cfg:
            raise google.GoogleError(NOT_SET_UP)
        state = request.GET.get('state', '')
        if not flow or not secrets.compare_digest(state, flow.get('state', '')) or not request.GET.get('code'):
            raise google.GoogleError('The sign-in expired or was started in another tab. Please press Sign in again.')
        tokens = google.exchange_code(request.GET['code'], cfg[0], cfg[1], flow['redirect_uri'])
        c = google.claims(tokens.get('id_token'), cfg[0], flow['nonce'])
    except google.GoogleError as e:
        request.session['auth_error'] = str(e)
        return HttpResponseRedirect(nxt)

    User = get_user_model()
    user, created = User.objects.get_or_create(username=PREFIX + str(c['sub'])[:140])
    if created:
        user.set_unusable_password()                 # Google accounts can never log in with a password
    user.email = c['email'].lower()
    user.first_name = str(c.get('given_name', ''))[:150]
    user.last_name = str(c.get('family_name', ''))[:150]
    user.save()
    login(request, user, backend='django.contrib.auth.backends.ModelBackend')
    request.session['google_name'] = str(c.get('name', ''))[:150]
    return HttpResponseRedirect(nxt)


@require_POST
def sign_out(request):
    logout(request)
    return JsonResponse({'ok': True})


@require_GET
def me(request):
    """What the page needs to know about the visitor."""
    from feedback.models import Response          # keeps the accounts app free of a hard import cycle
    u = request.user
    out = {'ok': True, 'configured': bool(google.config()), 'signed_in': u.is_authenticated,
           'google': is_google_user(u), 'error': request.session.pop('auth_error', None)}
    if u.is_authenticated:
        r = Response.objects.filter(user=u).only('created_at').first()
        out.update(email=u.email, name=request.session.get('google_name') or u.get_full_name() or u.username,
                   responded=bool(r), responded_at=r.created_at.isoformat() if r else None)
    return JsonResponse(out, json_dumps_params={'ensure_ascii': False})
