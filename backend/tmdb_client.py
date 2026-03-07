from typing import Any

import requests
from flask import current_app


class TmdbClientError(Exception):
    def __init__(self, message: str, status_code: int = 502) -> None:
        super().__init__(message)
        self.status_code = status_code


class TmdbClient:
    def __init__(self) -> None:
        self.base_url = current_app.config["TMDB_BASE_URL"]
        self.api_key = current_app.config["TMDB_API_KEY"]
        self.timeout = current_app.config["TMDB_TIMEOUT_SECONDS"]
        self.image_base_url = current_app.config["TMDB_IMAGE_BASE_URL"]

    def _request(self, path: str, **params: Any) -> dict[str, Any]:
        if not self.api_key:
            raise TmdbClientError(
                "TMDB_API_KEY is not configured.", status_code=500)

        url = f"{self.base_url}{path}"
        response = requests.get(
            url,
            params={"api_key": self.api_key, "language": "pt-BR", **params},
            timeout=self.timeout,
        )

        if response.status_code >= 400:
            try:
                payload = response.json()
                message = payload.get("status_message", "TMDB request failed.")
            except ValueError:
                message = "TMDB request failed."
            raise TmdbClientError(message, status_code=response.status_code)

        return response.json()

    def _normalize_movie_summary(self, movie: dict[str, Any]) -> dict[str, Any]:
        poster_path = movie.get("poster_path")
        return {
            "id": movie.get("id"),
            "title": movie.get("title"),
            "poster_path": poster_path,
            "poster_url": f"{self.image_base_url}{poster_path}" if poster_path else None,
            "release_date": movie.get("release_date"),
            "overview": movie.get("overview"),
            "genre_ids": movie.get("genre_ids", []),
        }

    def search_movies(self, query: str, page: int = 1) -> dict[str, Any]:
        payload = self._request(
            "/search/movie", query=query, page=page, include_adult=False)
        return {
            "page": payload.get("page", page),
            "total_pages": payload.get("total_pages", 0),
            "total_results": payload.get("total_results", 0),
            "results": [self._normalize_movie_summary(movie) for movie in payload.get("results", [])],
        }

    def get_movie_details(self, movie_id: int) -> dict[str, Any]:
        payload = self._request(
            f"/movie/{movie_id}", append_to_response="credits")
        credits = payload.get("credits", {})
        poster_path = payload.get("poster_path")

        return {
            "id": payload.get("id"),
            "title": payload.get("title"),
            "poster_path": poster_path,
            "poster_url": f"{self.image_base_url}{poster_path}" if poster_path else None,
            "overview": payload.get("overview"),
            "release_date": payload.get("release_date"),
            "genres": [genre.get("name") for genre in payload.get("genres", [])],
            "cast": [
                {
                    "id": person.get("id"),
                    "name": person.get("name"),
                    "character": person.get("character"),
                    "profile_path": person.get("profile_path"),
                }
                for person in credits.get("cast", [])[:10]
            ],
        }

    def get_movie_summary(self, movie_id: int) -> dict[str, Any]:
        payload = self._request(f"/movie/{movie_id}")
        return self._normalize_movie_summary(payload)
