"""Check a submitted questionnaire and turn it into clean values. Every error is worded for the person filling it in."""
from .questions import BY_CODE, QUESTIONS, sus_score


class FeedbackError(ValueError):
    def __init__(self, message, field=None):
        super().__init__(message)
        self.field = field


def _text(value, q):
    if value is None:
        return ''
    if not isinstance(value, str):
        raise FeedbackError(f'“{q["label"]}” must be text.', q['code'])
    value = ' '.join(value.split()) if q['type'] == 'text' else value.strip()
    value = ''.join(ch for ch in value if ch in '\n\t' or ord(ch) >= 32)      # drop control characters
    if len(value) > q.get('max', 2000):
        raise FeedbackError(f'“{q["label"]}” is too long (at most {q.get("max", 2000)} characters).', q['code'])
    return value


def _int(value, lo, hi, q):
    if isinstance(value, bool) or value in (None, ''):
        return None
    try:
        n = int(value)
    except (TypeError, ValueError):
        n = None
    if n is None or n != value and str(n) != str(value) or not lo <= n <= hi:
        raise FeedbackError(f'Please choose an answer from the list for “{q["label"]}”.', q['code'])
    return n


def clean(payload):
    """payload = {'answers': {code: value}, 'occupation_other': '...'}  ->  (name, occupation, answers, sus)"""
    if not isinstance(payload, dict) or not isinstance(payload.get('answers'), dict):
        raise FeedbackError('The form was sent in an unexpected format. Reload the page and try again.')
    raw = payload['answers']
    unknown = set(raw) - set(BY_CODE)
    if unknown:
        raise FeedbackError('The form is out of date. Reload the page and try again.')

    out = {}
    for q in QUESTIONS:
        v, t = raw.get(q['code']), q['type']
        if t in ('text', 'long'):
            v = _text(v, q) or None
        elif t == 'choice':
            if v not in (None, '') and v not in q['options']:
                raise FeedbackError(f'Please choose an answer from the list for “{q["label"]}”.', q['code'])
            v = v or None
        elif t == 'multi':
            if v in (None, ''):
                v = []
            if not isinstance(v, list) or any(x not in q['options'] for x in v):
                raise FeedbackError(f'Please tick answers from the list for “{q["label"]}”.', q['code'])
            v = [o for o in q['options'] if o in v] or None                  # keep the list order, drop repeats
        elif t in ('likert', 'rating'):
            v = _int(v, 1, 5, q)
        elif t == 'scale10':
            v = _int(v, 0, 10, q)
        if v is None:
            if q['required']:
                what = 'Please enter' if t in ('text', 'long') else 'Please answer'
                raise FeedbackError(f'{what} “{q["label"]}”.', q['code'])
            continue
        out[q['code']] = v

    occupation = out['occupation']
    if occupation == BY_CODE['occupation'].get('other'):
        other = _text(payload.get('occupation_other'), {'code': 'occupation', 'label': 'Your occupation', 'type': 'text', 'max': 100})
        if not other:
            raise FeedbackError('You chose “Other”: please type your occupation.', 'occupation')
        occupation = f'Other: {other}'
        out['occupation'] = occupation
    name = out.pop('name')
    out.pop('occupation')
    return name, occupation, out, sus_score(out)
