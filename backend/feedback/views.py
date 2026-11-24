"""Feedback API: the page reads the questions from here and posts the answers back."""
import json

from django.conf import settings
from django.contrib.admin.views.decorators import staff_member_required
from django.shortcuts import render
from django.db import IntegrityError, transaction
from django.db.models import Q
from django.http import HttpResponse, JsonResponse
from django.views.decorators.http import require_GET, require_POST

from accounts.views import is_google_user

from . import export, questions
from .models import Response
from .validate import FeedbackError, clean


PRIVACY_UPDATED = '25 November 2026'          # change when you change templates/feedback/privacy.html
ALREADY ='This Google account has already sent its feedback. Each account can respond once. Thank you!'


def _json(data, status=200):
    return JsonResponse(data, status=status, json_dumps_params={'ensure_ascii': False})


@require_GET
def form(request):
    """GET /api/feedback/questions/  ->  {ok, sections, agree}"""
    return _json({'ok': True, **questions.public()})


@require_POST
def submit(request):
    """POST /api/feedback/  {answers: {code: value}, occupation_other}  ->  {ok, id}
    or {ok: false, error, field} (400), 401 when not signed in with Google, 409 when this account already answered."""
    user = request.user
    if not is_google_user(user):
        return _json({'ok': False, 'error': 'Please sign in with your Google account first.', 'signin': True}, 401)
    if Response.objects.filter(Q(user=user) | Q(email__iexact=user.email)).exists():
        return _json({'ok': False, 'error': ALREADY, 'already': True}, 409)
    try:
        payload = json.loads(request.body.decode('utf-8') or '{}')
    except (UnicodeDecodeError, json.JSONDecodeError):
        return _json({'ok': False, 'error': 'The form was not sent correctly. Reload the page and try again.'}, 400)
    try:
        name, occupation, answers, sus = clean(payload)
    except FeedbackError as e:
        return _json({'ok': False, 'error': str(e), 'field': e.field}, 400)
    try:
        with transaction.atomic():
            r = Response.objects.create(user=user, email=user.email, name=name, occupation=occupation,
                                        answers=answers, sus_score=sus)
    except IntegrityError:                         # two tabs sent at the same moment
        return _json({'ok': False, 'error': ALREADY, 'already': True}, 409)
    return _json({'ok': True, 'id': r.pk})


@require_GET
def privacy(request):
    """/privacy/: the privacy policy linked from the feedback page and Google's sign-in screen."""
    return render(request, 'feedback/privacy.html', {'contact': settings.CONTACT_EMAIL, 'updated': PRIVACY_UPDATED})


@staff_member_required
def download(request, ext):
    """Staff only: every response as a spreadsheet. /api/feedback/export.xlsx or .csv"""
    rows = Response.objects.all().order_by('created_at')
    if ext == 'csv':
        res = HttpResponse(export.to_csv(rows), content_type='text/csv; charset=utf-8')
    else:
        res = HttpResponse(export.to_xlsx(rows), content_type=export.XLSX_TYPE)
    res['Content-Disposition'] = f'attachment; filename="{export.filename(ext)}"'
    return res
