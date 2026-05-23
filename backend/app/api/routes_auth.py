import jwt
from fastapi import APIRouter, Depends, Header, HTTPException, status

from app.core.db import PlanRepository, get_repository
from app.core.logging import get_logger
from app.core.security import create_access_token, decode_access_token, hash_password, verify_password
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UserResponse

router = APIRouter(prefix="/api/auth", tags=["auth"])
logger = get_logger("api.auth")


def _parse_bearer(authorization: str | None = Header(default=None)) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    token = authorization.removeprefix("Bearer ")
    try:
        return decode_access_token(token)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired")
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(
    req: RegisterRequest,
    repo: PlanRepository = Depends(get_repository),
) -> TokenResponse:
    if await repo.get_user_by_email(req.email):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")
    hashed = hash_password(req.password)
    user_id = await repo.create_user(req.email, hashed)
    token = create_access_token(user_id, req.email)
    logger.info("user_registered id=%s", user_id)
    return TokenResponse(access_token=token, email=req.email)


@router.post("/login", response_model=TokenResponse)
async def login(
    req: LoginRequest,
    repo: PlanRepository = Depends(get_repository),
) -> TokenResponse:
    user = await repo.get_user_by_email(req.email)
    if not user or not verify_password(req.password, user["hashed_password"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    token = create_access_token(user["id"], user["email"])
    logger.info("user_login id=%s", user["id"])
    return TokenResponse(access_token=token, email=user["email"])


@router.get("/me", response_model=UserResponse)
async def me(
    token_data: dict = Depends(_parse_bearer),
    repo: PlanRepository = Depends(get_repository),
) -> UserResponse:
    user = await repo.get_user_by_id(token_data["sub"])
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return UserResponse(id=user["id"], email=user["email"])
