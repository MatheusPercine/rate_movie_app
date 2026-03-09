import os
from pathlib import Path

from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv
from sqlalchemy import inspect, text
from werkzeug.security import check_password_hash, generate_password_hash

from auth import AuthError, auth_required, create_access_token, get_current_user
from config import Config
from models import Rating, User, db
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
        ensure_database_schema()

    register_routes(app)
    register_error_handlers(app)

    return app


def register_routes(app: Flask) -> None:
    @app.get("/")
    def home():
        return {
            "message": "API do Rate Movie App funcionando",
            "endpoints": {
                "register": "/api/auth/register",
                "login": "/api/auth/login",
                "me": "/api/auth/me",
                "search_movies": "/api/movies/search?query=<nome>&page=1",
                "movie_details": "/api/movies/<movie_id>",
                "ratings": "/api/ratings",
                "rating_by_movie": "/api/ratings/<movie_id>",
            },
        }

    @app.post("/api/auth/register")
    def register_user():
        payload = request.get_json(silent=True) or {}
        name = normalize_name(payload.get("name"))
        email = normalize_email(payload.get("email"))
        password = payload.get("password")

        validation_error = validate_register_payload(name, email, password)
        if validation_error:
            return jsonify({"error": validation_error}), 400

        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            return jsonify({"error": "Já existe um usuário com esse e-mail."}), 409

        user = User(
            name=name,
            email=email,
            password_hash=generate_password_hash(password),
        )
        db.session.add(user)
        db.session.commit()

        return jsonify({"token": create_access_token(user), "user": user.to_dict()}), 201

    @app.post("/api/auth/login")
    def login_user():
        payload = request.get_json(silent=True) or {}
        email = normalize_email(payload.get("email"))
        password = payload.get("password")

        validation_error = validate_login_payload(email, password)
        if validation_error:
            return jsonify({"error": validation_error}), 400

        user = User.query.filter_by(email=email).first()
        if not user or not check_password_hash(user.password_hash, password):
            return jsonify({"error": "E-mail ou senha inválidos."}), 401

        return jsonify({"token": create_access_token(user), "user": user.to_dict()})

    @app.get("/api/auth/me")
    @auth_required
    def me(current_user: User):
        return jsonify(current_user.to_dict())

    @app.get("/api/health")
    def health_check():
        return {"status": "ok"}

    @app.get("/api/movies/search")
    def search_movies():
        query = request.args.get("query", "").strip()
        page = request.args.get("page", default=1, type=int)
        genre_id = request.args.get("genre_id", default=None, type=int)
        year = request.args.get("year", default=None, type=int)

        tmdb_client = TmdbClient()
        if not query:
            return jsonify(
                tmdb_client.get_popular_movies(
                    page=page,
                    genre_id=genre_id,
                    year=year,
                )
            )

        return jsonify(tmdb_client.search_movies(query=query, page=page, year=year))

    @app.get("/api/movies/<int:movie_id>")
    def movie_details(movie_id: int):
        tmdb_client = TmdbClient()
        movie = tmdb_client.get_movie_details(movie_id)
        current_user = get_current_user(optional=True)
        rating = None
        if current_user:
            rating = Rating.query.filter_by(
                movie_id=movie_id, user_id=current_user.id).first()

        return jsonify(
            {
                **movie,
                "user_rating": rating.rating if rating else None,
            }
        )

    @app.get("/api/ratings")
    @auth_required
    def list_ratings(current_user: User):
        tmdb_client = TmdbClient()
        ratings = Rating.query.filter_by(user_id=current_user.id).order_by(
            Rating.updated_at.desc()).all()
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
    @auth_required
    def get_rating(current_user: User, movie_id: int):
        rating = Rating.query.filter_by(
            movie_id=movie_id, user_id=current_user.id).first()
        if not rating:
            return jsonify({"error": "Avaliação não encontrada."}), 404

        return jsonify(rating.to_dict())

    @app.post("/api/ratings")
    @auth_required
    def create_rating(current_user: User):
        payload = request.get_json(silent=True) or {}
        movie_id = payload.get("movie_id")
        score = payload.get("rating")
        movie_title = normalize_movie_title(payload.get("movie_title"))

        validation_error = validate_rating_payload(movie_id, score)
        if validation_error:
            return jsonify({"error": validation_error}), 400

        existing_rating = Rating.query.filter_by(
            movie_id=movie_id, user_id=current_user.id).first()
        if existing_rating:
            return jsonify({"error": "Esse filme já foi avaliado."}), 409

        resolved_movie_title = movie_title or get_movie_title(movie_id)
        rating = Rating(user_id=current_user.id,
                        movie_id=movie_id,
                        movie_title=resolved_movie_title, rating=score)
        db.session.add(rating)
        db.session.commit()

        return jsonify(rating.to_dict()), 201

    @app.put("/api/ratings/<int:movie_id>")
    @app.patch("/api/ratings/<int:movie_id>")
    @auth_required
    def update_rating(current_user: User, movie_id: int):
        payload = request.get_json(silent=True) or {}
        score = payload.get("rating")
        movie_title = normalize_movie_title(payload.get("movie_title"))

        validation_error = validate_rating_payload(
            movie_id, score, validate_movie_id=False)
        if validation_error:
            return jsonify({"error": validation_error}), 400

        rating = Rating.query.filter_by(
            movie_id=movie_id, user_id=current_user.id).first()
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
    @auth_required
    def delete_rating(current_user: User, movie_id: int):
        rating = Rating.query.filter_by(
            movie_id=movie_id, user_id=current_user.id).first()
        if not rating:
            return jsonify({"error": "Avaliação não encontrada."}), 404

        db.session.delete(rating)
        db.session.commit()

        return "", 204


def register_error_handlers(app: Flask) -> None:
    @app.errorhandler(AuthError)
    def handle_auth_error(error: AuthError):
        return jsonify({"error": str(error)}), error.status_code

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


def ensure_database_schema() -> None:
    inspector = inspect(db.engine)
    table_names = set(inspector.get_table_names())

    if "ratings" in table_names:
        columns = {column["name"]
                   for column in inspector.get_columns("ratings")}

        if "movie_title" not in columns:
            db.session.execute(
                text("ALTER TABLE ratings ADD COLUMN movie_title VARCHAR(255)"))
            db.session.commit()

        if "user_id" not in columns:
            db.session.execute(
                text("ALTER TABLE ratings ADD COLUMN user_id INTEGER"))
            db.session.commit()

        if db.engine.dialect.name == "postgresql":
            unique_constraints = inspector.get_unique_constraints("ratings")
            has_user_movie_constraint = False

            for constraint in unique_constraints:
                column_names = constraint.get("column_names", [])
                constraint_name = constraint.get("name")

                if column_names == ["movie_id"] and constraint_name:
                    db.session.execute(
                        text(
                            f'ALTER TABLE ratings DROP CONSTRAINT IF EXISTS "{constraint_name}"')
                    )
                    db.session.commit()

                if column_names == ["user_id", "movie_id"]:
                    has_user_movie_constraint = True

            if not has_user_movie_constraint:
                db.session.execute(
                    text(
                        "ALTER TABLE ratings ADD CONSTRAINT uq_ratings_user_movie UNIQUE (user_id, movie_id)"
                    )
                )
                db.session.commit()


def normalize_movie_title(value) -> str | None:
    if not isinstance(value, str):
        return None

    normalized_value = value.strip()
    return normalized_value or None


def normalize_name(value) -> str | None:
    if not isinstance(value, str):
        return None

    normalized_value = value.strip()
    return normalized_value or None


def normalize_email(value) -> str | None:
    if not isinstance(value, str):
        return None

    normalized_value = value.strip().lower()
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


def validate_register_payload(name, email, password):
    if not name:
        return "'name' é obrigatório."

    if not email or "@" not in email:
        return "'email' deve ser um e-mail válido."

    if not isinstance(password, str) or len(password) < 6:
        return "'password' deve ter pelo menos 6 caracteres."

    return None


def validate_login_payload(email, password):
    if not email or "@" not in email:
        return "'email' deve ser um e-mail válido."

    if not isinstance(password, str) or not password:
        return "'password' é obrigatório."

    return None


if __name__ == "__main__":
    app = create_app()
    debug = os.getenv("FLASK_DEBUG", "1") == "1"
    host = os.getenv("FLASK_RUN_HOST", "127.0.0.1")
    port = int(os.getenv("FLASK_RUN_PORT", "5000"))
    app.run(host=host, port=port, debug=debug)
