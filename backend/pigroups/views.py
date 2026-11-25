"""HTTP layer: serves the BuckinghamEdu page and the JSON APIs used by the calculator (solver + AI variable extractor)."""
import json

from django.conf import settings
from django.core.cache import cache
from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_GET, require_POST

from . import named_groups
from .engine import PiError
from .extract import extract
from .service import solve


def _json(data, status=200):
    return JsonResponse(data, status=status, json_dumps_params={'ensure_ascii': False})


def _site(request):
    """The site's public address, e.g. https://buckinghamedu.onrender.com (PILAB_SITE_URL overrides it)."""
    return (settings.SITE_URL or request.build_absolute_uri('/')).rstrip('/')


@ensure_csrf_cookie            # gives the page the csrftoken cookie it sends back with each calculation
@require_GET
def index(request):
    html = (settings.FRONTEND_DIR / 'index.html').read_text(encoding='utf-8')
    return HttpResponse(html.replace('__SITE__', _site(request)), content_type='text/html; charset=utf-8')


@require_GET
def robots(request):
    """/robots.txt: let search engines read the site (not the API) and point them to the sitemap."""
    body = f'User-agent: *\nDisallow: /api/\nAllow: /\n\nSitemap: {_site(request)}/sitemap.xml\n'
    return HttpResponse(body, content_type='text/plain; charset=utf-8')


@require_GET
def sitemap(request):
    """/sitemap.xml: the pages are one address (the sections are #/… links inside it)."""
    body = ('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
            f'  <url><loc>{_site(request)}/</loc></url>\n</urlset>\n')
    return HttpResponse(body, content_type='application/xml; charset=utf-8')


@require_POST
def pi_groups(request):
    """POST {variables: [{name, dims: [M, L, T, Θ], repeating}], dependent: index | null}
    -> {ok: true, n, k, n_pi, result: {repeating, groups, rearranged?}, alternatives, warnings}
    or {ok: false, error} with status 400."""
    try:
        payload = json.loads(request.body.decode('utf-8') or '{}')
    except (UnicodeDecodeError, json.JSONDecodeError):
        return _json({'ok': False, 'error': 'The request was not valid JSON.'}, 400)
    try:
        return _json(solve(payload))
    except PiError as e:
        return _json({'ok': False, 'error': str(e)}, 400)


def _over_limit(request):
    """At most settings.EXTRACT_PER_HOUR extractor calls per visitor (IP address) per hour: each call costs money."""
    # behind the host's proxy the last X-Forwarded-For entry is the one the proxy saw (earlier ones can be faked)
    ip = (request.META.get('HTTP_X_FORWARDED_FOR', '').split(',')[-1].strip()
          or request.META.get('REMOTE_ADDR', '')) or 'unknown'
    key = 'extract:' + ip
    cache.add(key, 0, 3600)
    try:
        n = cache.incr(key)
    except ValueError:                     # expired between add and incr
        cache.set(key, 1, 3600)
        n = 1
    return n > settings.EXTRACT_PER_HOUR


@require_POST
def extract_variables(request):
    """POST {text, image: {media_type, data(base64)} | null}  ->  {ok, variables: [{symbol, name, dims, role,
    reason}], note}  or {ok: false, error} with status 400 (bad input / AI error) or 429 (too many requests)."""
    try:
        payload = json.loads(request.body.decode('utf-8') or '{}')
    except (UnicodeDecodeError, json.JSONDecodeError):
        return _json({'ok': False, 'error': 'The request was not valid JSON.'}, 400)
    if _over_limit(request):
        return _json({'ok': False, 'error': 'You have used the AI extractor many times this hour. '
                                            'Please try again later, or type the variables into the table.'}, 429)
    try:
        return _json(extract(payload))
    except PiError as e:
        return _json({'ok': False, 'error': str(e)}, 400)


@require_GET
def named_list(request):
    """The catalogue of named dimensionless numbers the recogniser knows."""
    return _json({'ok': True, 'named': named_groups.catalogue()})
