# =============================================================
# app/services/nlp_engine.py — AI/NLP Candidate Ranking Engine
# 
# Uses: TF-IDF, Cosine Similarity, spaCy NLP
# 
# Key Algorithm:
#   overall_score = (skills_score × 0.5) + 
#                   (experience_score × 0.3) + 
#                   (education_score × 0.2)
# =============================================================
import re
import json
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

# Education level hierarchy (higher = more qualified)
EDUCATION_LEVELS = {
    'certificate': 1,
    'diploma': 2,
    'bachelor': 3,
    'master': 4,
    'phd': 5,
    'other': 2,
    'any': 1,
}


# -----------------------------------------------------------
# Text Similarity using TF-IDF + Cosine Similarity
# -----------------------------------------------------------
def compute_text_similarity(text1, text2):
    """
    Compute semantic similarity between two text documents.
    Uses TF-IDF vectorization and cosine similarity.
    Returns a score from 0.0 to 1.0.
    """
    if not text1 or not text2:
        return 0.0

    try:
        vectorizer = TfidfVectorizer(
            stop_words='english',
            max_features=5000,
            ngram_range=(1, 2)   # Include bigrams for better context
        )
        # Vectorize both documents
        tfidf_matrix = vectorizer.fit_transform([text1, text2])
        # Cosine similarity between the two vectors
        similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
        return float(similarity)
    except Exception:
        return 0.0


# -----------------------------------------------------------
# Skills Matching
# -----------------------------------------------------------
def match_skills(cv_skills, job_required_skills, job_preferred_skills=None):
    """
    Compare CV skills against job required and preferred skills.
    
    Returns:
        score (float): 0-100 match percentage
        matched (list): skills found in both CV and JD
        missing (list): required skills not found in CV
    """
    # Normalize skills to lowercase for comparison
    cv_set = {s.lower().strip() for s in cv_skills}
    required_set = {s.lower().strip() for s in (job_required_skills or [])}
    preferred_set = {s.lower().strip() for s in (job_preferred_skills or [])}

    if not required_set:
        return 50.0, [], []   # No requirements = neutral score

    # Find exact matches
    matched_required = cv_set.intersection(required_set)
    matched_preferred = cv_set.intersection(preferred_set)
    missing_required = required_set - cv_set

    # Score calculation:
    # - Required skills are worth 80% of skills score
    # - Preferred skills are worth 20% of skills score
    required_ratio = len(matched_required) / len(required_set) if required_set else 0
    preferred_ratio = len(matched_preferred) / len(preferred_set) if preferred_set else 0

    if preferred_set:
        score = (required_ratio * 80) + (preferred_ratio * 20)
    else:
        score = required_ratio * 100

    # Bonus: partial matches (e.g., CV has 'React.js', JD has 'React')
    for req_skill in missing_required.copy():
        for cv_skill in cv_set:
            # Check if one contains the other
            if req_skill in cv_skill or cv_skill in req_skill:
                score = min(100, score + 5)   # Partial credit
                break

    matched = list(matched_required | matched_preferred)
    missing = list(missing_required)

    return round(min(score, 100), 2), matched, missing


# -----------------------------------------------------------
# Experience Matching
# -----------------------------------------------------------
def match_experience(cv_experience_years, job_min_exp, job_max_exp):
    """
    Score candidate experience against job requirements.
    
    Returns score 0-100.
    """
    if cv_experience_years is None:
        return 40.0   # Unknown experience gets a neutral score

    cv_years = float(cv_experience_years)
    min_exp = float(job_min_exp or 0)
    max_exp = float(job_max_exp or 10)

    if cv_years >= min_exp and cv_years <= max_exp:
        # Perfect fit
        return 100.0
    elif cv_years < min_exp:
        # Under-qualified: score decreases as gap increases
        gap = min_exp - cv_years
        score = max(0, 100 - (gap * 15))
        return round(score, 2)
    else:
        # Over-qualified: slight penalty (might be overqualified)
        gap = cv_years - max_exp
        score = max(70, 100 - (gap * 5))
        return round(score, 2)


# -----------------------------------------------------------
# Education Matching
# -----------------------------------------------------------
def match_education(cv_education_level, job_required_education):
    """
    Score candidate education against job requirements.
    
    Returns score 0-100.
    """
    if not cv_education_level or not job_required_education:
        return 50.0   # Unknown education = neutral

    cv_level = EDUCATION_LEVELS.get(cv_education_level.lower(), 2)
    required_level = EDUCATION_LEVELS.get(job_required_education.lower(), 2)

    if job_required_education == 'any':
        return 100.0

    if cv_level >= required_level:
        # Meets or exceeds requirements
        return 100.0
    else:
        # Below required level
        gap = required_level - cv_level
        score = max(30, 100 - (gap * 20))
        return round(score, 2)


# -----------------------------------------------------------
# Determine Ranking Label from Score
# -----------------------------------------------------------
def get_ranking_label(overall_score):
    """
    Assign a human-readable recommendation label based on match %.
    """
    if overall_score >= 80:
        return 'Highly Recommended'
    elif overall_score >= 65:
        return 'Recommended'
    elif overall_score >= 50:
        return 'Average Fit'
    elif overall_score >= 35:
        return 'Below Average'
    else:
        return 'Not Recommended'


# -----------------------------------------------------------
# Main Analysis Function
# -----------------------------------------------------------
def analyze_cv_against_job(cv_data, job):
    """
    Perform complete NLP analysis of a CV against a job posting.
    
    Args:
        cv_data (dict): Parsed CV data from cv_parser.py
        job (Job): SQLAlchemy Job model instance
    
    Returns:
        dict: Complete analysis results with scores and labels
    """
    # 1. Extract job skills
    required_skills = job.required_skills.split(',') if job.required_skills else []
    preferred_skills = job.preferred_skills.split(',') if job.preferred_skills else []
    required_skills = [s.strip() for s in required_skills if s.strip()]
    preferred_skills = [s.strip() for s in preferred_skills if s.strip()]

    # 2. Skills matching
    cv_skills = cv_data.get('extracted_skills', [])
    skills_score, matched_skills, missing_skills = match_skills(
        cv_skills, required_skills, preferred_skills
    )

    # 3. Experience matching
    cv_years = cv_data.get('years_experience')
    experience_score = match_experience(cv_years, job.min_experience, job.max_experience)

    # 4. Education matching
    # Try to detect education level from extracted education data
    cv_edu_level = detect_education_level(cv_data.get('extracted_education', []))
    education_score = match_education(cv_edu_level, job.education_required)

    # 5. Text similarity (CV raw text vs job description)
    cv_text = cv_data.get('raw_text', '')
    job_text = f"{job.title} {job.description} {job.requirements}"
    text_similarity = compute_text_similarity(cv_text, job_text)

    # 6. Compute weighted overall score
    # Skills: 50% weight (most important for tech jobs)
    # Experience: 30% weight
    # Education: 20% weight
    overall_score = (skills_score * 0.50) + (experience_score * 0.30) + (education_score * 0.20)

    # Boost score slightly if high text similarity
    if text_similarity > 0.3:
        overall_score = min(100, overall_score + (text_similarity * 5))

    overall_score = round(overall_score, 2)

    # 7. Get ranking label
    ranking_label = get_ranking_label(overall_score)

    return {
        'overall_match_score': overall_score,
        'skills_match_score': round(skills_score, 2),
        'experience_match_score': round(experience_score, 2),
        'education_match_score': round(education_score, 2),
        'text_similarity': round(text_similarity * 100, 2),
        'ranking_label': ranking_label,
        'matched_skills': matched_skills,
        'missing_skills': missing_skills,
        'extracted_skills': json.dumps(cv_skills),
        'extracted_education': json.dumps(cv_data.get('extracted_education', [])),
    }


def detect_education_level(education_entries):
    """
    Detect the highest education level from extracted education data.
    """
    level_keywords = {
        'phd': ['phd', 'doctorate', 'doctor of philosophy'],
        'master': ['master', 'msc', 'mba', 'm.sc', 'postgraduate'],
        'bachelor': ['bachelor', 'bsc', 'b.sc', 'degree', 'undergraduate', 'b.eng'],
        'diploma': ['diploma', 'hnd', 'higher national'],
        'certificate': ['certificate', 'cert'],
    }

    highest = None
    highest_level = 0

    for entry in education_entries:
        context = (entry.get('degree', '') + ' ' + entry.get('context', '')).lower()
        for level, keywords in level_keywords.items():
            if any(kw in context for kw in keywords):
                if EDUCATION_LEVELS.get(level, 0) > highest_level:
                    highest = level
                    highest_level = EDUCATION_LEVELS[level]

    return highest


# -----------------------------------------------------------
# Duplicate CV Detection
# -----------------------------------------------------------
def detect_duplicate_cv(new_cv_text, existing_cv_texts):
    """
    Check if a newly uploaded CV is very similar to existing ones.
    Used to prevent duplicate applications.
    
    Returns: (is_duplicate: bool, similarity_score: float)
    """
    if not existing_cv_texts:
        return False, 0.0

    for existing_text in existing_cv_texts:
        score = compute_text_similarity(new_cv_text, existing_text)
        if score > 0.90:   # 90% similarity threshold
            return True, score

    return False, 0.0
