-- =============================================================
-- AI Recruitment System — Sample Seed Data (Kenyan Context)
-- Run AFTER schema.sql
-- =============================================================
USE recruitment_db;

-- Sample Kenyan companies
INSERT INTO companies (name, industry, description, website, location, size_range) VALUES
('Safaricom PLC', 'Telecommunications', 'Kenya\'s leading mobile network operator and technology company.', 'https://safaricom.co.ke', 'Nairobi, Kenya', '5000+ employees'),
('Equity Bank Kenya', 'Banking & Finance', 'Pan-African financial services company headquartered in Nairobi.', 'https://equitybank.co.ke', 'Nairobi, Kenya', '2000-5000 employees'),
('Kenya Airways', 'Aviation & Transport', 'The Pride of Africa — Kenya\'s national carrier.', 'https://kenya-airways.com', 'Nairobi, Kenya', '2000-5000 employees'),
('Nation Media Group', 'Media & Publishing', 'East and Central Africa\'s largest media house.', 'https://nation.africa', 'Nairobi, Kenya', '500-2000 employees'),
('KPLC Kenya Power', 'Energy & Utilities', 'Kenya\'s electricity transmission and distribution company.', 'https://kplc.co.ke', 'Nairobi, Kenya', '5000+ employees'),
('Andela Kenya', 'Technology', 'Global talent accelerator connecting African software engineers with global companies.', 'https://andela.com', 'Nairobi, Kenya', '200-500 employees');

-- Sample users (passwords are bcrypt hashes of the values in README)
-- In production, Flask handles hashing; these are placeholder hashes
INSERT INTO users (email, password_hash, first_name, last_name, phone, role, company_id, is_active, email_verified) VALUES
('admin@recruitke.co.ke', '$2b$12$placeholder_admin_hash', 'System', 'Admin', '+254700000001', 'admin', NULL, TRUE, TRUE),
('hr@safaricom.co.ke', '$2b$12$placeholder_hr_hash', 'Wanjiku', 'Mwangi', '+254711000001', 'recruiter', 1, TRUE, TRUE),
('hr@equitybank.co.ke', '$2b$12$placeholder_hr2_hash', 'Otieno', 'Ouma', '+254722000002', 'recruiter', 2, TRUE, TRUE),
('john.kamau@gmail.com', '$2b$12$placeholder_app_hash', 'John', 'Kamau', '+254733000001', 'applicant', NULL, TRUE, TRUE),
('fatuma.ali@gmail.com', '$2b$12$placeholder_app2_hash', 'Fatuma', 'Ali', '+254744000002', 'applicant', NULL, TRUE, TRUE),
('peter.njoroge@gmail.com', '$2b$12$placeholder_app3_hash', 'Peter', 'Njoroge', '+254755000003', 'applicant', NULL, TRUE, TRUE);

-- Applicant profiles
INSERT INTO applicant_profiles (user_id, headline, summary, current_location, years_experience, education_level, skills_summary) VALUES
(4, 'Backend Developer | Python | Django | MySQL', 'Passionate software developer with 3 years experience building scalable web applications.', 'Nairobi, Kenya', 3.0, 'bachelor', 'Python,Django,MySQL,REST API,Git,Linux'),
(5, 'Data Analyst | Excel | Power BI | SQL', 'Detail-oriented data analyst skilled in turning raw data into actionable insights.', 'Mombasa, Kenya', 2.0, 'bachelor', 'Excel,Power BI,SQL,Python,Tableau'),
(6, 'Frontend Developer | React | JavaScript | Tailwind', 'Creative frontend developer passionate about building beautiful, responsive UIs.', 'Kisumu, Kenya', 1.5, 'diploma', 'React,JavaScript,HTML,CSS,Tailwind CSS');

-- Sample jobs
INSERT INTO jobs (title, description, requirements, required_skills, preferred_skills, min_experience, max_experience, education_required, job_type, salary_min, salary_max, location, company_id, posted_by, status, application_deadline) VALUES
(
  'Senior Software Engineer',
  'We are looking for an experienced Software Engineer to join our M-PESA engineering team at Safaricom. You will design, develop, and maintain high-performance systems that serve millions of Kenyans daily.',
  'Build and maintain RESTful APIs. Write clean, scalable Python code. Collaborate with cross-functional teams. Perform code reviews. Participate in Agile sprints.',
  'Python,Django,REST API,MySQL,Git',
  'Redis,Docker,Kubernetes,AWS',
  3.0, 8.0, 'bachelor', 'full-time',
  150000.00, 250000.00,
  'Nairobi, Kenya', 1, 2, 'active', '2025-03-31'
),
(
  'Data Analyst — Business Intelligence',
  'Equity Bank is seeking a Data Analyst to join our Business Intelligence team. You will help transform financial data into insights that drive strategic decisions across our Pan-African operations.',
  'Analyze large datasets to identify trends and patterns. Create dashboards using Power BI. Write SQL queries. Present findings to stakeholders. Support data-driven decision making.',
  'SQL,Power BI,Excel,Python',
  'Tableau,R,Machine Learning',
  2.0, 5.0, 'bachelor', 'full-time',
  80000.00, 130000.00,
  'Nairobi, Kenya', 2, 3, 'active', '2025-04-15'
),
(
  'Frontend Developer (React)',
  'Nation Media Group seeks a talented Frontend Developer to build modern, engaging digital experiences for Africa\'s largest media platform, reaching millions of readers daily.',
  'Develop responsive web applications using React.js. Implement pixel-perfect UI from Figma designs. Optimize for performance and SEO. Write unit tests. Collaborate with backend team.',
  'React,JavaScript,HTML,CSS,Tailwind CSS',
  'Next.js,TypeScript,GraphQL',
  1.0, 4.0, 'diploma', 'full-time',
  60000.00, 100000.00,
  'Nairobi, Kenya', 4, 2, 'active', '2025-04-30'
);

-- Sample applications
INSERT INTO applications (job_id, applicant_id, cv_file_path, cover_letter, status, applied_at) VALUES
(1, 4, 'uploads/cvs/john_kamau_cv.pdf', 'Dear Hiring Manager, I am excited to apply for the Senior Software Engineer position at Safaricom...', 'shortlisted', NOW()),
(2, 5, 'uploads/cvs/fatuma_ali_cv.pdf', 'Dear Equity Bank Team, With my background in data analysis...', 'reviewing', NOW()),
(3, 6, 'uploads/cvs/peter_njoroge_cv.pdf', 'I am writing to express my interest in the Frontend Developer role...', 'submitted', NOW());

-- Sample CV analysis results
INSERT INTO cv_analysis (application_id, extracted_name, extracted_email, extracted_skills,
  overall_match_score, skills_match_score, experience_match_score, education_match_score,
  ranking_label, matched_skills, missing_skills, ai_summary) VALUES
(1, 'John Kamau', 'john.kamau@gmail.com', '["Python","Django","MySQL","Git","REST API","Linux"]',
  78.50, 85.00, 75.00, 75.00,
  'Recommended',
  'Python,Django,MySQL,REST API,Git',
  'Redis,Docker',
  'John demonstrates strong alignment with the core technical requirements. His experience with Python and Django is solid and his REST API knowledge is directly applicable. Lacks DevOps skills (Docker/Kubernetes) but shows strong foundational skills.'),
(2, 'Fatuma Ali', 'fatuma.ali@gmail.com', '["Excel","Power BI","SQL","Python","Tableau"]',
  82.00, 90.00, 80.00, 75.00,
  'Highly Recommended',
  'SQL,Power BI,Excel,Python',
  'R',
  'Fatuma is an excellent match for this role. Her skills in Power BI and SQL closely align with job requirements. Strong analytical background with hands-on experience in financial data contexts makes her a top candidate.'),
(3, 'Peter Njoroge', 'peter.njoroge@gmail.com', '["React","JavaScript","HTML","CSS","Tailwind CSS"]',
  71.00, 80.00, 50.00, 60.00,
  'Average Fit',
  'React,JavaScript,HTML,CSS,Tailwind CSS',
  'Next.js,TypeScript',
  'Peter meets the core frontend requirements well. However, limited professional experience (1.5 years vs 1-4 required) and lack of Next.js/TypeScript exposure are areas of concern. Strong potential with some upskilling.');

-- Sample notifications
INSERT INTO notifications (user_id, type, title, message, related_job_id, related_application_id) VALUES
(4, 'shortlisted', '🎉 You\'ve been shortlisted!', 'Congratulations! You have been shortlisted for the Senior Software Engineer position at Safaricom PLC.', 1, 1),
(5, 'application_received', 'Application received', 'Your application for Data Analyst at Equity Bank has been received and is under review.', 2, 2),
(6, 'application_received', 'Application received', 'Your application for Frontend Developer at Nation Media Group has been received.', 3, 3);
