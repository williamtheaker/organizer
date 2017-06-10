"""organizer URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/1.11/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  url(r'^$', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  url(r'^$', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.conf.urls import url, include
    2. Add a URL to urlpatterns:  url(r'^blog/', include('blog.urls'))
"""
from django.conf.urls import url, include
from django.contrib import admin
from rest_framework import routers
from django.conf import settings
from importlib import import_module

from crm import views

router = routers.DefaultRouter()

for app in settings.INSTALLED_APPS:
    try:
        imported = import_module('.'.join((app, 'api_views')))
    except ImportError:
        continue
    if hasattr(imported, 'views'):
        for slug, viewset in imported.views.iteritems():
            router.register(slug, viewset)

urlpatterns = [
    url(r'^admin/', admin.site.urls),
    url(r'^api/', include(router.urls)),
    url(r'^crm/', include('crm.urls')),
    url(r'^django-rq/', include('django_rq.urls')),
    url(r'^anymail/', include('anymail.urls')),
    url(r'^slack/', include('django_slack_oauth.urls')),
    url(r'^', views.index),
]
