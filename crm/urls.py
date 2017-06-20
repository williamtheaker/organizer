from django.conf.urls import url, include
from . import views

urlpatterns = [
    url(r'^f/(?P<form_id>[0-9]+)/?', views.view_form),
    url(r'^action/(?P<action>.+)/(?P<form_id>[0-9]+)/?', views.view_form),
    url(r'^', views.index),
]
