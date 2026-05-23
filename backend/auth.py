import bcrypt
from datetime import datetime, timedelta
from sanic import Blueprint, Request
from sanic.response import json
from sqlalchemy import select
import jwt
from middleware import api_response, APIException, validate_json, JWT_SECRET, JWT_ALGORITHM
from database import get_db
from models import User

auth_bp = Blueprint('auth', url_prefix='/api/auth')

ACCESS_TOKEN_EXPIRE_HOURS = 2

def create_access_token(data: dict):
    """Create JWT access token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against bcrypt hash"""
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def authorized():
    """Decorator to check JWT authorization"""
    def decorator(f):
        async def decorated_function(request: Request, *args, **kwargs):
            auth_header = request.headers.get('Authorization')
            if not auth_header or not auth_header.startswith('Bearer '):
                raise APIException(401, "未授权访问，请先登录")

            token = auth_header.split(' ')[1]
            try:
                payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
                request.ctx.user_id = payload.get('user_id')
                request.ctx.user_role = payload.get('role')
            except jwt.ExpiredSignatureError:
                raise APIException(401, "Token已过期，请重新登录")
            except jwt.InvalidTokenError:
                raise APIException(401, "无效的Token")

            return await f(request, *args, **kwargs)
        return decorated_function
    return decorator

@auth_bp.post('/login')
@validate_json('username', 'password')
async def login(request: Request):
    """User login endpoint"""
    username = request.json['username']
    password = request.json['password']

    async for session in get_db():
        result = await session.execute(
            select(User).where(User.username == username)
        )
        user = result.scalar_one_or_none()

        if not user or not verify_password(password, user.password):
            raise APIException(401, "用户名或密码错误")

        # Create JWT token
        access_token = create_access_token({
            "user_id": user.id,
            "username": user.username,
            "role": user.role
        })

        return api_response(200, "登录成功", {
            "token": access_token,
            "username": user.username,
            "role": user.role
        })