import os
from pathlib import Path

from dotenv import load_dotenv
from flask import Flask
from flask_cors import CORS

from api import register_blueprints
from api.error_handlers import register_error_handlers
from config import Config
from data.clients import TmdbClient, TmdbClientError
from data.db import db
from data.schema import ensure_rating_schema


load_dotenv()


def create_app(config_overrides: dict | None = None) -> Flask:
    app = Flask(__name__)
    app.config.from_object(Config)
    if config_overrides:
        app.config.update(config_overrides)

    instance_path = Path(app.instance_path)
    instance_path.mkdir(parents=True, exist_ok=True)

    db.init_app(app)
    CORS(app)

    with app.app_context():
        db.create_all()
        ensure_rating_schema()

    register_blueprints(app)
    register_error_handlers(app)

    return app


if __name__ == "__main__":
    app = create_app()
    debug = os.getenv("FLASK_DEBUG", "1") == "1"
    host = os.getenv("FLASK_RUN_HOST", "127.0.0.1")
    port = int(os.getenv("FLASK_RUN_PORT", "5000"))
    app.run(host=host, port=port, debug=debug)
