from flask import Flask

from api.controllers import home_blueprint, movie_blueprint, rating_blueprint


def register_blueprints(app: Flask) -> None:
    app.register_blueprint(home_blueprint)
    app.register_blueprint(movie_blueprint)
    app.register_blueprint(rating_blueprint)
