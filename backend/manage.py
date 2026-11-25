#!/usr/bin/env python
"""BuckinghamEdu: run the site with   python backend/manage.py runserver   then open http://127.0.0.1:8000"""
import os
import sys


def main():
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'pilab_site.settings')
    from django.core.management import execute_from_command_line
    execute_from_command_line(sys.argv)


if __name__ == '__main__':
    main()
