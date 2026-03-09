from data.clients import TmdbClient
from data.repositories import RatingRepository


class MovieService:
    def __init__(
        self,
        tmdb_client: TmdbClient | None = None,
        rating_repository: RatingRepository | None = None,
    ) -> None:
        self.tmdb_client = tmdb_client or TmdbClient()
        self.rating_repository = rating_repository or RatingRepository()

    def search_movies(
        self,
        query: str,
        page: int = 1,
        genre_id: int | None = None,
        year: int | None = None,
    ) -> dict:
        if not query:
            return self.tmdb_client.get_popular_movies(
                page=page,
                genre_id=genre_id,
                year=year,
            )

        return self.tmdb_client.search_movies(query=query, page=page, year=year)

    def get_movie_details(self, movie_id: int) -> dict:
        movie = self.tmdb_client.get_movie_details(movie_id)
        rating = self.rating_repository.get_by_movie_id(movie_id)
        return {
            **movie,
            "user_rating": rating.rating if rating else None,
        }
