from pathlib import Path

from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv
from sqlalchemy import inspect, text

from config import Config
from models import Rating, db
from tmdb_client import TmdbClient, TmdbClientError


load_dotenv()


def create_app(config_overrides: dict | None = None) -> Flask:
    app = Flask(__name__)
    app.config.from_object(Config)
    if config_overrides:
        app.config.update(config_overrides)

    instance_path = Path(app.instance_path)
    instance_path.mkdir(parents=True, exist_ok=True)

    db.init_app(app)
    CORS(app)

    with app.app_context():
        db.create_all()
        ensure_rating_schema()

    register_routes(app)
    register_error_handlers(app)

    return app


def register_routes(app: Flask) -> None:
    @app.get("/")
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

    @app.get("/api/health")
    def health_check():
        return {"status": "ok"}

    @app.get("/api/movies/search")
    def search_movies():
        query = request.args.get("query", "").strip()
        page = request.args.get("page", default=1, type=int)

        if not query:
            return jsonify({"error": "O parâmetro 'query' é obrigatório."}), 400

        tmdb_client = TmdbClient()
        return jsonify(tmdb_client.search_movies(query=query, page=page))

    @app.get("/api/movies/<int:movie_id>")
    def movie_details(movie_id: int):
        tmdb_client = TmdbClient()
        movie = tmdb_client.get_movie_details(movie_id)
        rating = Rating.query.filter_by(movie_id=movie_id).first()

        return jsonify(
            {
                **movie,
                "user_rating": rating.rating if rating else None,
            }
        )

    @app.get("/api/ratings")
    def list_ratings():
        tmdb_client = TmdbClient()
        ratings = Rating.query.order_by(Rating.updated_at.desc()).all()
        items = []

        for rating in ratings:
            movie = tmdb_client.get_movie_summary(rating.movie_id)
            items.append(
                {
                    **movie,
                    "title": movie.get("title") or rating.movie_title,
                    "user_rating": rating.rating,
                    "rating_id": rating.id,
                    "movie_title": rating.movie_title,
                    "created_at": rating.created_at.isoformat(),
                    "updated_at": rating.updated_at.isoformat(),
                }
            )

        return jsonify({"results": items, "total": len(items)})

    @app.get("/api/ratings/<int:movie_id>")
    def get_rating(movie_id: int):
        rating = Rating.query.filter_by(movie_id=movie_id).first()
        if not rating:
            return jsonify({"error": "Avaliação não encontrada."}), 404

        return jsonify(rating.to_dict())

    @app.post("/api/ratings")
    def create_rating():
        payload = request.get_json(silent=True) or {}
        movie_id = payload.get("movie_id")
        score = payload.get("rating")
        movie_title = normalize_movie_title(payload.get("movie_title"))

        validation_error = validate_rating_payload(movie_id, score)
        if validation_error:
            return jsonify({"error": validation_error}), 400

        existing_rating = Rating.query.filter_by(movie_id=movie_id).first()
        if existing_rating:
            return jsonify({"error": "Esse filme já foi avaliado."}), 409

        resolved_movie_title = movie_title or get_movie_title(movie_id)
        rating = Rating(movie_id=movie_id,
                        movie_title=resolved_movie_title, rating=score)
        db.session.add(rating)
        db.session.commit()

        return jsonify(rating.to_dict()), 201

    @app.put("/api/ratings/<int:movie_id>")
    @app.patch("/api/ratings/<int:movie_id>")
    def update_rating(movie_id: int):
        payload = request.get_json(silent=True) or {}
        score = payload.get("rating")
        movie_title = normalize_movie_title(payload.get("movie_title"))

        validation_error = validate_rating_payload(
            movie_id, score, validate_movie_id=False)
        if validation_error:
            return jsonify({"error": validation_error}), 400

        rating = Rating.query.filter_by(movie_id=movie_id).first()
        if not rating:
            return jsonify({"error": "Avaliação não encontrada."}), 404

        rating.rating = score
        if movie_title:
            rating.movie_title = movie_title
        elif not rating.movie_title:
            rating.movie_title = get_movie_title(movie_id)
        db.session.commit()

        return jsonify(rating.to_dict())

    @app.delete("/api/ratings/<int:movie_id>")
    def delete_rating(movie_id: int):
        rating = Rating.query.filter_by(movie_id=movie_id).first()
        if not rating:
            return jsonify({"error": "Avaliação não encontrada."}), 404

        db.session.delete(rating)
        db.session.commit()

        return "", 204


def register_error_handlers(app: Flask) -> None:
    @app.errorhandler(TmdbClientError)
    def handle_tmdb_error(error: TmdbClientError):
        status_code = error.status_code if 400 <= error.status_code < 600 else 502
        return jsonify({"error": str(error)}), status_code

    @app.errorhandler(404)
    def handle_not_found(_error):
        return jsonify({"error": "Rota não encontrada."}), 404

    @app.errorhandler(500)
    def handle_internal_server_error(_error):
        db.session.rollback()
        return jsonify({"error": "Erro interno do servidor."}), 500


def ensure_rating_schema() -> None:
    inspector = inspect(db.engine)
    columns = {column["name"] for column in inspector.get_columns("ratings")}

    if "movie_title" not in columns:
        db.session.execute(
            text("ALTER TABLE ratings ADD COLUMN movie_title VARCHAR(255)"))
        db.session.commit()


def normalize_movie_title(value) -> str | None:
    if not isinstance(value, str):
        return None

    normalized_value = value.strip()
    return normalized_value or None


def get_movie_title(movie_id: int) -> str | None:
    tmdb_client = TmdbClient()
    movie_summary = tmdb_client.get_movie_summary(movie_id)
    return normalize_movie_title(movie_summary.get("title"))


def validate_rating_payload(movie_id, score, validate_movie_id: bool = True):
    if validate_movie_id and (not isinstance(movie_id, int) or movie_id <= 0):
        return "'movie_id' deve ser um inteiro positivo."

    if not isinstance(score, int) or not 1 <= score <= 5:
        return "'rating' deve ser um inteiro entre 1 e 5."

    return None


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True)
