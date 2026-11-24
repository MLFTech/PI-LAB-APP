"""Create the admin login from environment variables, if it does not exist yet.

Render's free plan has no console for  createsuperuser, so build.sh runs this on every deploy:
    PILAB_ADMIN_USERNAME, PILAB_ADMIN_EMAIL, PILAB_ADMIN_PASSWORD
It never changes an existing account (change its password at /admin/ instead), and does nothing when the
variables are not set.
"""
import os

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError


class Command(BaseCommand):
    help = 'Create the admin user from PILAB_ADMIN_USERNAME / _EMAIL / _PASSWORD if it does not exist.'

    def handle(self, *args, **opts):
        name = os.environ.get('PILAB_ADMIN_USERNAME', '').strip()
        password = os.environ.get('PILAB_ADMIN_PASSWORD', '')
        email = os.environ.get('PILAB_ADMIN_EMAIL', '').strip()
        if not name or not password:
            self.stdout.write('ensure_admin: PILAB_ADMIN_USERNAME / PILAB_ADMIN_PASSWORD not set, skipping.')
            return
        if name.startswith('google:'):
            raise CommandError('The admin username cannot start with "google:".')
        if len(password) < 12:
            raise CommandError('PILAB_ADMIN_PASSWORD must be at least 12 characters.')
        User = get_user_model()
        if User.objects.filter(username=name).exists():
            self.stdout.write(f'ensure_admin: admin "{name}" already exists, left unchanged.')
            return
        User.objects.create_superuser(name, email, password)
        self.stdout.write(self.style.SUCCESS(f'ensure_admin: created admin "{name}".'))
