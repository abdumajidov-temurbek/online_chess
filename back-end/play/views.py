import json

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_POST

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

    player_name = payload.get("playerName", "").strip()
    player_color = payload.get("playerColor", "").strip().lower()
    difficulty = payload.get("difficulty", "")
    if not player_name:
        return _error("Player name is required.")

    try:
        game = game_manager.create_game(player_name=player_name, player_color=player_color, difficulty=difficulty)
    except ValueError as exc:
        return _error(str(exc))

    return JsonResponse({"game": serialize_game(game)}, status=201)


@require_GET
def get_game(_request, game_id):
    try:
        game = game_manager.get_game(game_id)
    except KeyError:
        return _error("Game not found.", status=404)
    return JsonResponse({"game": serialize_game(game)})


@csrf_exempt
@require_POST
def make_move(request, game_id):
    try:
        payload = _body(request)
    except ValueError as exc:
        return _error(str(exc))

    move = payload.get("move", "").strip().lower()
    try:
        game = game_manager.make_move(game_id, move)
    except KeyError:
        return _error("Game not found.", status=404)
    except ValueError as exc:
        return _error(str(exc))
    return JsonResponse({"game": serialize_game(game)})


@csrf_exempt
@require_POST
def restart_game(_request, game_id):
    try:
        game = game_manager.restart_game(game_id)
    except KeyError:
        return _error("Game not found.", status=404)
    return JsonResponse({"game": serialize_game(game)})


@csrf_exempt
@require_POST
def resign_game(_request, game_id):
    try:
        game = game_manager.resign_game(game_id)
    except KeyError:
        return _error("Game not found.", status=404)
    return JsonResponse({"game": serialize_game(game)})
