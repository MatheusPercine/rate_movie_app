from sqlalchemy import inspect, text

from data.db import db


def ensure_rating_schema() -> None:
    inspector = inspect(db.engine)
    columns = {column["name"] for column in inspector.get_columns("ratings")}

    if "movie_title" not in columns:
        db.session.execute(
            text("ALTER TABLE ratings ADD COLUMN movie_title VARCHAR(255)"))
        db.session.commit()
