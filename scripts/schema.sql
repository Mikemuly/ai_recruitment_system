-- =============================================================
-- AI Recruitment & CV Screening System — Database Schema
-- University Final Year Project | Kenya
-- =============================================================

CREATE DATABASE IF NOT EXISTS recruitment_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE recruitment_db;

-- -----------------------------------------------------------
-- COMPANIES table
-- Represents organizations that post jobs on the platform
-- -----------------------------------------------------------
CREATE TABLE companies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    industry VARCHAR(100),
    description TEXT,
    website VARCHAR(255),
    logo_url VARCHAR(500),
    location VARCHAR(200),               -- e.g. "Nairobi, Kenya"
    size_range VARCHAR(50),              -- e.g. "50-200 employees"
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------
-- USERS table
-- Stores all system users (admin, recruiter, applicant)
-- -----------------------------------------------------------
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role ENUM('admin', 'recruiter', 'applicant') NOT NULL DEFAULT 'applicant',
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    profile_picture VARCHAR(500),
    company_id INT NULL,                 -- for recruiters: their company
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL
);

-- -----------------------------------------------------------
-- APPLICANT_PROFILES table
-- Extended profile info for job applicants
-- -----------------------------------------------------------
CREATE TABLE applicant_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    headline VARCHAR(300),               -- e.g. "Software Engineer | Python | Django"
    summary TEXT,
    current_location VARCHAR(200),
    years_experience DECIMAL(4,1) DEFAULT 0,
    education_level ENUM('certificate','diploma','bachelor','master','phd','other'),
    linkedin_url VARCHAR(500),
    github_url VARCHAR(500),
    portfolio_url VARCHAR(500),
    cv_file_path VARCHAR(500),           -- latest uploaded CV
    cv_uploaded_at TIMESTAMP NULL,
    skills_summary TEXT,                 -- extracted skills (comma-separated)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- -----------------------------------------------------------
-- JOBS table
-- Job postings created by HR recruiters
-- -----------------------------------------------------------
CREATE TABLE jobs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(300) NOT NULL,
    description TEXT NOT NULL,
    requirements TEXT NOT NULL,          -- full job requirements text
    required_skills TEXT,                -- comma-separated: "Python,Django,MySQL"
    preferred_skills TEXT,               -- nice-to-have skills
    min_experience DECIMAL(3,1) DEFAULT 0,
    max_experience DECIMAL(3,1) DEFAULT 10,
    education_required ENUM('certificate','diploma','bachelor','master','phd','any') DEFAULT 'bachelor',
    job_type ENUM('full-time','part-time','contract','internship','remote') DEFAULT 'full-time',
    salary_min DECIMAL(12,2) NULL,       -- KES
    salary_max DECIMAL(12,2) NULL,
    location VARCHAR(200),
    company_id INT NOT NULL,
    posted_by INT NOT NULL,              -- recruiter user ID
    status ENUM('draft','active','paused','closed') DEFAULT 'active',
    application_deadline DATE,
    max_applicants INT DEFAULT 100,
    views_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    closed_at TIMESTAMP NULL,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (posted_by) REFERENCES users(id) ON DELETE CASCADE
);

-- -----------------------------------------------------------
-- APPLICATIONS table
-- Tracks each job application submitted by an applicant
-- -----------------------------------------------------------
CREATE TABLE applications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    job_id INT NOT NULL,
    applicant_id INT NOT NULL,           -- user ID of applicant
    cv_file_path VARCHAR(500) NOT NULL,  -- CV submitted for this application
    cover_letter TEXT,
    status ENUM('submitted','reviewing','shortlisted','interview','offer','rejected','withdrawn') DEFAULT 'submitted',
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP NULL,
    reviewed_by INT NULL,                -- recruiter who reviewed
    notes TEXT,                          -- internal recruiter notes
    interview_scheduled_at TIMESTAMP NULL,
    UNIQUE KEY unique_application (job_id, applicant_id),
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
    FOREIGN KEY (applicant_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
);

-- -----------------------------------------------------------
-- CV_ANALYSIS table
-- Stores AI/NLP analysis results for each application
-- -----------------------------------------------------------
CREATE TABLE cv_analysis (
    id INT AUTO_INCREMENT PRIMARY KEY,
    application_id INT NOT NULL UNIQUE,
    -- Extracted information from CV
    extracted_name VARCHAR(200),
    extracted_email VARCHAR(255),
    extracted_phone VARCHAR(50),
    extracted_skills TEXT,               -- JSON: ["Python","Django","MySQL"]
    extracted_education TEXT,            -- JSON: [{degree, institution, year}]
    extracted_experience TEXT,           -- JSON: [{title, company, duration}]
    extracted_languages TEXT,            -- programming languages found
    -- Matching scores
    overall_match_score DECIMAL(5,2),   -- 0.00 to 100.00 (percentage)
    skills_match_score DECIMAL(5,2),
    experience_match_score DECIMAL(5,2),
    education_match_score DECIMAL(5,2),
    -- AI rankings and labels
    ranking_label ENUM('Highly Recommended','Recommended','Average Fit','Below Average','Not Recommended'),
    matched_skills TEXT,                 -- skills found in both CV and JD
    missing_skills TEXT,                 -- required skills not in CV
    -- AI generated content
    ai_summary TEXT,                     -- AI suitability summary
    ai_interview_questions TEXT,         -- JSON array of suggested questions
    is_duplicate BOOLEAN DEFAULT FALSE,  -- duplicate CV detection
    duplicate_of_application INT NULL,   -- if duplicate, points to original
    -- Metadata
    analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    analysis_version VARCHAR(20) DEFAULT '1.0',
    FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
);

-- -----------------------------------------------------------
-- INTERVIEW_SCHEDULES table
-- Tracks interview scheduling for shortlisted candidates
-- -----------------------------------------------------------
CREATE TABLE interview_schedules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    application_id INT NOT NULL,
    interview_type ENUM('phone','video','in-person','technical') DEFAULT 'video',
    scheduled_at TIMESTAMP NOT NULL,
    duration_minutes INT DEFAULT 60,
    location_or_link VARCHAR(500),       -- physical address or video call link
    interviewer_id INT NOT NULL,         -- recruiter conducting interview
    status ENUM('scheduled','completed','cancelled','no_show') DEFAULT 'scheduled',
    notes TEXT,
    feedback TEXT,                       -- post-interview feedback
    outcome ENUM('pass','fail','hold') NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
    FOREIGN KEY (interviewer_id) REFERENCES users(id) ON DELETE CASCADE
);

-- -----------------------------------------------------------
-- NOTIFICATIONS table
-- In-app notifications for users
-- -----------------------------------------------------------
CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    type ENUM('application_received','shortlisted','interview_scheduled',
              'offer_extended','application_rejected','job_posted','system') NOT NULL,
    title VARCHAR(300) NOT NULL,
    message TEXT NOT NULL,
    related_job_id INT NULL,
    related_application_id INT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (related_job_id) REFERENCES jobs(id) ON DELETE SET NULL,
    FOREIGN KEY (related_application_id) REFERENCES applications(id) ON DELETE SET NULL
);

-- -----------------------------------------------------------
-- INDEXES for performance
-- -----------------------------------------------------------
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_company ON jobs(company_id);
CREATE INDEX idx_jobs_deadline ON jobs(application_deadline);
CREATE INDEX idx_applications_job ON applications(job_id);
CREATE INDEX idx_applications_applicant ON applications(applicant_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_cv_analysis_score ON cv_analysis(overall_match_score);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
