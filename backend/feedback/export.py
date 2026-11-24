"""Turn saved responses into a spreadsheet: .xlsx (opens in Excel, Google Sheets, LibreOffice) or .csv.

The .xlsx is written with the standard library only (zipfile + XML), so no extra package is needed.
Workbook sheets:
  Responses   one row per person: time, Google email, name, occupation, every answer (agree scale as 1-5), SUS score
  Summary     number of responses, mean SUS score, and the mean, SD and % agree of every 1-5 item
  Questions   what each column code means, and how the numbers are coded
"""
import csv
import io
import re
import statistics
import zipfile
from xml.sax.saxutils import escape

from django.utils import timezone

from .questions import AGREE, QUESTIONS, SUS_CODES, sus_grade

ANSWER_QUESTIONS = [q for q in QUESTIONS if q['code'] not in ('name', 'occupation')]
SCORED = [q for q in QUESTIONS if q['type'] in ('likert', 'rating')]


def _cell_value(q, v):
    if v is None:
        return ''
    if q['type'] == 'multi':
        return ', '.join(v)
    return v


def response_table(responses):
    """Header row + one row per response (values are str, int or float)."""
    head = ['ID', 'Submitted', 'Email', 'Name', 'Occupation'] + [q['code'] for q in ANSWER_QUESTIONS] + ['SUS score', 'SUS grade']
    rows = []
    for r in responses:
        a = r.answers or {}
        rows.append([r.pk, timezone.localtime(r.created_at).strftime('%Y-%m-%d %H:%M'), r.email or '', r.name, r.occupation]
                    + [_cell_value(q, a.get(q['code'])) for q in ANSWER_QUESTIONS]
                    + [r.sus_score if r.sus_score is not None else '', sus_grade(r.sus_score)])
    return head, rows


def summary_table(responses):
    responses = list(responses)
    sus = [r.sus_score for r in responses if r.sus_score is not None]
    rows = [['Responses', len(responses)],
            ['Mean SUS score (0-100)', round(statistics.mean(sus), 1) if sus else ''],
            ['SUS grade of the mean', sus_grade(statistics.mean(sus)) if sus else ''],
            ['SUS standard deviation', round(statistics.stdev(sus), 1) if len(sus) > 1 else ''],
            []]
    rows.append(['Code', 'Statement', 'Answers', 'Mean (1-5)', 'SD', '% agree (4-5)'])
    for q in SCORED:
        vals = [r.answers.get(q['code']) for r in responses if isinstance((r.answers or {}).get(q['code']), int)]
        rows.append([q['code'], q['label'], len(vals),
                     round(statistics.mean(vals), 2) if vals else '',
                     round(statistics.stdev(vals), 2) if len(vals) > 1 else '',
                     round(100 * sum(v >= 4 for v in vals) / len(vals), 1) if vals else ''])
    nps = [r.answers.get('recommend') for r in responses if isinstance((r.answers or {}).get('recommend'), int)]
    if nps:
        promoters, detractors = sum(v >= 9 for v in nps), sum(v <= 6 for v in nps)
        rows += [[], ['Net Promoter Score (−100 to 100)', round(100 * (promoters - detractors) / len(nps))],
                 ['Mean "recommend" (0-10)', round(statistics.mean(nps), 2)]]
    return rows


def questions_table():
    rows = [['Code', 'Section', 'Question', 'Answer coding']]
    for q in QUESTIONS:
        t = q['type']
        coding = {'likert': '1-5: ' + ', '.join(f'{i} = {w}' for i, w in enumerate(AGREE, 1)),
                  'rating': '1-5: ' + ', '.join(f'{i} = {w}' for i, w in enumerate(q.get('options', []), 1)),
                  'scale10': f'0 = {q.get("low", "")} … 10 = {q.get("high", "")}',
                  'choice': 'one of: ' + '; '.join(q.get('options', [])),
                  'multi': 'any of: ' + '; '.join(q.get('options', [])),
                  }.get(t, 'free text')
        if q['code'] in SUS_CODES:
            coding += ' (SUS item: ' + ('positive' if int(q['code'][3:]) % 2 else 'negative') + ' wording)'
        rows.append([q['code'], q['section'], q['label'], coding])
    rows.append(['SUS score', 'Ease of use', 'System Usability Scale, 0-100',
                 'odd items: answer − 1; even items: 5 − answer; sum × 2.5. About 68 is average.'])
    return rows


# ---------------------------------------------------------------- .csv

def _csv_safe(v):
    """Stop a spreadsheet from running typed text as a formula (=, +, -, @ at the start)."""
    if isinstance(v, str) and v[:1] in ('=', '+', '-', '@', '\t', '\r'):
        return "'" + v
    return v


def to_csv(responses):
    head, rows = response_table(responses)
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(head)
    for row in rows:
        w.writerow([_csv_safe(v) for v in row])
    return '﻿' + buf.getvalue()             # the BOM makes Excel read Greek letters and accents correctly


# ---------------------------------------------------------------- .xlsx

_BAD_XML = re.compile('[\x00-\x08\x0b\x0c\x0e-\x1f]')


def _col(n):
    s = ''
    while n:
        n, r = divmod(n - 1, 26)
        s = chr(65 + r) + s
    return s


def _sheet_xml(rows, widths, bold_rows=(0,), freeze=True):
    out = ['<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
           '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">']
    if freeze:
        out.append('<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" '
                   'state="frozen"/></sheetView></sheetViews>')
    out.append('<cols>' + ''.join(f'<col min="{i}" max="{i}" width="{w}" customWidth="1"/>' for i, w in enumerate(widths, 1)) + '</cols>')
    out.append('<sheetData>')
    for r, row in enumerate(rows, 1):
        style = ' s="1"' if (r - 1) in bold_rows else ' s="2"'
        cells = []
        for c, v in enumerate(row, 1):
            ref = f'{_col(c)}{r}'
            if v is None or v == '':
                continue
            if isinstance(v, (int, float)) and not isinstance(v, bool):
                cells.append(f'<c r="{ref}"{style}><v>{v}</v></c>')
            else:
                t = escape(_BAD_XML.sub('', str(v)))
                cells.append(f'<c r="{ref}" t="inlineStr"{style}><is><t xml:space="preserve">{t}</t></is></c>')
        out.append(f'<row r="{r}">' + ''.join(cells) + '</row>')
    out.append('</sheetData></worksheet>')
    return ''.join(out)


_STYLES = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
           '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
           '<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>'
           '<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill>'
           '<fill><patternFill patternType="solid"><fgColor rgb="FFFFE66D"/><bgColor indexed="64"/></patternFill></fill></fills>'
           '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>'
           '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>'
           '<cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>'
           '<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1">'
           '<alignment vertical="top" wrapText="1"/></xf>'
           '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>'
           '</cellXfs></styleSheet>')


def to_xlsx(responses):
    responses = list(responses)
    head, rows = response_table(responses)
    widths = [6, 17, 28, 22, 26] + [40 if q['type'] in ('long', 'multi') else 24 if q['type'] in ('text', 'choice') else 8
                                for q in ANSWER_QUESTIONS] + [10, 11]
    summary = summary_table(responses)
    sheets = [('Responses', _sheet_xml([head] + rows, widths)),
              ('Summary', _sheet_xml(summary, [34, 70, 10, 11, 8, 14], bold_rows=(5,), freeze=False)),
              ('Questions', _sheet_xml(questions_table(), [10, 26, 80, 70]))]
    ns_rel = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, 'w', zipfile.ZIP_DEFLATED) as z:
        z.writestr('[Content_Types].xml',
                   '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
                   '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
                   '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
                   '<Default Extension="xml" ContentType="application/xml"/>'
                   '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
                   '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'
                   + ''.join(f'<Override PartName="/xl/worksheets/sheet{i}.xml" '
                             'ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'
                             for i in range(1, len(sheets) + 1))
                   + '</Types>')
        z.writestr('_rels/.rels',
                   '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
                   '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
                   f'<Relationship Id="rId1" Type="{ns_rel}/officeDocument" Target="xl/workbook.xml"/></Relationships>')
        z.writestr('xl/workbook.xml',
                   '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
                   f'<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="{ns_rel}"><sheets>'
                   + ''.join(f'<sheet name="{n}" sheetId="{i}" r:id="rId{i}"/>' for i, (n, _) in enumerate(sheets, 1))
                   + '</sheets></workbook>')
        z.writestr('xl/_rels/workbook.xml.rels',
                   '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
                   '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
                   + ''.join(f'<Relationship Id="rId{i}" Type="{ns_rel}/worksheet" Target="worksheets/sheet{i}.xml"/>'
                             for i in range(1, len(sheets) + 1))
                   + f'<Relationship Id="rId{len(sheets) + 1}" Type="{ns_rel}/styles" Target="styles.xml"/></Relationships>')
        z.writestr('xl/styles.xml', _STYLES)
        for i, (_, xml) in enumerate(sheets, 1):
            z.writestr(f'xl/worksheets/sheet{i}.xml', xml)
    return buf.getvalue()


XLSX_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'


def filename(ext):
    return f'pilab-feedback-{timezone.localtime():%Y-%m-%d}.{ext}'
