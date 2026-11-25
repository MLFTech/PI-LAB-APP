from django.urls import path

from . import views

urlpatterns = [
    path('pi-groups/', views.pi_groups, name='pi-groups'),
    path('named-groups/', views.named_list, name='named-groups'),
    path('extract-variables/', views.extract_variables, name='extract-variables'),
]
