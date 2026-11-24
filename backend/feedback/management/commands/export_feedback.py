"""Save every feedback response to a spreadsheet file.

    python backend/manage.py export_feedback                     ->  pilab-feedback-YYYY-MM-DD.xlsx (current folder)
    python backend/manage.py export_feedback results.csv         ->  CSV instead (chosen by the file extension)
"""
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError

from feedback import export
from feedback.models import Response


class Command(BaseCommand):
    help = 'Export all feedback responses to an .xlsx (default) or .csv spreadsheet.'

    def add_arguments(self, parser):
        parser.add_argument('path', nargs='?', help='output file, ending in .xlsx or .csv')

    def handle(self, *args, path=None, **opts):
        out = Path(path or export.filename('xlsx'))
        ext = out.suffix.lower().lstrip('.')
        if ext not in ('xlsx', 'csv'):
            raise CommandError('The file name must end in .xlsx or .csv')
        rows = Response.objects.all().order_by('created_at')
        if ext == 'csv':
            out.write_text(export.to_csv(rows), encoding='utf-8')
        else:
            out.write_bytes(export.to_xlsx(rows))
        self.stdout.write(self.style.SUCCESS(f'Saved {rows.count()} responses to {out.resolve()}'))
