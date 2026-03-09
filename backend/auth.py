from datetime import datetime, timedelta, timezone
from functools import wraps

import jwt
from flask import current_app, request

from models import User


class AuthError(Exception):
    def __init__(self, message: str, status_code: int = 401) -> None:
        super().__init__(message)
        self.status_code = status_code


def create_access_token(user: User) -> str:
    now = datetime.now(timezone.utc)
    expires_at = now + \
        timedelta(hours=current_app.config["JWT_EXPIRATION_HOURS"])

    payload = {
        "sub": str(user.id),
        "email": user.email,
        "name": user.name,
        "iat": int(now.timestamp()),
        "exp": int(expires_at.timestamp()),
    }

    return jwt.encode(
        payload,
        current_app.config["SECRET_KEY"],
        algorithm=current_app.config["JWT_ALGORITHM"],
    )


def decode_access_token(token: str) -> dict:
    try:
        return jwt.decode(
            token,
            current_app.config["SECRET_KEY"],
            algorithms=[current_app.config["JWT_ALGORITHM"]],
        )
    except jwt.ExpiredSignatureError as exc:
        raise AuthError("Token expirado.") from exc
    except jwt.InvalidTokenError as exc:
        raise AuthError("Token inválido.") from exc


def extract_bearer_token() -> str | None:
    auth_header = request.headers.get("Authorization", "")
    scheme, _, token = auth_header.partition(" ")

    if scheme.lower() != "bearer" or not token:
        return None

    return token.strip()


def get_current_user(optional: bool = False) -> User | None:
    token = extract_bearer_token()
    if not token:
        if optional:
            return None
        raise AuthError("Token de autenticação não informado.")

    payload = decode_access_token(token)
    user_id = payload.get("sub")

    try:
        normalized_user_id = int(user_id)
    except (TypeError, ValueError) as exc:
        raise AuthError("Token inválido.") from exc

    user = db_session_get_user(normalized_user_id)
    if not user:
        raise AuthError("Usuário autenticado não encontrado.")

    return user


def db_session_get_user(user_id: int) -> User | None:
    return User.query.filter_by(id=user_id).first()


def auth_required(view_func):
    @wraps(view_func)
    def wrapper(*args, **kwargs):
        current_user = get_current_user()
        return view_func(current_user, *args, **kwargs)

    return wrapper
