from django.conf import settings
from django.contrib import admin
from django.urls import include, path, re_path
from django.views.static import serve

from feedback import views as feedback_views
from pigroups import views


def serve_fresh(request, path, document_root):
    """Serve a front-end file, but make the browser check for a newer copy every time,
    so an edited .js / .css file is never replaced by a stale cached one."""
    res = serve(request, path, document_root)
    res['Cache-Control'] = 'no-cache'
    return res


urlpatterns = [
    path('admin/', admin.site.urls),                 # feedback responses + spreadsheet download
    path('auth/', include('accounts.urls')),         # sign in with Google
    path('api/feedback/', include('feedback.urls')),
    path('api/', include('pigroups.urls')),
    path('privacy/', feedback_views.privacy, name='privacy'),   # privacy policy (Google's consent screen links here)
    path('', views.index, name='index'),
    # the front end's own files. Fine for development and small deployments; behind a real web server
    # (nginx, WhiteNoise ...) serve css/, js/ and data/ directly instead.
    re_path(r'^(?P<path>(?:css|js|data|img)/.+)$', serve_fresh, {'document_root': settings.FRONTEND_DIR}),
]
