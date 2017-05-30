from django.conf.urls import url, include
from . import views
from rest_framework import routers

router = routers.DefaultRouter()
router.register(r'actions', views.ActionViewSet)
router.register(r'forms', views.FormViewSet)
router.register(r'fields', views.FieldViewSet)
router.register(r'campaigns', views.CampaignViewSet)
router.register(r'signups', views.SignupViewSet)
router.register(r'activists', views.ActivistViewSet)
router.register(r'users', views.UserViewSet)

urlpatterns = [
    url(r'^', include(router.urls))
]
