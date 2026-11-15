# =============================================================
# app/routes/admin.py — Admin endpoints (FIXED)
# =============================================================
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt
from app import db

admin_bp = Blueprint('admin', __name__)


@admin_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_stats():
    claims = get_jwt()
    if claims.get('role') != 'admin':
        return jsonify({'error': 'Admin only'}), 403
    from app.models import User, Job, Application, Company
    from sqlalchemy import func
    total_users        = User.query.count()
    total_companies    = Company.query.count()
    total_jobs         = Job.query.count()
    total_applications = Application.query.count()
    active_jobs        = Job.query.filter_by(status='active').count()
    status_counts = db.session.query(
        Application.status, func.count(Application.id)
    ).group_by(Application.status).all()
    by_status = {s: c for s, c in status_counts}
    from datetime import datetime, timedelta
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    recent_apps = Application.query.filter(Application.applied_at >= thirty_days_ago).count()
    top_companies = db.session.query(
        Company.name, func.count(Job.id).label('job_count')
    ).join(Job).group_by(Company.id).order_by(func.count(Job.id).desc()).limit(5).all()
    return jsonify({
        'totals': {
            'users': total_users, 'companies': total_companies,
            'jobs': total_jobs, 'applications': total_applications,
            'active_jobs': active_jobs,
        },
        'applications_by_status': by_status,
        'recent_applications_30d': recent_apps,
        'top_companies': [{'name': n, 'jobs': c} for n, c in top_companies],
    }), 200


@admin_bp.route('/users', methods=['GET'])
@jwt_required()
def list_users():
    claims = get_jwt()
    if claims.get('role') != 'admin':
        return jsonify({'error': 'Admin only'}), 403
    from app.models import User
    users = User.query.order_by(User.created_at.desc()).all()
    return jsonify({'users': [u.to_dict() for u in users]}), 200


@admin_bp.route('/companies', methods=['GET'])
@jwt_required()
def list_companies():
    claims = get_jwt()
    if claims.get('role') != 'admin':
        return jsonify({'error': 'Admin only'}), 403
    from app.models import Company
    companies = Company.query.all()
    return jsonify({'companies': [c.to_dict() for c in companies]}), 200


@admin_bp.route('/companies', methods=['POST'])
@jwt_required()
def create_company():
    claims = get_jwt()
    if claims.get('role') != 'admin':
        return jsonify({'error': 'Admin only'}), 403
    from app.models import Company
    data = request.get_json()
    if not data.get('name'):
        return jsonify({'error': 'Company name is required'}), 400
    company = Company(
        name=data['name'], industry=data.get('industry'),
        description=data.get('description'), website=data.get('website'),
        location=data.get('location', 'Nairobi, Kenya'),
        size_range=data.get('size_range'),
    )
    db.session.add(company)
    db.session.commit()
    return jsonify({'message': 'Company created', 'company': company.to_dict()}), 201