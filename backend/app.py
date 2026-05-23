from sanic import Sanic
from sanic.response import text
from middleware import exception_handler, logger
from auth import auth_bp
from employees import employees_bp
from categories_devices import categories_devices_bp
from database import init_db
import time
from datetime import datetime

app = Sanic("ContestApp")

# Register blueprints
app.blueprint(auth_bp)
app.blueprint(employees_bp)
app.blueprint(categories_devices_bp)

# Register exception handlers
app.error_handler.add(Exception, exception_handler)

# Register logging middleware
@app.middleware('request')
async def log_request(request):
    start_time = time.time()
    request.ctx.start_time = start_time

@app.middleware('response')
async def log_response(request, response):
    start_time = getattr(request.ctx, 'start_time', time.time())
    duration = int((time.time() - start_time) * 1000)
    client_ip = request.remote_addr or request.ip
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

    status_code = response.status if hasattr(response, 'status') else 500
    log_message = f"[{timestamp}] {request.method} {request.path} - {client_ip} - STATUS {status_code} - {duration}ms"
    logger.info(log_message)

# Health check endpoint
@app.get("/health")
async def health_check(request):
    return text("OK")

@app.listener('before_server_start')
async def setup_db(app, loop):
    """Initialize database before server starts"""
    await init_db()
    print("Database initialized successfully!")

if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=8000,
        debug=True,
        auto_reload=True
    )