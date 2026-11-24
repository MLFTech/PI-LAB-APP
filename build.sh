#!/usr/bin/env bash
# Render runs this on every deploy (see render.yaml). Stops at the first error.
set -o errexit

pip install -r backend/requirements.txt
python backend/manage.py collectstatic --noinput     # the admin's CSS, served by whitenoise
python backend/manage.py migrate --noinput           # create / update the tables in the database (Neon)
python backend/manage.py ensure_admin                # your /admin/ login, from PILAB_ADMIN_* variables
