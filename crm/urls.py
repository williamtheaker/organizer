from django.conf.urls import url, include
from . import views

urlpatterns = [
    url(r'^service-worker.js', views.service_worker),
    url(r'^', views.index),
]
