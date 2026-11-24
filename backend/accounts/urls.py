from django.urls import path

from . import views

# mounted at /auth/
urlpatterns = [
    path('google/login/', views.google_login, name='google-login'),
    path('google/callback/', views.google_callback, name='google-callback'),
    path('logout/', views.sign_out, name='sign-out'),
    path('me/', views.me, name='me'),
]
