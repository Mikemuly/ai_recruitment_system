import os
import json

OPENAI_API_KEY = os.getenv('OPENAI_API_KEY', '')
OPENAI_AVAILABLE = bool(OPENAI_API_KEY and OPENAI_API_KEY != 'sk-your-openai-api-key-here')

client = None
if OPENAI_AVAILABLE:
    try:
        from openai import OpenAI
        client = OpenAI(api_key=OPENAI_API_KEY)
    except Exception:
        OPENAI_AVAILABLE = False

MODEL = os.getenv('OPENAI_MODEL', 'gpt-3.5-turbo')


def generate_candidate_summary(cv_text, job_title, match_score, matched_skills, missing_skills):
    matched_str = ', '.join(matched_skills[:3]) if matched_skills else 'several key areas'
    missing_str = ', '.join(missing_skills[:2]) if missing_skills else 'minor areas'
    if match_score >= 80:
        return (f"This candidate demonstrates strong alignment with the {job_title} position. "
                f"Their skill set closely matches the job requirements, particularly in {matched_str}. "
                f"With a match score of {match_score}%, they are highly recommended for interview.")
    elif match_score >= 65:
        return (f"This candidate shows good alignment with the {job_title} role. "
                f"They possess relevant skills including {matched_str}. "
                f"Some gaps in {missing_str} may require attention. Recommend proceeding to interview.")
    elif match_score >= 50:
        return (f"This candidate has moderate alignment with the {job_title} position. "
                f"While they demonstrate capability in {matched_str}, key skills such as {missing_str} are missing. "
                f"Consider only if the candidate pool is limited.")
    else:
        return (f"This candidate has limited alignment with the {job_title} requirements. "
                f"Key skills such as {missing_str} are not evident. "
                f"With a match score of {match_score}%, it is recommended to focus on stronger candidates.")


def generate_interview_questions(cv_text, job_title, job_requirements, matched_skills, missing_skills):
    skill1 = matched_skills[0] if matched_skills else 'your primary technical skill'
    skill2 = matched_skills[1] if len(matched_skills) > 1 else 'relevant tools'
    gap1 = missing_skills[0] if missing_skills else 'new technologies'
    return [
        f"Walk me through a project where you used {skill1} to solve a real business problem.",
        f"How do you work with {skill2} in a team environment? Give a specific example.",
        f"Describe a time when you had to meet a tight deadline. What was your approach?",
        f"Tell me about a situation where you disagreed with a colleague. How did you handle it?",
        f"We require experience with {gap1}. What is your current level and how would you get up to speed?",
        f"Where do you see your career in 3 years and how does this {job_title} role fit into that plan?",
    ]


def ai_chatbot_response(user_message, context=None):
    msg = user_message.lower()
    if any(w in msg for w in ['cv', 'resume']):
        return ("To improve your CV: 1) Keep it to 2 pages. 2) Match skills to the job description. "
                "3) Quantify achievements. 4) Use clean formatting. 5) Include LinkedIn and GitHub.")
    elif any(w in msg for w in ['interview', 'prepare']):
        return ("Interview tips: 1) Research the company. 2) Dress professionally. "
                "3) Arrive early. 4) Use the STAR method for answers. 5) Prepare questions to ask.")
    elif any(w in msg for w in ['salary', 'negotiate']):
        return ("Salary tips: Research market rates on BrighterMonday. Give a range not a single number. "
                "Factor in benefits like medical and transport allowance.")
    elif any(w in msg for w in ['status', 'application']):
        return ("Check your application status on your dashboard. Stages: Submitted → Reviewing → "
                "Shortlisted → Interview → Offer. Follow up after 2 weeks if no response.")
    else:
        return ("Hi! I can help you with CV tips, interview preparation, salary negotiation, "
                "and understanding your application status. What would you like to know?")
