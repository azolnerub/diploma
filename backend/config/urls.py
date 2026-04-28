from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import (
    TokenObtainPairView, TokenRefreshView,
    TokenVerifyView, TokenBlacklistView
)

urlpatterns = [
    path('admin/', admin.site.urls),
    # Получение пары токенов (access + refresh)
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    # Обновление access-токена с помощью refresh-токена
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    # Проверка валидности токена
    path('api/token/verify/', TokenVerifyView.as_view(), name='token_verify'),
    # Деактивация refresh-токена при выходе
    path('api/token/logout/', TokenBlacklistView.as_view(), name='token_blacklist'),
    # Остальные эндпоинты приложения
    path('api/', include('core.urls')),
]