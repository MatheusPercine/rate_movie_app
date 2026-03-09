from data.db import db
from data.models import Rating


class RatingRepository:
    def list_all(self) -> list[Rating]:
        return Rating.query.order_by(Rating.updated_at.desc()).all()

    def get_by_movie_id(self, movie_id: int) -> Rating | None:
        return Rating.query.filter_by(movie_id=movie_id).first()

    def add(self, rating: Rating) -> Rating:
        db.session.add(rating)
        db.session.commit()
        return rating

    def save(self) -> None:
        db.session.commit()

    def delete(self, rating: Rating) -> None:
        db.session.delete(rating)
        db.session.commit()
