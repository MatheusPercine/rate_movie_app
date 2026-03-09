from flask import Blueprint, jsonify, request

from application.services import MovieService

movie_blueprint = Blueprint("movies", __name__)


@movie_blueprint.get("/api/movies/search")
def search_movies():
    service = MovieService()
    query = request.args.get("query", "").strip()
    page = request.args.get("page", default=1, type=int)
    genre_id = request.args.get("genre_id", default=None, type=int)
    year = request.args.get("year", default=None, type=int)

    return jsonify(
        service.search_movies(
            query=query,
            page=page,
            genre_id=genre_id,
            year=year,
        )
    )


@movie_blueprint.get("/api/movies/<int:movie_id>")
def movie_details(movie_id: int):
    service = MovieService()
    return jsonify(service.get_movie_details(movie_id))
