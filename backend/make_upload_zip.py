"""Pack Pi Lab for uploading to a web host:   python backend/make_upload_zip.py
Creates pilab-upload.zip next to the pilab folder (on the Desktop), WITHOUT the private files:
the database (backend/db.sqlite3) and the Google secret (backend/google_oauth.json) stay on this computer.
"""
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent            # the pilab folder
OUT = ROOT.parent / 'pilab-upload.zip'
SKIP_DIRS = {'__pycache__', '.claude', '.git', 'staticfiles', 'BuckinghamPy-master', 'node_modules'}
SKIP_FILES = {'db.sqlite3', 'google_oauth.json', '.env'}


def wanted(p):
    rel = p.relative_to(ROOT)
    return not (set(rel.parts[:-1]) & SKIP_DIRS or rel.parts[0] in SKIP_DIRS or p.name in SKIP_FILES
                or p.suffix in ('.pyc', '.zip', '.sqlite3') or p.name.startswith('db.sqlite3'))


files = [p for p in sorted(ROOT.rglob('*')) if p.is_file() and wanted(p)]
with zipfile.ZipFile(OUT, 'w', zipfile.ZIP_DEFLATED) as z:
    for p in files:
        z.write(p, Path('pilab') / p.relative_to(ROOT))
print(f'{len(files)} files -> {OUT}')
