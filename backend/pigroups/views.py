"""HTTP layer: serves the Pi Lab page and the JSON API used by the calculator."""
import json

from django.conf import settings
from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_GET, require_POST

from . import named_groups
from .engine import PiError
from .service import solve


def _json(data, status=200):
    return JsonResponse(data, status=status, json_dumps_params={'ensure_ascii': False})


@ensure_csrf_cookie            # gives the page the csrftoken cookie it sends back with each calculation
@require_GET
def index(request):
    html = (settings.FRONTEND_DIR / 'index.html').read_text(encoding='utf-8')
    return HttpResponse(html, content_type='text/html; charset=utf-8')


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


@require_GET
def named_list(request):
    """The catalogue of named dimensionless numbers the recogniser knows."""
    return _json({'ok': True, 'named': named_groups.catalogue()})
