def normalize_movie_title(value) -> str | None:
    if not isinstance(value, str):
        return None

    normalized_value = value.strip()
    return normalized_value or None


def validate_rating_payload(movie_id, score, validate_movie_id: bool = True):
    if validate_movie_id and (not isinstance(movie_id, int) or movie_id <= 0):
        return "'movie_id' deve ser um inteiro positivo."

    if not isinstance(score, int) or not 1 <= score <= 5:
        return "'rating' deve ser um inteiro entre 1 e 5."

    return None
