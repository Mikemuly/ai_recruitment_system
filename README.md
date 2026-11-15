# 🤖 AI Recruitment & CV Screening System

A full-stack intelligent recruitment platform that automates CV screening, ranks candidates using AI/NLP, and streamlines the hiring process for Kenyan organizations.

---

## 📋 Project Overview

This system solves the problem of **manual CV screening** and **inefficient recruitment** by:
- Automatically parsing and analyzing uploaded CVs
- Matching candidates against job descriptions using NLP
- Ranking applicants by suitability percentage
- Tracking applicants through recruitment stages
- Generating AI-powered interview questions and summaries

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js 18 + Tailwind CSS |
| Backend | Python Flask (REST API) |
| Database | MySQL 8.0 + SQLAlchemy ORM |
| Authentication | JWT (JSON Web Tokens) |
| AI/NLP | spaCy, scikit-learn, OpenAI API |
| File Parsing | PyMuPDF (PDF), python-docx (DOCX) |
| Charts | Recharts |

---

## 👥 User Roles

| Role | Permissions |
|------|-------------|
| **Admin** | Manage companies, users, system analytics |
| **HR Recruiter** | Post jobs, view/rank applicants, schedule interviews |
| **Applicant** | Register, upload CV, apply for jobs, track status |

---

## 📁 Folder Structure

```
ai-recruitment-system/
├── backend/
│   ├── app/
│   │   ├── __init__.py          # App factory
│   │   ├── config.py            # Configuration
│   │   ├── models/              # SQLAlchemy models
│   │   │   ├── user.py
│   │   │   ├── job.py
│   │   │   ├── application.py
│   │   │   ├── company.py
│   │   │   └── notification.py
│   │   ├── routes/              # Flask Blueprints
│   │   │   ├── auth.py
│   │   │   ├── jobs.py
│   │   │   ├── applications.py
│   │   │   ├── admin.py
│   │   │   └── ai_analysis.py
│   │   ├── services/            # Business logic
│   │   │   ├── cv_parser.py     # PDF/DOCX parsing
│   │   │   ├── nlp_engine.py    # NLP & ranking
│   │   │   ├── openai_service.py
│   │   │   └── email_service.py
│   │   └── utils/
│   │       ├── auth_helper.py   # JWT utilities
│   │       └── validators.py
│   ├── migrations/
│   ├── tests/
│   ├── requirements.txt
│   ├── run.py
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── admin/
│   │   │   ├── hr/
│   │   │   ├── applicant/
│   │   │   └── shared/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── context/
│   │   ├── services/            # API calls (axios)
│   │   └── utils/
│   ├── public/
│   ├── package.json
│   └── tailwind.config.js
├── scripts/
│   ├── schema.sql               # Full DB schema
│   └── seed_data.sql            # Sample data
└── docs/
    └── project_report.md        # Academic documentation
```

---

## ⚡ Quick Start (Local Setup)

### Prerequisites
- Node.js 18+
- Python 3.10+
- MySQL 8.0+
- Git

### 1. Clone & Setup

```bash
git clone <your-repo-url>
cd ai-recruitment-system
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Download spaCy language model
python -m spacy download en_core_web_sm

# Configure environment
cp .env.example .env
# Edit .env with your MySQL credentials and OpenAI API key

# Create database & tables
mysql -u root -p < ../scripts/schema.sql
mysql -u root -p recruitment_db < ../scripts/seed_data.sql

# Run Flask server
python run.py
# API runs on http://localhost:5000
```

### 3. Frontend Setup

```bash
cd frontend

# Install packages
npm install

# Start development server
npm start
# App runs on http://localhost:3000
```

---

## 🔑 Default Login Credentials (Seed Data)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@recruitke.co.ke | Admin@123 |
| HR Recruiter | hr@safaricom.co.ke | HR@123456 |
| Applicant | john.kamau@gmail.com | Test@123 |

---

## 🌐 API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /api/auth/register | Register user | Public |
| POST | /api/auth/login | Login | Public |
| GET | /api/jobs | List all jobs | Public |
| POST | /api/jobs | Create job | HR/Admin |
| GET | /api/jobs/:id | Job details | Public |
| PUT | /api/jobs/:id | Update job | HR/Admin |
| DELETE | /api/jobs/:id | Delete job | Admin |
| POST | /api/applications/apply | Apply for job | Applicant |
| POST | /api/applications/upload-cv | Upload CV | Applicant |
| GET | /api/applications/job/:id | List applicants | HR/Admin |
| GET | /api/ai/analyze/:application_id | AI CV analysis | HR/Admin |
| GET | /api/ai/questions/:application_id | Interview questions | HR/Admin |
| GET | /api/admin/stats | System stats | Admin |
| GET | /api/admin/companies | All companies | Admin |

---

## 🧪 Testing

```bash
# Backend tests
cd backend
python -m pytest tests/ -v

# Frontend tests
cd frontend
npm test
```

---

## 🚀 Deployment

### Backend (Heroku / Railway)
```bash
# Create Procfile
echo "web: gunicorn run:app" > Procfile
pip install gunicorn
# Set environment variables in platform dashboard
```

### Frontend (Vercel / Netlify)
```bash
npm run build
# Deploy build/ folder
```

---

## 📚 Academic Documentation

See [`docs/project_report.md`](docs/project_report.md) for:
- Problem Statement
- Objectives & Justification
- Literature Review
- System Design & ERD
- Testing Strategies
- Future Improvements

---

## 👨‍💻 Developer

**Student**: [Your Name]  
**Reg No**: [Your Registration Number]  
**Institution**: [Your University], Kenya  
**Supervisor**: [Supervisor Name]  
**Year**: 2024/2025
