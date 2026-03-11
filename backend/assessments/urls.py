from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'assessments', views.AssessmentViewSet)
router.register(r'history', views.AssessmentHistoryViewSet)

urlpatterns = [path('', include(router.urls)),]