# =============================================================
# app/routes/applications.py — Application management (FIXED)
# =============================================================
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from werkzeug.utils import secure_filename
from app import db
from app.models import Application, Job, User, CVAnalysis, Notification, ApplicantProfile
from app.services.cv_parser import parse_full_cv
from app.services.nlp_engine import analyze_cv_against_job, detect_duplicate_cv
from app.services.openai_service import generate_candidate_summary, generate_interview_questions
from datetime import datetime
import os
import json

applications_bp = Blueprint('applications', __name__)


def allowed_file(filename):
    return ('.' in filename and
            filename.rsplit('.', 1)[1].lower() in
            current_app.config['ALLOWED_EXTENSIONS'])


def send_notification(user_id, notif_type, title, message, job_id=None, app_id=None):
    notif = Notification(
        user_id=user_id, type=notif_type, title=title, message=message,
        related_job_id=job_id, related_application_id=app_id,
    )
    db.session.add(notif)


@applications_bp.route('/apply', methods=['POST'])
@jwt_required()
def apply_for_job():
    user_id = int(get_jwt_identity())
    claims = get_jwt()

    if claims.get('role') != 'applicant':
        return jsonify({'error': 'Only applicants can apply for jobs'}), 403

    job_id = request.form.get('job_id')
    cover_letter = request.form.get('cover_letter', '')

    if not job_id:
        return jsonify({'error': 'job_id is required'}), 400

    job = Job.query.get(job_id)
    if not job:
        return jsonify({'error': 'Job not found'}), 404
    if job.status != 'active':
        return jsonify({'error': 'This job is no longer accepting applications'}), 400

    if job.application_deadline and job.application_deadline < datetime.utcnow().date():
        return jsonify({'error': 'Application deadline has passed'}), 400

    existing = Application.query.filter_by(job_id=job_id, applicant_id=user_id).first()
    if existing:
        return jsonify({'error': 'You have already applied for this job'}), 409

    if 'cv_file' not in request.files:
        return jsonify({'error': 'CV file is required'}), 400

    cv_file = request.files['cv_file']
    if cv_file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    if not allowed_file(cv_file.filename):
        return jsonify({'error': 'Only PDF and DOCX files are accepted'}), 400

    filename = secure_filename(f"user{user_id}_job{job_id}_{cv_file.filename}")
    upload_folder = current_app.config['UPLOAD_FOLDER']
    os.makedirs(upload_folder, exist_ok=True)
    file_path = os.path.join(upload_folder, filename)
    cv_file.save(file_path)

    application = Application(
        job_id=job_id, applicant_id=user_id,
        cv_file_path=file_path, cover_letter=cover_letter, status='submitted',
    )
    db.session.add(application)
    db.session.flush()

    try:
        cv_data = parse_full_cv(file_path)

        existing_apps = Application.query.filter(
            Application.job_id == job_id,
            Application.id != application.id
        ).all()
        existing_texts = []
        for app in existing_apps:
            try:
                from app.services.cv_parser import extract_cv_text
                existing_texts.append(extract_cv_text(app.cv_file_path))
            except Exception:
                pass

        is_duplicate, dup_score = detect_duplicate_cv(cv_data['raw_text'], existing_texts)
        analysis_result = analyze_cv_against_job(cv_data, job)

        ai_summary = generate_candidate_summary(
            cv_data['raw_text'], job.title,
            analysis_result['overall_match_score'],
            analysis_result['matched_skills'],
            analysis_result['missing_skills']
        )

        interview_questions = generate_interview_questions(
            cv_data['raw_text'], job.title, job.requirements,
            analysis_result['matched_skills'],
            analysis_result['missing_skills']
        )

        cv_analysis = CVAnalysis(
            application_id=application.id,
            extracted_name=cv_data.get('extracted_name'),
            extracted_email=cv_data.get('extracted_email'),
            extracted_phone=cv_data.get('extracted_phone'),
            extracted_skills=analysis_result['extracted_skills'],
            extracted_education=analysis_result['extracted_education'],
            overall_match_score=analysis_result['overall_match_score'],
            skills_match_score=analysis_result['skills_match_score'],
            experience_match_score=analysis_result['experience_match_score'],
            education_match_score=analysis_result['education_match_score'],
            ranking_label=analysis_result['ranking_label'],
            matched_skills=','.join(analysis_result['matched_skills']),
            missing_skills=','.join(analysis_result['missing_skills']),
            ai_summary=ai_summary,
            ai_interview_questions=json.dumps(interview_questions),
            is_duplicate=is_duplicate,
        )
        db.session.add(cv_analysis)

        profile = ApplicantProfile.query.filter_by(user_id=user_id).first()
        if profile:
            profile.cv_file_path = file_path
            profile.cv_uploaded_at = datetime.utcnow()

    except Exception as e:
        current_app.logger.error(f"AI analysis failed: {str(e)}")

    send_notification(
        user_id=user_id, notif_type='application_received',
        title='Application submitted successfully!',
        message=f'Your application for {job.title} at {job.company.name} has been received.',
        job_id=job.id, app_id=application.id,
    )
    send_notification(
        user_id=job.posted_by, notif_type='application_received',
        title=f'New application for {job.title}',
        message=f'A new application has been received for {job.title}.',
        job_id=job.id, app_id=application.id,
    )

    db.session.commit()

    return jsonify({
        'message': 'Application submitted successfully!',
        'application': application.to_dict(),
    }), 201


@applications_bp.route('/my', methods=['GET'])
@jwt_required()
def my_applications():
    user_id = int(get_jwt_identity())
    applications = (
        Application.query
        .filter_by(applicant_id=user_id)
        .order_by(Application.applied_at.desc())
        .all()
    )
    return jsonify({'applications': [a.to_dict() for a in applications]}), 200


@applications_bp.route('/<int:app_id>/status', methods=['PUT'])
@jwt_required()
def update_status(app_id):
    claims = get_jwt()
    if claims.get('role') not in ('recruiter', 'admin'):
        return jsonify({'error': 'Permission denied'}), 403

    application = Application.query.get_or_404(app_id)
    data = request.get_json()
    new_status = data.get('status')

    valid_statuses = ['submitted', 'reviewing', 'shortlisted', 'interview', 'offer', 'rejected', 'withdrawn']
    if new_status not in valid_statuses:
        return jsonify({'error': f'Invalid status'}), 400

    old_status = application.status
    application.status = new_status
    application.reviewed_at = datetime.utcnow()
    application.reviewed_by = int(get_jwt_identity())
    if data.get('notes'):
        application.notes = data['notes']

    notif_map = {
        'shortlisted': ('You\'ve been shortlisted!', 'shortlisted'),
        'interview':   ('Interview scheduled',        'interview_scheduled'),
        'offer':       ('Job offer extended!',        'offer_extended'),
        'rejected':    ('Application update',         'application_rejected'),
    }

    if new_status in notif_map and new_status != old_status:
        job = application.job
        title, notif_type = notif_map[new_status]
        messages = {
            'shortlisted': f'You have been shortlisted for {job.title} at {job.company.name}.',
            'interview':   f'An interview has been scheduled for {job.title}.',
            'offer':       f'You have received a job offer for {job.title}!',
            'rejected':    f'Thank you for applying to {job.title}. Unfortunately you were not selected.',
        }
        send_notification(
            user_id=application.applicant_id, notif_type=notif_type,
            title=title, message=messages[new_status],
            job_id=job.id, app_id=application.id,
        )

    db.session.commit()
    return jsonify({'message': 'Status updated', 'application': application.to_dict()}), 200


@applications_bp.route('/notifications', methods=['GET'])
@jwt_required()
def get_notifications():
    user_id = int(get_jwt_identity())
    notifications = (
        Notification.query
        .filter_by(user_id=user_id)
        .order_by(Notification.created_at.desc())
        .limit(50).all()
    )
    unread_count = Notification.query.filter_by(user_id=user_id, is_read=False).count()
    return jsonify({
        'notifications': [n.to_dict() for n in notifications],
        'unread_count': unread_count,
    }), 200


@applications_bp.route('/notifications/read', methods=['PUT'])
@jwt_required()
def mark_notifications_read():
    user_id = int(get_jwt_identity())
    Notification.query.filter_by(user_id=user_id, is_read=False).update({
        'is_read': True, 'read_at': datetime.utcnow()
    })
    db.session.commit()
    return jsonify({'message': 'All notifications marked as read'}), 200