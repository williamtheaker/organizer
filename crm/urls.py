from django.conf.urls import url

from . import views

urlpatterns = [
        url(r'^$', views.index, name='index'),
        url(r'^action/(?P<action_id>[0-9]+)/$', views.action, name='action'),
        url(r'^f/(?P<form_id>[0-9]+)/$', views.form, name='form'),
        url(r'^thanks/(?P<form_id>[0-9]+)/$', views.thanks, name='thanks'),
]
