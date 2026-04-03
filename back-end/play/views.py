import json
import uuid

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_POST

from accounts.auth import resolve_request_identity

from .services import game_manager, serialize_game


def _error(message, status=400):
    return JsonResponse({"error": message}, status=status)


def _body(request):
    if not request.body:
        return {}

    try:
        return json.loads(request.body.decode("utf-8"))
    except UnicodeDecodeError:
        raise ValueError("Request body must be valid UTF-8 JSON.")
    except json.JSONDecodeError:
        raise ValueError("Malformed JSON request body.")


@require_GET
def health(_request):
    return JsonResponse({"status": "ok", "app": "Castle Solo"})


@csrf_exempt
@require_POST
def create_game(request):
    try:
        payload = _body(request)
    except ValueError as exc:
        return _error(str(exc))

    guest_mode = bool(payload.get("is_guest") or payload.get("guestMode"))
    identity = resolve_request_identity(request)
    if "error" in identity and not guest_mode:
        return identity["error"]

    if "error" in identity and guest_mode:
        guest_session_id = request.headers.get("X-Guest-Session", "").strip()
        if not guest_session_id:
            guest_session_id = f"guest-{uuid.uuid4().hex}"
        identity = {
            "identity_type": "guest",
            "owner_key": f"guest:{guest_session_id}",
            "guest_session_id": guest_session_id,
            "user": None,
        }

    if "error" in identity:
        return identity["error"]

    if identity["identity_type"] == "guest" and not guest_mode:
        return _error("Guest mode must be explicitly requested.", status=400)

    player_name = payload.get("playerName", "").strip()
    if identity["identity_type"] == "user":
        player_name = player_name or request.user.name.strip() or request.user.email.split("@")[0]
    elif not player_name:
        return _error("Player name is required.")

    player_color = payload.get("playerColor", "").strip().lower()
    difficulty = payload.get("difficulty", "")

    try:
        game = game_manager.create_game(
            owner_key=identity["owner_key"],
            player_name=player_name,
            player_color=player_color,
            difficulty=difficulty,
            is_guest_game=identity["identity_type"] == "guest",
            guest_session_id=identity["guest_session_id"] or None,
        )
    except ValueError as exc:
        return _error(str(exc))

    response_payload = {"game": serialize_game(game)}
    if identity["identity_type"] == "guest" and identity["guest_session_id"]:
        response_payload["guest_session_id"] = identity["guest_session_id"]

    return JsonResponse(response_payload, status=201)


@require_GET
def get_game(request, game_id):
    identity = resolve_request_identity(request)
    if "error" in identity:
        return identity["error"]

    try:
        game = game_manager.get_game(game_id, identity["owner_key"])
    except KeyError:
        return _error("Game not found.", status=404)
    except PermissionError as exc:
        return _error(str(exc), status=403)
    return JsonResponse({"game": serialize_game(game)})


@csrf_exempt
@require_POST
def make_move(request, game_id):
    identity = resolve_request_identity(request)
    if "error" in identity:
        return identity["error"]

    try:
        payload = _body(request)
    except ValueError as exc:
        return _error(str(exc))

    move = payload.get("move", "").strip().lower()
    try:
        game = game_manager.make_move(game_id, identity["owner_key"], move)
    except KeyError:
        return _error("Game not found.", status=404)
    except PermissionError as exc:
        return _error(str(exc), status=403)
    except ValueError as exc:
        return _error(str(exc))
    return JsonResponse({"game": serialize_game(game)})


@csrf_exempt
@require_POST
def restart_game(request, game_id):
    identity = resolve_request_identity(request)
    if "error" in identity:
        return identity["error"]

    try:
        game = game_manager.restart_game(game_id, identity["owner_key"])
    except KeyError:
        return _error("Game not found.", status=404)
    except PermissionError as exc:
        return _error(str(exc), status=403)
    return JsonResponse({"game": serialize_game(game)})


@csrf_exempt
@require_POST
def resign_game(request, game_id):
    identity = resolve_request_identity(request)
    if "error" in identity:
        return identity["error"]

    try:
        game = game_manager.resign_game(game_id, identity["owner_key"])
    except KeyError:
        return _error("Game not found.", status=404)
    except PermissionError as exc:
        return _error(str(exc), status=403)
    return JsonResponse({"game": serialize_game(game)})
