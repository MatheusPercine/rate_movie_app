from flask import Blueprint, jsonify, request

from application.services import RatingService

rating_blueprint = Blueprint("ratings", __name__)


@rating_blueprint.get("/api/ratings")
def list_ratings():
    service = RatingService()
    return jsonify(service.list_ratings())


@rating_blueprint.get("/api/ratings/<int:movie_id>")
def get_rating(movie_id: int):
    service = RatingService()
    return jsonify(service.get_rating(movie_id))


@rating_blueprint.post("/api/ratings")
def create_rating():
    service = RatingService()
    payload = request.get_json(silent=True) or {}
    response, status_code = service.create_rating(payload)
    return jsonify(response), status_code


@rating_blueprint.put("/api/ratings/<int:movie_id>")
@rating_blueprint.patch("/api/ratings/<int:movie_id>")
def update_rating(movie_id: int):
    service = RatingService()
    payload = request.get_json(silent=True) or {}
    return jsonify(service.update_rating(movie_id, payload))


@rating_blueprint.delete("/api/ratings/<int:movie_id>")
def delete_rating(movie_id: int):
    service = RatingService()
    service.delete_rating(movie_id)
    return "", 204
