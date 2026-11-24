"""Read the feedback at /admin/ (log in with the account made by  python backend/manage.py createsuperuser).
Buttons at the top of the list download everything; the Action menu downloads only the ticked responses."""
from django.contrib import admin
from django.http import HttpResponse
from django.utils.html import format_html_join

from . import export
from .models import Response
from .questions import QUESTIONS


@admin.register(Response)
class ResponseAdmin(admin.ModelAdmin):
    change_list_template = 'admin/feedback/response/change_list.html'
    list_display = ('created_at', 'email', 'name', 'occupation', 'sus_score', 'sus_grade', 'overall', 'recommend')
    list_filter = ('occupation', 'created_at')
    search_fields = ('email', 'name', 'occupation')
    date_hierarchy = 'created_at'
    readonly_fields = ('created_at', 'email', 'user', 'name', 'occupation', 'sus_score', 'sus_grade', 'all_answers')
    exclude = ('answers',)
    actions = ['download_xlsx', 'download_csv']

    @admin.display(description='overall (1-5)')
    def overall(self, obj):
        return obj.answers.get('overall')

    @admin.display(description='recommend (0-10)')
    def recommend(self, obj):
        return obj.answers.get('recommend')

    @admin.display(description='answers')
    def all_answers(self, obj):
        rows = []
        for q in QUESTIONS:
            if q['code'] in obj.answers:
                v = obj.answers[q['code']]
                rows.append((q['code'], q['label'], ', '.join(v) if isinstance(v, list) else v))
        return format_html_join('', '<p><b>{}</b> {}<br>&rarr; {}</p>', rows)

    def has_add_permission(self, request):          # responses only come from the form
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def _download(self, queryset, ext):
        rows = queryset.order_by('created_at')
        if ext == 'csv':
            res = HttpResponse(export.to_csv(rows), content_type='text/csv; charset=utf-8')
        else:
            res = HttpResponse(export.to_xlsx(rows), content_type=export.XLSX_TYPE)
        res['Content-Disposition'] = f'attachment; filename="{export.filename(ext)}"'
        return res

    @admin.action(description='Download selected as Excel (.xlsx)')
    def download_xlsx(self, request, queryset):
        return self._download(queryset, 'xlsx')

    @admin.action(description='Download selected as CSV')
    def download_csv(self, request, queryset):
        return self._download(queryset, 'csv')


admin.site.site_header = 'Pi Lab admin'
admin.site.site_title = 'Pi Lab admin'
admin.site.index_title = 'Feedback responses'
