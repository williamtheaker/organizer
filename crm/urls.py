from django.conf.urls import url, include
from . import views

urlpatterns = [
    url(r'^f/(?P<form_id>[0-9]+)/?', views.view_form),
    url(r'^action/(?P<pk>[0-9]+)/?', views.index, name='action'),
    url(r'^', views.index),
]
