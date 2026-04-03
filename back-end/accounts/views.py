from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import transaction
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.serializers import ValidationError
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken, TokenError

from allauth.socialaccount.models import SocialAccount

from .serializers import GoogleAuthSerializer, LoginSerializer, LogoutSerializer, RegisterSerializer, UserSerializer


User = get_user_model()


def build_auth_payload(user):
    refresh = RefreshToken.for_user(user)
    return {
        "access": str(refresh.access_token),
        "refresh": str(refresh),
        "user": UserSerializer(user).data,
    }


class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(build_auth_payload(user), status=status.HTTP_201_CREATED)


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        return Response(build_auth_payload(serializer.validated_data["user"]))


class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = LogoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        refresh = serializer.validated_data.get("refresh")
        if refresh:
            try:
                RefreshToken(refresh).blacklist()
            except TokenError as exc:
                raise ValidationError({"refresh": "Invalid refresh token."}) from exc
        return Response({"detail": "Logged out successfully."}, status=status.HTTP_200_OK)


class CurrentUserView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response({"user": UserSerializer(request.user).data})


class GoogleAuthView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = GoogleAuthSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        if not settings.GOOGLE_OAUTH_CLIENT_ID:
            raise ValidationError({"detail": "Google OAuth is not configured on the server."})

        try:
            payload = id_token.verify_oauth2_token(
                serializer.validated_data["credential"],
                google_requests.Request(),
                settings.GOOGLE_OAUTH_CLIENT_ID,
            )
        except ValueError as exc:
            raise ValidationError({"credential": "Invalid Google credential."}) from exc

        if not payload.get("email") or not payload.get("email_verified"):
            raise ValidationError({"credential": "Google account email is missing or not verified."})

        email = payload["email"].strip().lower()
        name = payload.get("name", "").strip()
        google_uid = payload.get("sub")

        with transaction.atomic():
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    "name": name,
                },
            )

            if not created and name and not user.name:
                user.name = name
                user.save(update_fields=["name"])

            if google_uid:
                social_account, social_created = SocialAccount.objects.get_or_create(
                    provider="google",
                    uid=google_uid,
                    defaults={
                        "user": user,
                        "extra_data": payload,
                    },
                )
                if not social_created:
                    update_fields = []
                    if social_account.user_id != user.id:
                        social_account.user = user
                        update_fields.append("user")
                    social_account.extra_data = payload
                    update_fields.append("extra_data")
                    social_account.save(update_fields=update_fields)

        return Response(build_auth_payload(user))
