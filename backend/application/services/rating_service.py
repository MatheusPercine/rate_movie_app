from application.dtos import to_rated_movie_item, to_rating_response
from application.exceptions import ApiError
from data.clients import TmdbClient
from data.models import Rating
from data.repositories import RatingRepository
from domain.validations.rating_validation import normalize_movie_title, validate_rating_payload


class RatingService:
    def __init__(
        self,
        rating_repository: RatingRepository | None = None,
        tmdb_client: TmdbClient | None = None,
    ) -> None:
        self.rating_repository = rating_repository or RatingRepository()
        self.tmdb_client = tmdb_client or TmdbClient()

    def list_ratings(self) -> dict:
        ratings = self.rating_repository.list_all()
        items = []

        for rating in ratings:
            movie = self.tmdb_client.get_movie_summary(rating.movie_id)
            items.append(to_rated_movie_item(movie, rating))

        return {"results": items, "total": len(items)}

    def get_rating(self, movie_id: int) -> dict:
        rating = self.rating_repository.get_by_movie_id(movie_id)
        if not rating:
            raise ApiError("Avaliação não encontrada.", 404)

        return to_rating_response(rating)

    def create_rating(self, payload: dict) -> tuple[dict, int]:
        movie_id = payload.get("movie_id")
        score = payload.get("rating")
        movie_title = normalize_movie_title(payload.get("movie_title"))

        validation_error = validate_rating_payload(movie_id, score)
        if validation_error:
            raise ApiError(validation_error, 400)

        existing_rating = self.rating_repository.get_by_movie_id(movie_id)
        if existing_rating:
            raise ApiError("Esse filme já foi avaliado.", 409)

        resolved_movie_title = movie_title or self._get_movie_title(movie_id)
        rating = Rating(movie_id=movie_id,
                        movie_title=resolved_movie_title, rating=score)
        self.rating_repository.add(rating)

        return to_rating_response(rating), 201

    def update_rating(self, movie_id: int, payload: dict) -> dict:
        score = payload.get("rating")
        movie_title = normalize_movie_title(payload.get("movie_title"))

        validation_error = validate_rating_payload(
            movie_id,
            score,
            validate_movie_id=False,
        )
        if validation_error:
            raise ApiError(validation_error, 400)

        rating = self.rating_repository.get_by_movie_id(movie_id)
        if not rating:
            raise ApiError("Avaliação não encontrada.", 404)

        rating.rating = score
        if movie_title:
            rating.movie_title = movie_title
        elif not rating.movie_title:
            rating.movie_title = self._get_movie_title(movie_id)

        self.rating_repository.save()
        return to_rating_response(rating)

    def delete_rating(self, movie_id: int) -> None:
        rating = self.rating_repository.get_by_movie_id(movie_id)
        if not rating:
            raise ApiError("Avaliação não encontrada.", 404)

        self.rating_repository.delete(rating)

    def _get_movie_title(self, movie_id: int) -> str | None:
        movie_summary = self.tmdb_client.get_movie_summary(movie_id)
        return normalize_movie_title(movie_summary.get("title"))
