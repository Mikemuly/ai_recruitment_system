# =============================================================
# app/services/cv_parser.py — CV file parsing service
# Extracts raw text from PDF and DOCX files
# =============================================================
import os
import re
import json


def extract_text_from_pdf(file_path):
    """
    Extract text from a PDF file using PyMuPDF (fitz).
    Returns raw text string.
    """
    try:
        import fitz  # PyMuPDF
        text = ""
        with fitz.open(file_path) as doc:
            for page in doc:
                text += page.get_text()
        return text.strip()
    except ImportError:
        raise ImportError("PyMuPDF not installed. Run: pip install PyMuPDF")
    except Exception as e:
        raise Exception(f"Failed to parse PDF: {str(e)}")


def extract_text_from_docx(file_path):
    """
    Extract text from a DOCX file using python-docx.
    Returns raw text string.
    """
    try:
        from docx import Document
        doc = Document(file_path)
        paragraphs = [para.text for para in doc.paragraphs if para.text.strip()]
        # Also get text from tables
        for table in doc.tables:
            for row in table.rows:
                for cell in row.cells:
                    if cell.text.strip():
                        paragraphs.append(cell.text)
        return '\n'.join(paragraphs)
    except ImportError:
        raise ImportError("python-docx not installed. Run: pip install python-docx")
    except Exception as e:
        raise Exception(f"Failed to parse DOCX: {str(e)}")


def extract_cv_text(file_path):
    """
    Main entry point: detect file type and extract text accordingly.
    Returns: raw text string
    """
    ext = os.path.splitext(file_path)[1].lower()

    if ext == '.pdf':
        return extract_text_from_pdf(file_path)
    elif ext == '.docx':
        return extract_text_from_docx(file_path)
    else:
        raise ValueError(f"Unsupported file type: {ext}. Only PDF and DOCX are supported.")


# -----------------------------------------------------------
# Information extraction from raw CV text
# -----------------------------------------------------------

def extract_email(text):
    """Extract email address from text using regex."""
    pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
    matches = re.findall(pattern, text)
    return matches[0] if matches else None


def extract_phone(text):
    """
    Extract Kenyan or international phone numbers.
    Handles formats: +254, 07xx, 01xx
    """
    patterns = [
        r'\+254[\s-]?\d{3}[\s-]?\d{3}[\s-]?\d{3}',   # +254 format
        r'0[17]\d{2}[\s-]?\d{3}[\s-]?\d{3}',           # 07xx/01xx format
        r'\+\d{1,3}[\s-]?\d{3,14}',                     # Generic international
    ]
    for pattern in patterns:
        match = re.search(pattern, text)
        if match:
            return match.group().strip()
    return None


def extract_name(text):
    """
    Attempt to extract candidate name from the first few lines of the CV.
    Names typically appear at the top before email/phone.
    """
    lines = [line.strip() for line in text.split('\n') if line.strip()]
    # Try the first 5 non-empty lines, pick ones that look like names
    for line in lines[:5]:
        # Name lines: typically 2-4 words, title-cased, no special chars
        words = line.split()
        if 2 <= len(words) <= 4 and all(w[0].isupper() for w in words if w):
            # Exclude lines that look like job titles or addresses
            exclusions = ['nairobi', 'kenya', 'email', 'phone', 'mobile', 'address', 'linkedin']
            if not any(excl in line.lower() for excl in exclusions):
                return line
    return None


def extract_skills(text, known_skills=None):
    """
    Extract technical skills from CV text.
    Matches against a comprehensive list of tech skills.
    Returns a list of found skills.
    """
    if known_skills is None:
        # Comprehensive tech skills keyword list
        known_skills = [
            # Programming languages
            'python', 'java', 'javascript', 'typescript', 'c++', 'c#', 'php', 'ruby',
            'go', 'rust', 'swift', 'kotlin', 'scala', 'r', 'matlab',
            # Web frameworks
            'django', 'flask', 'fastapi', 'react', 'vue', 'angular', 'next.js',
            'express', 'laravel', 'spring', 'rails',
            # Databases
            'mysql', 'postgresql', 'mongodb', 'redis', 'sqlite', 'oracle',
            'firebase', 'dynamodb', 'cassandra', 'elasticsearch',
            # Cloud & DevOps
            'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform', 'jenkins',
            'github actions', 'ci/cd', 'linux', 'nginx', 'apache',
            # Data & AI
            'machine learning', 'deep learning', 'tensorflow', 'pytorch', 'keras',
            'scikit-learn', 'pandas', 'numpy', 'matplotlib', 'power bi', 'tableau',
            'data analysis', 'nlp', 'computer vision',
            # Other tech
            'git', 'rest api', 'graphql', 'microservices', 'html', 'css',
            'tailwind css', 'bootstrap', 'jquery', 'node.js', 'npm',
            # Soft skills (domain-relevant)
            'agile', 'scrum', 'project management',
        ]

    text_lower = text.lower()
    found = []
    for skill in known_skills:
        # Word boundary matching for accurate detection
        pattern = r'\b' + re.escape(skill.lower()) + r'\b'
        if re.search(pattern, text_lower):
            found.append(skill.title() if len(skill) > 3 else skill.upper())

    return list(set(found))


def extract_education(text):
    """
    Extract education section from CV text.
    Returns a list of education entries.
    """
    education = []

    # Common degree keywords
    degree_patterns = [
        r'(bachelor|b\.sc|b\.eng|bsc|ba|bcom)[\w\s.]*',
        r'(master|m\.sc|msc|mba|m\.eng)[\w\s.]*',
        r'(phd|doctorate|doctor)[\w\s.]*',
        r'(diploma|certificate|higher national)[\w\s.]*',
    ]

    # Look for degree patterns
    for pattern in degree_patterns:
        matches = re.finditer(pattern, text, re.IGNORECASE)
        for match in matches:
            # Get surrounding context (50 chars each side)
            start = max(0, match.start() - 10)
            end = min(len(text), match.end() + 80)
            context = text[start:end].strip()
            education.append({
                'degree': match.group().strip(),
                'context': context[:200]   # limit context length
            })

    return education[:5]   # Return at most 5 entries


def extract_years_experience(text):
    """
    Estimate years of experience from CV text.
    Looks for explicit mentions like '3 years experience'.
    """
    patterns = [
        r'(\d+\.?\d*)\+?\s*years?\s+(?:of\s+)?experience',
        r'experience\s+of\s+(\d+\.?\d*)\+?\s*years?',
    ]
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return float(match.group(1))
    return None


def parse_full_cv(file_path):
    """
    Main CV parsing function.
    Extracts all structured information from a CV file.
    Returns a dict with all extracted fields.
    """
    # Step 1: Extract raw text
    raw_text = extract_cv_text(file_path)

    # Step 2: Extract structured info from text
    result = {
        'raw_text': raw_text,
        'extracted_name': extract_name(raw_text),
        'extracted_email': extract_email(raw_text),
        'extracted_phone': extract_phone(raw_text),
        'extracted_skills': extract_skills(raw_text),
        'extracted_education': extract_education(raw_text),
        'years_experience': extract_years_experience(raw_text),
        'word_count': len(raw_text.split()),
    }

    return result
