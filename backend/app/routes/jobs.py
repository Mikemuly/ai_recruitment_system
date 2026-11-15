# =============================================================
# app/routes/jobs.py — Job posting endpoints (FIXED v2)
# =============================================================
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app import db
from app.models import Job, Application, User, Company
from datetime import datetime, date

jobs_bp = Blueprint('jobs', __name__)


@jobs_bp.route('', methods=['GET'])
def list_jobs():
    query = Job.query.filter_by(status='active')

    if request.args.get('title'):
        query = query.filter(Job.title.ilike(f"%{request.args['title']}%"))
    if request.args.get('location'):
        query = query.filter(Job.location.ilike(f"%{request.args['location']}%"))
    if request.args.get('job_type'):
        query = query.filter_by(job_type=request.args['job_type'])
    if request.args.get('company_id'):
        query = query.filter_by(company_id=request.args['company_id'])

    query = query.filter(
        (Job.application_deadline >= date.today()) |
        (Job.application_deadline == None)
    )

    page     = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 10))
    pagination = query.order_by(Job.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )

    for job in pagination.items:
        job.views_count = (job.views_count or 0) + 1
    db.session.commit()

    return jsonify({
        'jobs':         [job.to_dict() for job in pagination.items],
        'total':        pagination.total,
        'pages':        pagination.pages,
        'current_page': page,
        'per_page':     per_page,
    }), 200


@jobs_bp.route('/<int:job_id>', methods=['GET'])
def get_job(job_id):
    job = Job.query.get_or_404(job_id)
    return jsonify(job.to_dict()), 200


@jobs_bp.route('', methods=['POST'])
@jwt_required()
def create_job():
    claims = get_jwt()
    if claims.get('role') not in ('recruiter', 'admin'):
        return jsonify({'error': 'Only recruiters can post jobs'}), 403

    data    = request.get_json()
    user_id = int(get_jwt_identity())
    user    = User.query.get(user_id)

    required = ['title', 'description', 'requirements']
    for field in required:
        if not data.get(field):
            return jsonify({'error': f'{field} is required'}), 400

    company_id = data.get('company_id') or user.company_id
    if not company_id:
        return jsonify({'error': 'A company must be associated with this job'}), 400

    required_skills  = ','.join(data['required_skills'])  if isinstance(data.get('required_skills'),  list) else data.get('required_skills',  '')
    preferred_skills = ','.join(data['preferred_skills']) if isinstance(data.get('preferred_skills'), list) else data.get('preferred_skills', '')

    job = Job(
        title=data['title'],
        description=data['description'],
        requirements=data['requirements'],
        required_skills=required_skills,
        preferred_skills=preferred_skills,
        min_experience=data.get('min_experience', 0),
        max_experience=data.get('max_experience', 10),
        education_required=data.get('education_required', 'bachelor'),
        job_type=data.get('job_type', 'full-time'),
        salary_min=data.get('salary_min'),
        salary_max=data.get('salary_max'),
        location=data.get('location', 'Nairobi, Kenya'),
        company_id=company_id,
        posted_by=user_id,
        status=data.get('status', 'active'),
        application_deadline=datetime.strptime(
            data['application_deadline'], '%Y-%m-%d'
        ).date() if data.get('application_deadline') else None,
    )
    db.session.add(job)
    db.session.commit()

    return jsonify({'message': 'Job created successfully', 'job': job.to_dict()}), 201


@jobs_bp.route('/<int:job_id>', methods=['PUT'])
@jwt_required()
def update_job(job_id):
    job     = Job.query.get_or_404(job_id)
    user_id = int(get_jwt_identity())
    claims  = get_jwt()

    if claims.get('role') not in ('admin',) and job.posted_by != user_id:
        return jsonify({'error': 'You can only edit your own job postings'}), 403

    data = request.get_json()
    if 'title'           in data: job.title           = data['title']
    if 'description'     in data: job.description     = data['description']
    if 'requirements'    in data: job.requirements    = data['requirements']
    if 'required_skills' in data:
        job.required_skills  = ','.join(data['required_skills'])  if isinstance(data['required_skills'],  list) else data['required_skills']
    if 'preferred_skills' in data:
        job.preferred_skills = ','.join(data['preferred_skills']) if isinstance(data['preferred_skills'], list) else data['preferred_skills']
    if 'status' in data:
        job.status = data['status']
        if data['status'] == 'closed':
            job.closed_at = datetime.utcnow()
    if 'salary_min'            in data: job.salary_min            = data['salary_min']
    if 'salary_max'            in data: job.salary_max            = data['salary_max']
    if 'application_deadline'  in data:
        job.application_deadline = datetime.strptime(data['application_deadline'], '%Y-%m-%d').date()

    job.updated_at = datetime.utcnow()
    db.session.commit()
    return jsonify({'message': 'Job updated successfully', 'job': job.to_dict()}), 200


@jobs_bp.route('/<int:job_id>', methods=['DELETE'])
@jwt_required()
def delete_job(job_id):
    claims = get_jwt()
    if claims.get('role') != 'admin':
        return jsonify({'error': 'Only admins can delete jobs'}), 403
    job = Job.query.get_or_404(job_id)
    db.session.delete(job)
    db.session.commit()
    return jsonify({'message': 'Job deleted successfully'}), 200


@jobs_bp.route('/my', methods=['GET'])
@jwt_required()
def my_jobs():
    user_id = int(get_jwt_identity())
    claims  = get_jwt()
    if claims.get('role') not in ('recruiter', 'admin'):
        return jsonify({'error': 'Access denied'}), 403
    jobs = Job.query.filter_by(posted_by=user_id).order_by(Job.created_at.desc()).all()
    return jsonify({'jobs': [j.to_dict() for j in jobs]}), 200


@jobs_bp.route('/<int:job_id>/applicants', methods=['GET'])
@jwt_required()
def job_applicants(job_id):
    claims = get_jwt()
    if claims.get('role') not in ('recruiter', 'admin'):
        return jsonify({'error': 'Access denied'}), 403

    job = Job.query.get_or_404(job_id)

    # Get all applications for this job
    applications = Application.query.filter_by(job_id=job_id).all()

    # Sort by AI score in Python (avoids MySQL nullslast compatibility issues)
    def get_score(app):
        if app.cv_analysis and app.cv_analysis.overall_match_score:
            return float(app.cv_analysis.overall_match_score)
        return -1

    applications = sorted(applications, key=get_score, reverse=True)

    return jsonify({
        'job':        {'id': job.id, 'title': job.title},
        'total':      len(applications),
        'applicants': [a.to_dict() for a in applications],
    }), 200