from functools import wraps

from django.http import JsonResponse
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken


def jwt_login_required(view_func):
    @wraps(view_func)
    def wrapped_view(request, *args, **kwargs):
        try:
            user_auth = JWTAuthentication().authenticate(request)
        except InvalidToken:
            return JsonResponse({"error": "Invalid or expired token."}, status=401)

        if user_auth is None:
            return JsonResponse({"error": "Authentication credentials were not provided."}, status=401)

        request.user, request.auth = user_auth
        return view_func(request, *args, **kwargs)

    return wrapped_view


def resolve_request_identity(request):
    try:
        user_auth = JWTAuthentication().authenticate(request)
    except InvalidToken:
        return {"error": JsonResponse({"error": "Invalid or expired token."}, status=401)}

    if user_auth is not None:
        request.user, request.auth = user_auth
        return {
            "identity_type": "user",
            "owner_key": f"user:{request.user.id}",
            "user": request.user,
            "guest_session_id": "",
        }

    guest_session_id = request.headers.get("X-Guest-Session", "").strip()
    if guest_session_id:
        return {
            "identity_type": "guest",
            "owner_key": f"guest:{guest_session_id}",
            "user": None,
            "guest_session_id": guest_session_id,
        }

    return {"error": JsonResponse({"error": "Authentication credentials were not provided."}, status=401)}
