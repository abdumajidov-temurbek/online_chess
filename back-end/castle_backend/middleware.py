from django.conf import settings
from django.http import HttpResponse


class CorsMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.method == "OPTIONS":
            response = HttpResponse(status=204)
        else:
            response = self.get_response(request)

        request_origin = request.headers.get("Origin")
        if request_origin in settings.FRONTEND_ORIGINS:
            response["Access-Control-Allow-Origin"] = request_origin
        else:
            response["Access-Control-Allow-Origin"] = settings.FRONTEND_ORIGIN
        response["Access-Control-Allow-Methods"] = "GET,POST,OPTIONS"
        response["Access-Control-Allow-Headers"] = "Content-Type"
        return response
