from django.urls import path

from play import views


urlpatterns = [
    path("api/health", views.health, name="health"),
    path("api/games", views.create_game, name="create_game"),
    path("api/games/<str:game_id>", views.get_game, name="get_game"),
    path("api/games/<str:game_id>/move", views.make_move, name="make_move"),
    path("api/games/<str:game_id>/restart", views.restart_game, name="restart_game"),
    path("api/games/<str:game_id>/resign", views.resign_game, name="resign_game"),
]
