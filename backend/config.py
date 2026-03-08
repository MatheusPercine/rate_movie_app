import os


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key")
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL",
        "postgresql+psycopg://postgres:root@localhost:5432/ratedmovies",
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    TMDB_API_KEY = os.getenv("TMDB_API_KEY", "")
    TMDB_BASE_URL = os.getenv("TMDB_BASE_URL", "https://api.themoviedb.org/3")
    TMDB_IMAGE_BASE_URL = os.getenv(
        "TMDB_IMAGE_BASE_URL", "https://image.tmdb.org/t/p/w500"
    )
    TMDB_TIMEOUT_SECONDS = int(os.getenv("TMDB_TIMEOUT_SECONDS", "10"))
    TMDB_CACHE_TTL_SECONDS = int(os.getenv("TMDB_CACHE_TTL_SECONDS", "300"))
