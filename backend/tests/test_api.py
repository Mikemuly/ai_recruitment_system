# =============================================================
# tests/test_api.py — Backend API tests using pytest
# Run: cd backend && python -m pytest tests/ -v
# =============================================================
import pytest
import json
from app import create_app, db


@pytest.fixture(scope='module')
def app():
    """Create test Flask app with in-memory SQLite database."""
    app = create_app('testing')
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()


@pytest.fixture(scope='module')
def client(app):
    """Test client for making HTTP requests."""
    return app.test_client()


@pytest.fixture(scope='module')
def auth_tokens(client):
    """
    Register and login a test user, return JWT tokens.
    Used by tests that require authentication.
    """
    # Register applicant
    client.post('/api/auth/register', json={
        'first_name': 'Test', 'last_name': 'User',
        'email': 'test@example.com', 'password': 'Test@1234'
    })
    # Login
    res = client.post('/api/auth/login', json={
        'email': 'test@example.com', 'password': 'Test@1234'
    })
    data = json.loads(res.data)
    return {'access': data['access_token'], 'refresh': data['refresh_token'], 'user': data['user']}


# ─── Auth Tests ─────────────────────────────────────────────

class TestAuth:
    def test_register_success(self, client):
        res = client.post('/api/auth/register', json={
            'first_name': 'Jane', 'last_name': 'Doe',
            'email': 'jane@example.com', 'password': 'Password@1'
        })
        assert res.status_code == 201
        data = json.loads(res.data)
        assert 'access_token' in data
        assert data['user']['role'] == 'applicant'

    def test_register_duplicate_email(self, client):
        payload = {'first_name': 'A', 'last_name': 'B', 'email': 'jane@example.com', 'password': 'Password@1'}
        client.post('/api/auth/register', json=payload)
        res = client.post('/api/auth/register', json=payload)
        assert res.status_code == 409

    def test_register_weak_password(self, client):
        res = client.post('/api/auth/register', json={
            'first_name': 'Test', 'last_name': 'Weak',
            'email': 'weak@example.com', 'password': 'pass'
        })
        assert res.status_code == 400

    def test_login_success(self, client):
        res = client.post('/api/auth/login', json={
            'email': 'jane@example.com', 'password': 'Password@1'
        })
        assert res.status_code == 200
        data = json.loads(res.data)
        assert 'access_token' in data

    def test_login_wrong_password(self, client):
        res = client.post('/api/auth/login', json={
            'email': 'jane@example.com', 'password': 'wrongpassword'
        })
        assert res.status_code == 401

    def test_login_nonexistent_user(self, client):
        res = client.post('/api/auth/login', json={
            'email': 'nobody@example.com', 'password': 'Password@1'
        })
        assert res.status_code == 401

    def test_me_authenticated(self, client, auth_tokens):
        res = client.get('/api/auth/me',
            headers={'Authorization': f"Bearer {auth_tokens['access']}"})
        assert res.status_code == 200
        data = json.loads(res.data)
        assert data['email'] == 'test@example.com'

    def test_me_unauthenticated(self, client):
        res = client.get('/api/auth/me')
        assert res.status_code == 401


# ─── Jobs Tests ─────────────────────────────────────────────

class TestJobs:
    def test_list_jobs_public(self, client):
        """Job listing should be accessible without authentication."""
        res = client.get('/api/jobs')
        assert res.status_code == 200
        data = json.loads(res.data)
        assert 'jobs' in data

    def test_create_job_forbidden_for_applicant(self, client, auth_tokens):
        """Applicants cannot create jobs."""
        res = client.post('/api/jobs',
            json={'title': 'Test Job', 'description': 'Desc', 'requirements': 'Req'},
            headers={'Authorization': f"Bearer {auth_tokens['access']}"})
        assert res.status_code == 403


# ─── Health Check ────────────────────────────────────────────

class TestHealth:
    def test_health_endpoint(self, client):
        res = client.get('/api/health')
        assert res.status_code == 200
        data = json.loads(res.data)
        assert data['status'] == 'ok'


# ─── NLP Engine Unit Tests ───────────────────────────────────

class TestNLPEngine:
    def test_text_similarity_identical(self):
        from app.services.nlp_engine import compute_text_similarity
        score = compute_text_similarity("Python Django REST API", "Python Django REST API")
        assert score > 0.99

    def test_text_similarity_different(self):
        from app.services.nlp_engine import compute_text_similarity
        score = compute_text_similarity("Python Django", "Cooking recipes pasta")
        assert score < 0.3

    def test_skills_match_exact(self):
        from app.services.nlp_engine import match_skills
        score, matched, missing = match_skills(
            ['Python', 'Django', 'MySQL'],
            ['Python', 'Django', 'MySQL'],
            []
        )
        assert score == 100.0
        assert len(matched) == 3
        assert len(missing) == 0

    def test_skills_match_partial(self):
        from app.services.nlp_engine import match_skills
        score, matched, missing = match_skills(
            ['Python'],
            ['Python', 'Django', 'MySQL'],
            []
        )
        assert 0 < score < 100
        assert 'mysql' in missing

    def test_experience_match_exact(self):
        from app.services.nlp_engine import match_experience
        score = match_experience(3.0, 2.0, 5.0)
        assert score == 100.0

    def test_experience_match_under(self):
        from app.services.nlp_engine import match_experience
        score = match_experience(0.5, 3.0, 5.0)
        assert score < 100.0

    def test_ranking_label(self):
        from app.services.nlp_engine import get_ranking_label
        assert get_ranking_label(85) == 'Highly Recommended'
        assert get_ranking_label(70) == 'Recommended'
        assert get_ranking_label(55) == 'Average Fit'
        assert get_ranking_label(40) == 'Below Average'
        assert get_ranking_label(20) == 'Not Recommended'


# ─── CV Parser Unit Tests ────────────────────────────────────

class TestCVParser:
    def test_extract_email(self):
        from app.services.cv_parser import extract_email
        text = "Contact me at john.kamau@safaricom.co.ke or call"
        assert extract_email(text) == "john.kamau@safaricom.co.ke"

    def test_extract_phone_kenyan(self):
        from app.services.cv_parser import extract_phone
        text = "Phone: +254 712 345 678"
        assert extract_phone(text) is not None

    def test_extract_phone_local(self):
        from app.services.cv_parser import extract_phone
        text = "Mobile: 0712345678"
        assert extract_phone(text) is not None

    def test_extract_skills(self):
        from app.services.cv_parser import extract_skills
        text = "I am proficient in Python, Django, and MySQL. Experience with Docker."
        skills = extract_skills(text)
        # Should find Python, Django, MySQL, Docker
        skills_lower = [s.lower() for s in skills]
        assert 'python' in skills_lower

    def test_extract_years_experience(self):
        from app.services.cv_parser import extract_years_experience
        text = "I have 3 years of experience in software development."
        years = extract_years_experience(text)
        assert years == 3.0
