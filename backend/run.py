# =============================================================
# run.py — Flask application entry point (FIXED)
# =============================================================
import os
 
# Force set environment variables BEFORE creating app
os.environ['JWT_SECRET_KEY'] = 'recruitke-super-secret-jwt-key-2024-minimum-32-bytes-long'
os.environ['SECRET_KEY'] = 'recruitke-secret-key-2024-production'
os.environ['FLASK_ENV'] = 'development'
 
from app import create_app, db
 
app = create_app()
 
if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        print("✅ Database tables verified.")
        print("🚀 Starting AI Recruitment System API...")
        print("📍 Running on http://localhost:5000")
        print(f"🔑 JWT Secret: {app.config.get('JWT_SECRET_KEY')[:20]}...")
 
    app.run(
        host='0.0.0.0',
        port=5000,
        debug=True
    )