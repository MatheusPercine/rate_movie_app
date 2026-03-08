from app import create_app
from models import db


class FakeTmdbClient:
    last_search_args = None
    last_popular_args = None

    def search_movies(self, query: str, page: int = 1, year: int | None = None):
        FakeTmdbClient.last_search_args = {
            "query": query,
            "page": page,
            "year": year,
        }
        return {
            "page": page,
            "total_pages": 1,
            "total_results": 1,
            "results": [
                {
                    "id": 550,
                    "title": "Fight Club",
                    "poster_path": "/poster.jpg",
                    "poster_url": "https://image.tmdb.org/t/p/w500/poster.jpg",
                    "release_date": "1999-10-15",
                    "overview": "Overview",
                }
            ],
        }

    def get_popular_movies(self, page: int = 1, genre_id: int | None = None, year: int | None = None):
        FakeTmdbClient.last_popular_args = {
            "page": page,
            "genre_id": genre_id,
            "year": year,
        }
        return {
            "page": page,
            "total_pages": 3,
            "total_results": 60,
            "results": [
                {
                    "id": 680,
                    "title": "Pulp Fiction",
                    "poster_path": "/popular.jpg",
                    "poster_url": "https://image.tmdb.org/t/p/w500/popular.jpg",
                    "release_date": "1994-10-14",
                    "overview": "Popular overview",
                    "genre_ids": [80, 53],
                }
            ],
        }

    def get_movie_details(self, movie_id: int):
        return {
            "id": movie_id,
            "title": "Fight Club",
            "poster_path": "/poster.jpg",
            "poster_url": "https://image.tmdb.org/t/p/w500/poster.jpg",
            "overview": "Overview",
            "release_date": "1999-10-15",
            "genres": ["Drama"],
            "cast": [{"id": 1, "name": "Brad Pitt", "character": "Tyler Durden", "profile_path": None}],
        }

    def get_movie_summary(self, movie_id: int):
        return {
            "id": movie_id,
            "title": "Fight Club",
            "poster_path": "/poster.jpg",
            "poster_url": "https://image.tmdb.org/t/p/w500/poster.jpg",
            "release_date": "1999-10-15",
            "overview": "Overview",
        }


def create_test_client(monkeypatch):
    FakeTmdbClient.last_search_args = None
    FakeTmdbClient.last_popular_args = None

    app = create_app(
        {
            "TESTING": True,
            "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:",
        }
    )

    monkeypatch.setattr("app.TmdbClient", FakeTmdbClient)

    with app.app_context():
        db.drop_all()
        db.create_all()

    return app.test_client(), app


def test_create_and_get_rating(monkeypatch):
    client, _app = create_test_client(monkeypatch)

    response = client.post("/api/ratings", json={"movie_id": 550, "rating": 5})
    assert response.status_code == 201
    assert response.get_json()["rating"] == 5
    assert response.get_json()["movie_title"] == "Fight Club"

    response = client.get("/api/ratings/550")
    assert response.status_code == 200
    assert response.get_json()["movie_id"] == 550
    assert response.get_json()["movie_title"] == "Fight Club"


def test_empty_query_returns_popular_movies(monkeypatch):
    client, _app = create_test_client(monkeypatch)

    response = client.get("/api/movies/search")
    payload = response.get_json()

    assert response.status_code == 200
    assert payload["total_results"] == 60
    assert payload["results"][0]["title"] == "Pulp Fiction"
    assert payload["total_pages"] == 3


def test_empty_query_with_filters_uses_global_popular_filters(monkeypatch):
    client, _app = create_test_client(monkeypatch)

    response = client.get("/api/movies/search?genre_id=80&year=1994&page=2")
    payload = response.get_json()

    assert response.status_code == 200
    assert payload["results"][0]["title"] == "Pulp Fiction"
    assert FakeTmdbClient.last_popular_args == {
        "page": 2,
        "genre_id": 80,
        "year": 1994,
    }


def test_search_query_passes_year_filter_to_tmdb(monkeypatch):
    client, _app = create_test_client(monkeypatch)

    response = client.get("/api/movies/search?query=fight&year=1999&page=3")

    assert response.status_code == 200
    assert FakeTmdbClient.last_search_args == {
        "query": "fight",
        "page": 3,
        "year": 1999,
    }


def test_list_rated_movies(monkeypatch):
    client, _app = create_test_client(monkeypatch)
    client.post("/api/ratings", json={"movie_id": 550, "rating": 4})

    response = client.get("/api/ratings")
    payload = response.get_json()

    assert response.status_code == 200
    assert payload["total"] == 1
    assert payload["results"][0]["user_rating"] == 4
    assert payload["results"][0]["movie_title"] == "Fight Club"


def test_movie_details_includes_user_rating(monkeypatch):
    client, _app = create_test_client(monkeypatch)
    client.post("/api/ratings", json={"movie_id": 550, "rating": 3})

    response = client.get("/api/movies/550")
    payload = response.get_json()

    assert response.status_code == 200
    assert payload["user_rating"] == 3


def test_update_and_delete_rating(monkeypatch):
    client, _app = create_test_client(monkeypatch)
    client.post("/api/ratings", json={"movie_id": 550, "rating": 2})

    response = client.put("/api/ratings/550",
                          json={"rating": 5, "movie_title": "Clube da Luta"})
    assert response.status_code == 200
    assert response.get_json()["rating"] == 5
    assert response.get_json()["movie_title"] == "Clube da Luta"

    response = client.delete("/api/ratings/550")
    assert response.status_code == 204

    response = client.get("/api/ratings/550")
    assert response.status_code == 404
