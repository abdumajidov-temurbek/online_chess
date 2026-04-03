from django.urls import path

from .views import CurrentUserView, GoogleAuthView, LoginView, LogoutView, RegisterView


urlpatterns = [
    path("register/", RegisterView.as_view(), name="auth_register"),
    path("login/", LoginView.as_view(), name="auth_login"),
    path("logout/", LogoutView.as_view(), name="auth_logout"),
    path("google/", GoogleAuthView.as_view(), name="auth_google"),
    path("me/", CurrentUserView.as_view(), name="auth_me"),
]
