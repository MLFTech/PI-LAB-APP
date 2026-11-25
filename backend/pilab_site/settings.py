"""Django settings for the BuckinghamEdu site.

Django serves the static front end (index.html, css/, js/, data/, img/ in the folder above `backend/`) and two
JSON APIs used by the calculator: /api/pi-groups/ (the Π-group solver) and /api/extract-variables/ (the AI variable
extractor, which calls Claude when ANTHROPIC_API_KEY is set). No database is used.
For a public deployment set PILAB_SECRET_KEY, PILAB_DEBUG=0 and PILAB_ALLOWED_HOSTS (Render: see render.yaml).
"""
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent          # backend/
FRONTEND_DIR = BASE_DIR.parent                             # the BuckinghamEdu site (index.html, css, js, data, img)

SECRET_KEY = os.environ.get('PILAB_SECRET_KEY', 'dev-only-insecure-key-change-me-before-deploying')
DEBUG = os.environ.get('PILAB_DEBUG', '1') == '1'
if not DEBUG and SECRET_KEY.startswith('dev-only'):
    from django.core.exceptions import ImproperlyConfigured
    raise ImproperlyConfigured('Online (PILAB_DEBUG=0) you must set PILAB_SECRET_KEY to a long random value.')
ALLOWED_HOSTS = [h.strip() for h in os.environ.get('PILAB_ALLOWED_HOSTS', 'localhost,127.0.0.1,[::1]').split(',') if h.strip()]
if os.environ.get('RENDER_EXTERNAL_HOSTNAME'):           # Render sets this to e.g. pi-lab.onrender.com
    ALLOWED_HOSTS.append(os.environ['RENDER_EXTERNAL_HOSTNAME'])

INSTALLED_APPS = ['pigroups']
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]
ROOT_URLCONF = 'pilab_site.urls'
WSGI_APPLICATION = 'pilab_site.wsgi.application'
TEMPLATES = []
DATABASES = {}

# Online (PILAB_DEBUG=0) the site runs behind the host's HTTPS proxy (Render, PythonAnywhere): trust its header so
# Django knows requests are https, and only send the security cookie over https.
if not DEBUG:
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
CSRF_COOKIE_SECURE = not DEBUG
CSRF_TRUSTED_ORIGINS = [f'https://{h}' for h in ALLOWED_HOSTS if h not in ('localhost', '127.0.0.1', '[::1]')]

# a calculator request is a few hundred bytes; an extractor request can carry one picture (resized in the browser)
DATA_UPLOAD_MAX_MEMORY_SIZE = 6 * 1024 * 1024

# the public address used in search-engine tags, robots.txt and sitemap.xml; by default the address being visited.
# Set it when the site has its own domain, e.g. PILAB_SITE_URL=https://www.buckinghamedu.com
SITE_URL = os.environ.get('PILAB_SITE_URL', '').strip()

# AI variable extractor (pigroups/extract.py)
EXTRACT_MODEL = os.environ.get('PILAB_EXTRACT_MODEL', 'claude-opus-5-5')
EXTRACT_PER_HOUR = int(os.environ.get('PILAB_EXTRACT_PER_HOUR', '20'))   # per visitor (IP address), to cap API cost

LANGUAGE_CODE = 'en'
USE_TZ = True
DEFAULT_CHARSET = 'utf-8'
