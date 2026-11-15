# =============================================================
# app/__init__.py — Flask Application Factory (FIXED)
# =============================================================
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from flask_migrate import Migrate
import os
 
db = SQLAlchemy()
jwt = JWTManager()
bcrypt = Bcrypt()
migrate = Migrate()
 
 
def create_app(config_name=None):
    app = Flask(__name__)
 
    from app.config import config
    env = config_name or os.getenv('FLASK_ENV', 'development')
    app.config.from_object(config[env])
 
    # Force a strong JWT secret key regardless of .env
    app.config['JWT_SECRET_KEY'] = 'recruitke-super-secret-jwt-key-2024-minimum-32-bytes-long'
    app.config['JWT_ALGORITHM'] = 'HS256'
 
    db.init_app(app)
    jwt.init_app(app)
    bcrypt.init_app(app)
    migrate.init_app(app, db)
 
    # Wide-open CORS for development
    CORS(app, resources={
        r"/api/*": {
            "origins": "*",
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
            "allow_headers": ["Content-Type", "Authorization", "X-Requested-With"]
        }
    })
 
    upload_path = os.path.join(os.getcwd(), app.config.get('UPLOAD_FOLDER', 'uploads/cvs'))
    os.makedirs(upload_path, exist_ok=True)
 
    from app.routes.auth import auth_bp
    from app.routes.jobs import jobs_bp
    from app.routes.applications import applications_bp
    from app.routes.ai_analysis import ai_bp
    from app.routes.admin import admin_bp
 
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(jobs_bp, url_prefix='/api/jobs')
    app.register_blueprint(applications_bp, url_prefix='/api/applications')
    app.register_blueprint(ai_bp, url_prefix='/api/ai')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
 
    @jwt.unauthorized_loader
    def unauthorized_callback(error):
        return {'error': 'Missing or invalid token'}, 401
 
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return {'error': 'Token has expired'}, 401
 
    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return {'error': 'Invalid token', 'details': str(error)}, 422
 
    @app.errorhandler(404)
    def not_found(e):
        return {'error': 'Resource not found'}, 404
 
    @app.errorhandler(500)
    def server_error(e):
        return {'error': 'Internal server error'}, 500
 
    @app.route('/api/health')
    def health():
        return {'status': 'ok', 'message': 'AI Recruitment API is running'}, 200
 
    return app
 