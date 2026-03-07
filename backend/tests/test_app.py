from app import create_app
from models import db


class FakeTmdbClient:
    def search_movies(self, query: str, page: int = 1):
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
