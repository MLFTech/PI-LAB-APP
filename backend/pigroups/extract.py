"""AI variable extractor: read a problem statement (text and/or a picture) with Claude and list the physical
variables a dimensional analysis needs, each with its powers of M, L, T and Θ.

Needs an Anthropic API key in the environment (ANTHROPIC_API_KEY). Model: settings.EXTRACT_MODEL.
The answer is constrained to a JSON schema (structured outputs), then checked again here before it is used.
"""
import base64
import binascii
import json
import os
import re

from django.conf import settings

from .engine import PiError

MAX_TEXT = 4000
MAX_IMAGE_BYTES = 4 * 1024 * 1024
IMAGE_TYPES = ('image/jpeg', 'image/png', 'image/gif', 'image/webp')
MAX_VARIABLES = 12

SYSTEM = """You help engineering students set up a Buckingham Pi (dimensional analysis) problem in fluid mechanics \
or heat transfer. From the problem statement (text and/or a picture of it), list the physical variables that the \
analysis needs: the dependent variable (what the problem asks to predict or find) and every independent variable \
it depends on, including properties of the fluid that the physics needs even if the statement only implies them \
(for example viscosity for drag, or thermal conductivity for convection), and dimensional constants such as g.

For each variable give:
- symbol: the symbol used in the statement, or the usual textbook one (ρ, μ, V, D, L, h, k, cp, ΔT, g, ...);
  plain Unicode, at most 8 characters, subscripts as _x (e.g. F_D) or Unicode (e.g. T∞)
- name: a short description (e.g. "fluid density")
- M, L, T, Theta: the integer powers of mass, length, time and temperature in its dimensions
- role: "dependent" for the one quantity to be found, otherwise "independent"
- reason: one short sentence on why it is involved

Leave out pure numbers, unit conversions and variables that cannot affect the result. Use at most 12 variables. \
If the input is not a physics or engineering problem, return an empty list and say so in the note."""

SCHEMA = {
    'type': 'object',
    'properties': {
        'variables': {
            'type': 'array',
            'items': {
                'type': 'object',
                'properties': {
                    'symbol': {'type': 'string'},
                    'name': {'type': 'string'},
                    'M': {'type': 'integer'},
                    'L': {'type': 'integer'},
                    'T': {'type': 'integer'},
                    'Theta': {'type': 'integer'},
                    'role': {'type': 'string', 'enum': ['dependent', 'independent']},
                    'reason': {'type': 'string'},
                },
                'required': ['symbol', 'name', 'M', 'L', 'T', 'Theta', 'role', 'reason'],
                'additionalProperties': False,
            },
        },
        'note': {'type': 'string'},
    },
    'required': ['variables', 'note'],
    'additionalProperties': False,
}


def configured():
    """True when the server has credentials for the Claude API."""
    return bool(os.environ.get('ANTHROPIC_API_KEY') or os.environ.get('ANTHROPIC_AUTH_TOKEN'))


def _image_block(image):
    """{'media_type': 'image/jpeg', 'data': <base64>}  ->  an image content block, after checking it."""
    if not isinstance(image, dict):
        raise PiError('The picture was sent in an unexpected format. Please choose it again.')
    media, data = image.get('media_type'), image.get('data')
    if media not in IMAGE_TYPES or not isinstance(data, str):
        raise PiError('Please use a JPG, PNG, GIF or WebP picture.')
    try:
        raw = base64.b64decode(data, validate=True)
    except (binascii.Error, ValueError):
        raise PiError('The picture could not be read. Please choose it again.') from None
    if len(raw) > MAX_IMAGE_BYTES:
        raise PiError('The picture is too large (4 MB at most). Try a smaller or cropped picture.')
    return {'type': 'image', 'source': {'type': 'base64', 'media_type': media, 'data': data}}


def _clean(data):
    """Check Claude's JSON again and turn it into the shape the calculator table uses."""
    out, seen = [], set()
    for v in data.get('variables', [])[:MAX_VARIABLES]:
        sym = re.sub(r'\s+', '', str(v.get('symbol', '')))[:12]
        dims = [v.get(k) for k in ('M', 'L', 'T', 'Theta')]
        if not sym or sym in seen or not all(isinstance(d, int) and -10 <= d <= 10 for d in dims):
            continue
        seen.add(sym)
        out.append({'symbol': sym, 'name': str(v.get('name', ''))[:80], 'dims': dims,
                    'role': 'dependent' if v.get('role') == 'dependent' else 'independent',
                    'reason': str(v.get('reason', ''))[:200]})
    deps = [v for v in out if v['role'] == 'dependent']
    for v in deps[1:]:                                   # keep a single dependent variable
        v['role'] = 'independent'
    return {'ok': True, 'variables': out, 'note': str(data.get('note', ''))[:400]}


def extract(payload, client=None):
    """payload = {'text': '...', 'image': {'media_type', 'data'} | None}  ->  {ok, variables, note}"""
    if not isinstance(payload, dict):
        raise PiError('The request was sent in an unexpected format.')
    text = payload.get('text') or ''
    if not isinstance(text, str):
        raise PiError('The problem statement must be text.')
    text = text.strip()
    if len(text) > MAX_TEXT:
        raise PiError(f'The problem statement is too long ({MAX_TEXT} characters at most).')
    image = payload.get('image')
    if not text and not image:
        raise PiError('Type the problem statement or add a picture of it first.')

    content = []
    if image:
        content.append(_image_block(image))
    content.append({'type': 'text', 'text': ('Problem statement:\n' + text) if text else
                    'The problem statement is in the picture.'})

    if client is None and not configured():
        raise PiError('The AI extractor is not set up on this server yet (it needs ANTHROPIC_API_KEY). '
                      'You can still type the variables into the table below.')
    import anthropic                       # imported here so the solver still runs where the SDK is missing
    try:
        client = client or anthropic.Anthropic(timeout=90.0, max_retries=1)
        response = client.beta.messages.create(
            model=settings.EXTRACT_MODEL,
            max_tokens=16000,
            system=SYSTEM,
            messages=[{'role': 'user', 'content': content}],
            output_config={'effort': 'medium', 'format': {'type': 'json_schema', 'schema': SCHEMA}},
            betas=['server-side-fallback-2026-07-01'],
            fallbacks='default',            # if the model declines for policy reasons, the API retries on a fallback
        )
    except anthropic.AuthenticationError:
        raise PiError('The AI extractor is not set up: the server has no valid ANTHROPIC_API_KEY.') from None
    except anthropic.RateLimitError:
        raise PiError('The AI service is busy. Please try again in a minute.') from None
    except anthropic.BadRequestError as e:
        raise PiError(f'The AI service could not read this request ({e.message}).') from None
    except anthropic.APIStatusError as e:
        raise PiError(f'The AI service returned an error ({e.status_code}). Please try again later.') from None
    except anthropic.APIConnectionError:
        raise PiError('Could not reach the AI service. Check the internet connection and try again.') from None
    except anthropic.AnthropicError:
        raise PiError('The AI service could not be used. Please try again later.') from None

    if response.stop_reason == 'refusal':
        raise PiError('The AI could not help with this input. Try rewording the problem statement.')
    if response.stop_reason == 'max_tokens':
        raise PiError('The answer was cut short. Try a shorter problem statement.')
    text_out = next((b.text for b in response.content if b.type == 'text'), '')
    try:
        data = json.loads(text_out)
    except ValueError:
        raise PiError('The AI answer could not be read. Please try again.') from None
    return _clean(data)
