from data.models import Rating


def to_rating_response(rating: Rating) -> dict:
    return rating.to_dict()


def to_rated_movie_item(movie: dict, rating: Rating) -> dict:
    return {
        **movie,
        "title": movie.get("title") or rating.movie_title,
        "user_rating": rating.rating,
        "rating_id": rating.id,
        "movie_title": rating.movie_title,
        "created_at": rating.created_at.isoformat(),
        "updated_at": rating.updated_at.isoformat(),
    }
