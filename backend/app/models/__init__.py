# =============================================================
# app/models/__init__.py — All database models
# =============================================================
from app import db
from datetime import datetime
import json
 
 
class Company(db.Model):
    __tablename__ = 'companies'
    id          = db.Column(db.Integer, primary_key=True)
    name        = db.Column(db.String(200), nullable=False)
    industry    = db.Column(db.String(100))
    description = db.Column(db.Text)
    website     = db.Column(db.String(255))
    logo_url    = db.Column(db.String(500))
    location    = db.Column(db.String(200))
    size_range  = db.Column(db.String(50))
    is_active   = db.Column(db.Boolean, default=True)
    created_at  = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at  = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    users       = db.relationship('User', backref='company', lazy=True)
    jobs        = db.relationship('Job', backref='company', lazy=True)
 
    def to_dict(self):
        return {
            'id': self.id, 'name': self.name, 'industry': self.industry,
            'description': self.description, 'website': self.website,
            'logo_url': self.logo_url, 'location': self.location,
            'size_range': self.size_range, 'is_active': self.is_active,
        }
 
 
class User(db.Model):
    __tablename__ = 'users'
    id              = db.Column(db.Integer, primary_key=True)
    email           = db.Column(db.String(255), unique=True, nullable=False)
    password_hash   = db.Column(db.String(255), nullable=False)
    first_name      = db.Column(db.String(100), nullable=False)
    last_name       = db.Column(db.String(100), nullable=False)
    phone           = db.Column(db.String(20))
    role            = db.Column(db.Enum('admin', 'recruiter', 'applicant'), nullable=False, default='applicant')
    is_active       = db.Column(db.Boolean, default=True)
    email_verified  = db.Column(db.Boolean, default=False)
    profile_picture = db.Column(db.String(500))
    company_id      = db.Column(db.Integer, db.ForeignKey('companies.id'), nullable=True)
    created_at      = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at      = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login      = db.Column(db.DateTime)
    applicant_profile = db.relationship('ApplicantProfile', backref='user', uselist=False, lazy=True)
    applications    = db.relationship('Application', foreign_keys='Application.applicant_id', backref='applicant', lazy=True)
    notifications   = db.relationship('Notification', backref='user', lazy=True)
 
    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"
 
    def to_dict(self):
        data = {
            'id': self.id, 'email': self.email,
            'first_name': self.first_name, 'last_name': self.last_name,
            'full_name': self.full_name, 'phone': self.phone,
            'role': self.role, 'is_active': self.is_active,
            'company_id': self.company_id,
            'profile_picture': self.profile_picture,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
        if self.company:
            data['company'] = {'id': self.company.id, 'name': self.company.name}
        return data
 
 
class ApplicantProfile(db.Model):
    __tablename__ = 'applicant_profiles'
    id               = db.Column(db.Integer, primary_key=True)
    user_id          = db.Column(db.Integer, db.ForeignKey('users.id'), unique=True, nullable=False)
    headline         = db.Column(db.String(300))
    summary          = db.Column(db.Text)
    current_location = db.Column(db.String(200))
    years_experience = db.Column(db.Numeric(4, 1), default=0)
    education_level  = db.Column(db.Enum('certificate', 'diploma', 'bachelor', 'master', 'phd', 'other'))
    linkedin_url     = db.Column(db.String(500))
    github_url       = db.Column(db.String(500))
    portfolio_url    = db.Column(db.String(500))
    cv_file_path     = db.Column(db.String(500))
    cv_uploaded_at   = db.Column(db.DateTime)
    skills_summary   = db.Column(db.Text)
    created_at       = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at       = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
 
    def to_dict(self):
        return {
            'id': self.id, 'user_id': self.user_id,
            'headline': self.headline, 'summary': self.summary,
            'current_location': self.current_location,
            'years_experience': float(self.years_experience) if self.years_experience else 0,
            'education_level': self.education_level,
            'linkedin_url': self.linkedin_url, 'github_url': self.github_url,
            'portfolio_url': self.portfolio_url, 'cv_file_path': self.cv_file_path,
            'cv_uploaded_at': self.cv_uploaded_at.isoformat() if self.cv_uploaded_at else None,
            'skills_summary': self.skills_summary,
        }
 
 
class Job(db.Model):
    __tablename__ = 'jobs'
    id                   = db.Column(db.Integer, primary_key=True)
    title                = db.Column(db.String(300), nullable=False)
    description          = db.Column(db.Text, nullable=False)
    requirements         = db.Column(db.Text, nullable=False)
    required_skills      = db.Column(db.Text)
    preferred_skills     = db.Column(db.Text)
    min_experience       = db.Column(db.Numeric(3, 1), default=0)
    max_experience       = db.Column(db.Numeric(3, 1), default=10)
    education_required   = db.Column(db.Enum('certificate', 'diploma', 'bachelor', 'master', 'phd', 'any'), default='bachelor')
    job_type             = db.Column(db.Enum('full-time', 'part-time', 'contract', 'internship', 'remote'), default='full-time')
    salary_min           = db.Column(db.Numeric(12, 2))
    salary_max           = db.Column(db.Numeric(12, 2))
    location             = db.Column(db.String(200))
    company_id           = db.Column(db.Integer, db.ForeignKey('companies.id'), nullable=False)
    posted_by            = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    status               = db.Column(db.Enum('draft', 'active', 'paused', 'closed'), default='active')
    application_deadline = db.Column(db.Date)
    max_applicants       = db.Column(db.Integer, default=100)
    views_count          = db.Column(db.Integer, default=0)
    created_at           = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at           = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    closed_at            = db.Column(db.DateTime)
    applications         = db.relationship('Application', backref='job', lazy=True)
    recruiter            = db.relationship('User', foreign_keys=[posted_by], backref='posted_jobs')
 
    def to_dict(self, include_company=True):
        data = {
            'id': self.id, 'title': self.title,
            'description': self.description, 'requirements': self.requirements,
            'required_skills': self.required_skills.split(',') if self.required_skills else [],
            'preferred_skills': self.preferred_skills.split(',') if self.preferred_skills else [],
            'min_experience': float(self.min_experience) if self.min_experience else 0,
            'max_experience': float(self.max_experience) if self.max_experience else 10,
            'education_required': self.education_required,
            'job_type': self.job_type,
            'salary_min': float(self.salary_min) if self.salary_min else None,
            'salary_max': float(self.salary_max) if self.salary_max else None,
            'location': self.location, 'company_id': self.company_id,
            'posted_by': self.posted_by, 'status': self.status,
            'application_deadline': self.application_deadline.isoformat() if self.application_deadline else None,
            'views_count': self.views_count,
            'applications_count': len(self.applications),
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
        if include_company and self.company:
            data['company'] = self.company.to_dict()
        return data
 
 
class Application(db.Model):
    __tablename__ = 'applications'
    id                     = db.Column(db.Integer, primary_key=True)
    job_id                 = db.Column(db.Integer, db.ForeignKey('jobs.id'), nullable=False)
    applicant_id           = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    cv_file_path           = db.Column(db.String(500), nullable=False)
    cover_letter           = db.Column(db.Text)
    status                 = db.Column(db.Enum('submitted','reviewing','shortlisted','interview','offer','rejected','withdrawn'), default='submitted')
    applied_at             = db.Column(db.DateTime, default=datetime.utcnow)
    reviewed_at            = db.Column(db.DateTime)
    reviewed_by            = db.Column(db.Integer, db.ForeignKey('users.id'))
    notes                  = db.Column(db.Text)
    interview_scheduled_at = db.Column(db.DateTime)
    cv_analysis            = db.relationship('CVAnalysis', backref='application', uselist=False, lazy=True)
    interview_schedules    = db.relationship('InterviewSchedule', backref='application', lazy=True)
 
    def to_dict(self):
        data = {
            'id': self.id, 'job_id': self.job_id, 'applicant_id': self.applicant_id,
            'cv_file_path': self.cv_file_path, 'cover_letter': self.cover_letter,
            'status': self.status,
            'applied_at': self.applied_at.isoformat() if self.applied_at else None,
            'reviewed_at': self.reviewed_at.isoformat() if self.reviewed_at else None,
            'notes': self.notes,
        }
        if self.applicant:
            data['applicant'] = self.applicant.to_dict()
        if self.job:
            data['job'] = {'id': self.job.id, 'title': self.job.title}
            if self.job.company:
                data['job']['company'] = self.job.company.name
        if self.cv_analysis:
            data['ai_score'] = float(self.cv_analysis.overall_match_score) if self.cv_analysis.overall_match_score else None
            data['ranking_label'] = self.cv_analysis.ranking_label
        return data
 
 
class CVAnalysis(db.Model):
    __tablename__ = 'cv_analysis'
    id                     = db.Column(db.Integer, primary_key=True)
    application_id         = db.Column(db.Integer, db.ForeignKey('applications.id'), unique=True, nullable=False)
    extracted_name         = db.Column(db.String(200))
    extracted_email        = db.Column(db.String(255))
    extracted_phone        = db.Column(db.String(50))
    extracted_skills       = db.Column(db.Text)
    extracted_education    = db.Column(db.Text)
    extracted_experience   = db.Column(db.Text)
    extracted_languages    = db.Column(db.Text)
    overall_match_score    = db.Column(db.Numeric(5, 2))
    skills_match_score     = db.Column(db.Numeric(5, 2))
    experience_match_score = db.Column(db.Numeric(5, 2))
    education_match_score  = db.Column(db.Numeric(5, 2))
    ranking_label          = db.Column(db.Enum('Highly Recommended','Recommended','Average Fit','Below Average','Not Recommended'))
    matched_skills         = db.Column(db.Text)
    missing_skills         = db.Column(db.Text)
    ai_summary             = db.Column(db.Text)
    ai_interview_questions = db.Column(db.Text)
    is_duplicate           = db.Column(db.Boolean, default=False)
    duplicate_of_application = db.Column(db.Integer)
    analyzed_at            = db.Column(db.DateTime, default=datetime.utcnow)
    analysis_version       = db.Column(db.String(20), default='1.0')
 
    def to_dict(self):
        def safe_json(value):
            try:
                return json.loads(value) if value else []
            except Exception:
                return []
        return {
            'id': self.id, 'application_id': self.application_id,
            'extracted_name': self.extracted_name, 'extracted_email': self.extracted_email,
            'extracted_phone': self.extracted_phone,
            'extracted_skills': safe_json(self.extracted_skills),
            'extracted_education': safe_json(self.extracted_education),
            'extracted_experience': safe_json(self.extracted_experience),
            'overall_match_score': float(self.overall_match_score) if self.overall_match_score else 0,
            'skills_match_score': float(self.skills_match_score) if self.skills_match_score else 0,
            'experience_match_score': float(self.experience_match_score) if self.experience_match_score else 0,
            'education_match_score': float(self.education_match_score) if self.education_match_score else 0,
            'ranking_label': self.ranking_label,
            'matched_skills': self.matched_skills.split(',') if self.matched_skills else [],
            'missing_skills': self.missing_skills.split(',') if self.missing_skills else [],
            'ai_summary': self.ai_summary,
            'ai_interview_questions': safe_json(self.ai_interview_questions),
            'is_duplicate': self.is_duplicate,
            'analyzed_at': self.analyzed_at.isoformat() if self.analyzed_at else None,
        }
 
 
class InterviewSchedule(db.Model):
    __tablename__ = 'interview_schedules'
    id               = db.Column(db.Integer, primary_key=True)
    application_id   = db.Column(db.Integer, db.ForeignKey('applications.id'), nullable=False)
    interview_type   = db.Column(db.Enum('phone','video','in-person','technical'), default='video')
    scheduled_at     = db.Column(db.DateTime, nullable=False)
    duration_minutes = db.Column(db.Integer, default=60)
    location_or_link = db.Column(db.String(500))
    interviewer_id   = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    status           = db.Column(db.Enum('scheduled','completed','cancelled','no_show'), default='scheduled')
    notes            = db.Column(db.Text)
    feedback         = db.Column(db.Text)
    outcome          = db.Column(db.Enum('pass','fail','hold'))
    created_at       = db.Column(db.DateTime, default=datetime.utcnow)
    interviewer      = db.relationship('User', foreign_keys=[interviewer_id])
 
    def to_dict(self):
        return {
            'id': self.id, 'application_id': self.application_id,
            'interview_type': self.interview_type,
            'scheduled_at': self.scheduled_at.isoformat() if self.scheduled_at else None,
            'duration_minutes': self.duration_minutes,
            'location_or_link': self.location_or_link,
            'interviewer_id': self.interviewer_id,
            'status': self.status, 'notes': self.notes,
            'feedback': self.feedback, 'outcome': self.outcome,
        }
 
 
class Notification(db.Model):
    __tablename__ = 'notifications'
    id                     = db.Column(db.Integer, primary_key=True)
    user_id                = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    type                   = db.Column(db.Enum('application_received','shortlisted','interview_scheduled','offer_extended','application_rejected','job_posted','system'), nullable=False)
    title                  = db.Column(db.String(300), nullable=False)
    message                = db.Column(db.Text, nullable=False)
    related_job_id         = db.Column(db.Integer, db.ForeignKey('jobs.id'))
    related_application_id = db.Column(db.Integer, db.ForeignKey('applications.id'))
    is_read                = db.Column(db.Boolean, default=False)
    created_at             = db.Column(db.DateTime, default=datetime.utcnow)
    read_at                = db.Column(db.DateTime)
 
    def to_dict(self):
        return {
            'id': self.id, 'user_id': self.user_id, 'type': self.type,
            'title': self.title, 'message': self.message,
            'related_job_id': self.related_job_id,
            'related_application_id': self.related_application_id,
            'is_read': self.is_read,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'read_at': self.read_at.isoformat() if self.read_at else None,
        }