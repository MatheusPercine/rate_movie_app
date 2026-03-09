from flask import Blueprint

home_blueprint = Blueprint("home", __name__)


@home_blueprint.get("/")
def home():
    return {
        "message": "API do Rate Movie App funcionando",
        "endpoints": {
            "search_movies": "/api/movies/search?query=<nome>&page=1",
            "movie_details": "/api/movies/<movie_id>",
            "ratings": "/api/ratings",
            "rating_by_movie": "/api/ratings/<movie_id>",
        },
    }


@home_blueprint.get("/api/health")
def health_check():
    return {"status": "ok"}
