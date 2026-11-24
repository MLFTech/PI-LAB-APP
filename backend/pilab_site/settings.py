"""Django settings for the Pi Lab site.

Django serves the static front end (index.html, css/, js/, data/ in the folder above `backend/`),
the calculator API at /api/, the feedback form's API at /api/feedback/, and the admin at /admin/
(where saved feedback can be read and downloaded as a spreadsheet).
Feedback is stored in an SQLite database: backend/db.sqlite3 (create it with  python backend/manage.py migrate),
or online in PostgreSQL when DATABASE_URL is set.
For a public deployment set PILAB_SECRET_KEY, PILAB_DEBUG=0 and PILAB_ALLOWED_HOSTS (Render: see render.yaml).
"""
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent          # backend/
FRONTEND_DIR = BASE_DIR.parent                             # the Pi Lab site (index.html, css, js, data)

SECRET_KEY = os.environ.get('PILAB_SECRET_KEY', 'dev-only-insecure-key-change-me-before-deploying')
DEBUG = os.environ.get('PILAB_DEBUG', '1') == '1'
if not DEBUG and SECRET_KEY.startswith('dev-only'):
    from django.core.exceptions import ImproperlyConfigured
    raise ImproperlyConfigured('Online (PILAB_DEBUG=0) you must set PILAB_SECRET_KEY to a long random value.')
ALLOWED_HOSTS = [h.strip() for h in os.environ.get('PILAB_ALLOWED_HOSTS', 'localhost,127.0.0.1,[::1]').split(',') if h.strip()]
if os.environ.get('RENDER_EXTERNAL_HOSTNAME'):           # Render sets this to e.g. pi-lab.onrender.com
    ALLOWED_HOSTS.append(os.environ['RENDER_EXTERNAL_HOSTNAME'])

INSTALLED_APPS = [
    'django.contrib.admin',          # /admin/: read feedback and download it as a spreadsheet
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',    # the admin's own CSS
    'accounts',                      # sign in with Google
    'pigroups',                      # the Π-group solver
    'feedback',                      # the user-experience questionnaire (needs a Google sign-in, one per account)
]
# Google OAuth client: this file (as downloaded from Google Cloud Console) or the PILAB_GOOGLE_CLIENT_ID /
# PILAB_GOOGLE_CLIENT_SECRET environment variables. See accounts/google.py and README.md.
GOOGLE_OAUTH_FILE = Path(os.environ.get('PILAB_GOOGLE_OAUTH_FILE', BASE_DIR / 'google_oauth.json'))
SESSION_COOKIE_AGE = 60 * 60 * 24 * 14             # stay signed in for two weeks
SESSION_COOKIE_SECURE = CSRF_COOKIE_SECURE = not DEBUG
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',    # serves the admin's CSS online (from STATIC_ROOT)
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]
ROOT_URLCONF = 'pilab_site.urls'
WSGI_APPLICATION = 'pilab_site.wsgi.application'
TEMPLATES = [{
    'BACKEND': 'django.template.backends.django.DjangoTemplates',
    'DIRS': [],
    'APP_DIRS': True,
    'OPTIONS': {'context_processors': [
        'django.template.context_processors.request',
        'django.contrib.auth.context_processors.auth',
        'django.contrib.messages.context_processors.messages',
    ]},
}]
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': os.environ.get('PILAB_DB_PATH', BASE_DIR / 'db.sqlite3'),
    }
}
# Online: a PostgreSQL database given as one address, e.g. from Neon (postgresql://user:pass@host/db?sslmode=require).
# Render's free disk is wiped on every restart, so the feedback must live in a real database there.
if os.environ.get('DATABASE_URL'):
    import dj_database_url
    DATABASES['default'] = dj_database_url.parse(os.environ['DATABASE_URL'], conn_max_age=60, conn_health_checks=True)
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'           # the admin's CSS, gathered by  manage.py collectstatic  when online

# Online (PILAB_DEBUG=0) the site runs behind the host's HTTPS proxy (e.g. PythonAnywhere): trust its header so
# Django knows requests are https (needed for the Google sign-in address and secure cookies).
if not DEBUG:
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
CSRF_TRUSTED_ORIGINS = [f'https://{h}' for h in ALLOWED_HOSTS if h and h not in ('localhost', '127.0.0.1', '[::1]')]

# shown on the privacy page as the person to contact about the data (set it on the server)
CONTACT_EMAIL = os.environ.get('PILAB_CONTACT_EMAIL', '').strip()

DATA_UPLOAD_MAX_MEMORY_SIZE = 64 * 1024        # a calculator request or a feedback form is a few KB
LANGUAGE_CODE = 'en'
TIME_ZONE = os.environ.get('PILAB_TIME_ZONE', 'Asia/Singapore')   # UTC+8, this computer's zone; times in the spreadsheet use it
USE_TZ = True
DEFAULT_CHARSET = 'utf-8'
