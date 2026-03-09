from flask import Flask, jsonify

from application.exceptions import ApiError
from data.clients import TmdbClientError
from data.db import db


def register_error_handlers(app: Flask) -> None:
    @app.errorhandler(ApiError)
    def handle_api_error(error: ApiError):
        return jsonify({"error": error.message}), error.status_code

    @app.errorhandler(TmdbClientError)
    def handle_tmdb_error(error: TmdbClientError):
        status_code = error.status_code if 400 <= error.status_code < 600 else 502
        return jsonify({"error": str(error)}), status_code

    @app.errorhandler(404)
    def handle_not_found(_error):
        return jsonify({"error": "Rota não encontrada."}), 404

    @app.errorhandler(500)
    def handle_internal_server_error(_error):
        db.session.rollback()
        return jsonify({"error": "Erro interno do servidor."}), 500
