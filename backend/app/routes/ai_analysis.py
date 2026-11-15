# =============================================================
# app/routes/ai_analysis.py — AI analysis endpoints (FIXED)
# =============================================================
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app import db
from app.models import CVAnalysis, Application
from app.services.openai_service import ai_chatbot_response

ai_bp = Blueprint('ai', __name__)


@ai_bp.route('/analyze/<int:app_id>', methods=['GET'])
@jwt_required()
def get_analysis(app_id):
    claims = get_jwt()
    if claims.get('role') not in ('recruiter', 'admin'):
        return jsonify({'error': 'Access denied'}), 403
    application = Application.query.get_or_404(app_id)
    if not application.cv_analysis:
        return jsonify({'error': 'No analysis available yet.'}), 404
    return jsonify({'analysis': application.cv_analysis.to_dict()}), 200


@ai_bp.route('/questions/<int:app_id>', methods=['GET'])
@jwt_required()
def get_interview_questions(app_id):
    claims = get_jwt()
    if claims.get('role') not in ('recruiter', 'admin'):
        return jsonify({'error': 'Access denied'}), 403
    application = Application.query.get_or_404(app_id)
    if not application.cv_analysis:
        return jsonify({'error': 'No analysis available'}), 404
    import json
    questions = []
    try:
        questions = json.loads(application.cv_analysis.ai_interview_questions or '[]')
    except Exception:
        questions = []
    return jsonify({
        'application_id': app_id,
        'candidate': application.applicant.full_name,
        'job': application.job.title,
        'questions': questions,
    }), 200


@ai_bp.route('/chatbot', methods=['POST'])
@jwt_required()
def chatbot():
    data = request.get_json()
    message = data.get('message', '').strip()
    if not message:
        return jsonify({'error': 'Message is required'}), 400
    if len(message) > 500:
        return jsonify({'error': 'Message too long'}), 400
    context = data.get('context', {})
    response = ai_chatbot_response(message, context)
    return jsonify({'response': response}), 200


@ai_bp.route('/rankings/<int:job_id>', methods=['GET'])
@jwt_required()
def job_rankings(job_id):
    claims = get_jwt()
    if claims.get('role') not in ('recruiter', 'admin'):
        return jsonify({'error': 'Access denied'}), 403
    from app.models import Job
    job = Job.query.get_or_404(job_id)
    applications = (
        Application.query.filter_by(job_id=job_id)
        .join(CVAnalysis, Application.id == CVAnalysis.application_id, isouter=True)
        .order_by(CVAnalysis.overall_match_score.desc().nullslast())
        .all()
    )
    ranked = []
    for i, app in enumerate(applications, 1):
        entry = app.to_dict()
        entry['rank'] = i
        ranked.append(entry)
    return jsonify({
        'job': {'id': job.id, 'title': job.title, 'company': job.company.name},
        'total_applicants': len(ranked),
        'rankings': ranked,
    }), 200