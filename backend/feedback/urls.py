from django.urls import path, re_path

from . import views

urlpatterns = [
    path('', views.submit, name='feedback-submit'),
    path('questions/', views.form, name='feedback-questions'),
    re_path(r'^export\.(?P<ext>xlsx|csv)$', views.download, name='feedback-export'),
]
