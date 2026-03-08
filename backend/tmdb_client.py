from math import ceil
from typing import Any

import requests
from flask import current_app


class TmdbClientError(Exception):
    def __init__(self, message: str, status_code: int = 502) -> None:
        super().__init__(message)
        self.status_code = status_code


class TmdbClient:
    TMDB_PAGE_SIZE = 20
    APP_PAGE_SIZE = 30

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

    def _get_paginated_movies(self, path: str, page: int = 1, **params: Any) -> dict[str, Any]:
        normalized_page = max(page, 1)
        start_index = (normalized_page - 1) * self.APP_PAGE_SIZE
        start_tmdb_page = (start_index // self.TMDB_PAGE_SIZE) + 1
        start_offset = start_index % self.TMDB_PAGE_SIZE

        payload = self._request(path, page=start_tmdb_page, **params)
        total_results = payload.get("total_results", 0)
        tmdb_total_pages = payload.get("total_pages", 0)

        collected_movies = list(payload.get("results", []))[start_offset:]
        current_tmdb_page = start_tmdb_page

        while len(collected_movies) < self.APP_PAGE_SIZE and current_tmdb_page < tmdb_total_pages:
            current_tmdb_page += 1
            next_payload = self._request(
                path, page=current_tmdb_page, **params)
            collected_movies.extend(next_payload.get("results", []))

        total_pages = ceil(
            total_results / self.APP_PAGE_SIZE) if total_results else 0

        return {
            "page": normalized_page,
            "total_pages": total_pages,
            "total_results": total_results,
            "results": [
                self._normalize_movie_summary(movie)
                for movie in collected_movies[: self.APP_PAGE_SIZE]
            ],
        }

    def search_movies(self, query: str, page: int = 1, year: int | None = None) -> dict[str, Any]:
        params: dict[str, Any] = {"query": query, "include_adult": False}
        if year:
            params["year"] = year

        return self._get_paginated_movies(
            "/search/movie", page=page, **params
        )

    def get_popular_movies(
        self,
        page: int = 1,
        genre_id: int | None = None,
        year: int | None = None,
    ) -> dict[str, Any]:
        if genre_id or year:
            discover_params: dict[str, Any] = {
                "sort_by": "popularity.desc",
                "include_adult": False,
            }
            if genre_id:
                discover_params["with_genres"] = genre_id
            if year:
                discover_params["primary_release_year"] = year

            return self._get_paginated_movies("/discover/movie", page=page, **discover_params)

        return self._get_paginated_movies("/movie/popular", page=page)

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
