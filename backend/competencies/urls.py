from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'categories', views.CompetencyCategoryViewSet)
router.register(r'competencies', views.CompetencyViewSet)

urlpatterns = [path('', include(router.urls)),]