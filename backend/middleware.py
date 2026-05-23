import time
import logging
import jwt
import os
from datetime import datetime
from sanic import Request, HTTPResponse
from sanic.response import json
import functools

JWT_SECRET = os.getenv('JWT_SECRET')
JWT_ALGORITHM = 'HS256'

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(message)s',
    handlers=[
        logging.FileHandler(f'app_{datetime.now().strftime("%Y%m%d")}.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

async def logging_middleware(request: Request, handler):
    """Global logging middleware"""
    start_time = time.time()
    client_ip = request.remote_addr or request.ip

    try:
        response = await handler(request)
        status_code = response.status
    except Exception as e:
        status_code = 500
        raise e
    finally:
        duration = int((time.time() - start_time) * 1000)
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

        log_message = f"[{timestamp}] {request.method} {request.path} - {client_ip} - STATUS {status_code} - {duration}ms"
        logger.info(log_message)

    return response

def api_response(code: int, message: str, data=None):
    """Unified API response format"""
    return json({
        'code': code,
        'message': message,
        'data': data
    }, status=code)

class APIException(Exception):
    """Custom API exception"""
    def __init__(self, code: int, message: str):
        self.code = code
        self.message = message
        super().__init__(self.message)

async def exception_handler(request: Request, exception):
    """Global exception handler"""
    if isinstance(exception, APIException):
        return api_response(exception.code, exception.message)

    # Log unexpected errors
    logger.error(f"Unexpected error: {str(exception)}")
    return api_response(500, "服务器内部错误")

def validate_json(*required_fields):
    """Decorator to validate JSON payload"""
    def decorator(f):
        @functools.wraps(f)
        async def decorated_function(request: Request, *args, **kwargs):
            if not request.json:
                raise APIException(400, "请求体必须为JSON格式")

            for field in required_fields:
                if field not in request.json:
                    raise APIException(400, f"缺少必需字段: {field}")

            return await f(request, *args, **kwargs)
        return decorated_function
    return decorator

def authorized():
    """Decorator to check JWT authorization"""
    def decorator(f):
        @functools.wraps(f)
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