// =============================================================
// src/pages/CandidateProfile.jsx — Full AI analysis for one applicant
// =============================================================
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../components/shared/Layout';
import ScoreRing, { RankingBadge } from '../components/shared/ScoreRing';
import { aiAPI, applicationsAPI } from '../services/api';
import toast from 'react-hot-toast';
import {
  ArrowLeft, CheckCircle, XCircle, Mail, Phone, User,
  Lightbulb, MessageSquare, Copy, ChevronDown, ChevronUp
} from 'lucide-react';

export default function CandidateProfile() {
  const { appId }   = useParams();
  const [analysis, setAnalysis]   = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showQuestions, setShowQuestions] = useState(false);
  const [chatMsg, setChatMsg]     = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);

  useEffect(() => {
    Promise.all([
      aiAPI.getAnalysis(appId),
      aiAPI.getQuestions(appId),
    ]).then(([aRes, qRes]) => {
      setAnalysis(aRes.data.analysis);
      setQuestions(qRes.data.questions || []);
    }).catch(() => toast.error('Failed to load candidate analysis'))
    .finally(() => setLoading(false));
  }, [appId]);

  const copyQuestions = () => {
    const text = questions.map((q, i) => `${i + 1}. ${q}`).join('\n\n');
    navigator.clipboard.writeText(text);
    toast.success('Questions copied to clipboard!');
  };

  const sendChat = async () => {
    if (!chatMsg.trim()) return;
    const msg = chatMsg;
    setChatMsg('');
    setChatHistory(h => [...h, { role: 'user', text: msg }]);
    setChatLoading(true);
    try {
      const res = await aiAPI.chatbot({ message: msg });
      setChatHistory(h => [...h, { role: 'ai', text: res.data.response }]);
    } catch {
      setChatHistory(h => [...h, { role: 'ai', text: 'Sorry, I could not process your request.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  if (loading) return (
    <Layout title="Candidate Profile">
      <div className="flex items-center justify-center h-64"><div className="spinner w-8 h-8" /></div>
    </Layout>
  );

  if (!analysis) return (
    <Layout title="Candidate Profile">
      <div className="card text-center py-12">
        <p className="text-slate-500">No AI analysis available for this candidate yet.</p>
        <Link to={-1} className="btn-secondary mt-4 inline-flex items-center gap-2">
          <ArrowLeft size={16} /> Go back
        </Link>
      </div>
    </Layout>
  );

  const scores = [
    { label: 'Skills Match',    score: analysis.skills_match_score },
    { label: 'Experience',      score: analysis.experience_match_score },
    { label: 'Education',       score: analysis.education_match_score },
  ];

  return (
    <Layout title="Candidate AI Profile">
      <div className="max-w-4xl mx-auto space-y-5">

        {/* Back */}
        <Link to={-1} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors">
          <ArrowLeft size={15} /> Back to applicants
        </Link>

        {/* Hero card */}
        <div className="card bg-gradient-to-br from-slate-800 to-slate-700 text-white">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">

            {/* Avatar */}
            <div className="w-16 h-16 bg-brand-500 rounded-2xl flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-2xl">
                {analysis.extracted_name?.[0] || <User size={28} />}
              </span>
            </div>

            <div className="flex-1">
              <h2 className="text-xl font-bold">{analysis.extracted_name || 'Candidate'}</h2>
              <div className="flex flex-wrap gap-3 mt-2 text-sm text-slate-300">
                {analysis.extracted_email && (
                  <span className="flex items-center gap-1"><Mail size={13} />{analysis.extracted_email}</span>
                )}
                {analysis.extracted_phone && (
                  <span className="flex items-center gap-1"><Phone size={13} />{analysis.extracted_phone}</span>
                )}
              </div>
              <div className="mt-2">
                <RankingBadge label={analysis.ranking_label} />
              </div>
            </div>

            {/* Overall score ring */}
            <div className="flex-shrink-0">
              <ScoreRing score={analysis.overall_match_score} size={90} label="Overall Match" />
            </div>
          </div>
        </div>

        {/* Score breakdown */}
        <div className="grid grid-cols-3 gap-4">
          {scores.map(s => (
            <div key={s.label} className="card text-center py-5">
              <ScoreRing score={s.score} size={70} />
              <p className="text-sm font-medium text-slate-700 mt-2">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Skills analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="card">
            <h3 className="section-title mb-3 flex items-center gap-2">
              <CheckCircle size={16} className="text-green-600" /> Matched Skills
            </h3>
            {analysis.matched_skills?.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {analysis.matched_skills.map(s => (
                  <span key={s} className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-1 rounded-full">
                    ✓ {s}
                  </span>
                ))}
              </div>
            ) : <p className="text-slate-400 text-sm">No matched skills found</p>}
          </div>

          <div className="card">
            <h3 className="section-title mb-3 flex items-center gap-2">
              <XCircle size={16} className="text-red-500" /> Missing Skills
            </h3>
            {analysis.missing_skills?.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {analysis.missing_skills.map(s => (
                  <span key={s} className="bg-red-100 text-red-700 text-xs font-medium px-2.5 py-1 rounded-full">
                    ✗ {s}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-green-600 text-sm font-medium">✓ No required skills missing!</p>
            )}
          </div>
        </div>

        {/* All extracted skills */}
        {analysis.extracted_skills?.length > 0 && (
          <div className="card">
            <h3 className="section-title mb-3">All Skills Found in CV</h3>
            <div className="flex flex-wrap gap-2">
              {analysis.extracted_skills.map(s => (
                <span key={s} className="bg-slate-100 text-slate-700 text-xs font-medium px-2.5 py-1 rounded-full">{s}</span>
              ))}
            </div>
          </div>
        )}

        {/* AI Summary */}
        <div className="card border-l-4 border-brand-500">
          <h3 className="section-title mb-2 flex items-center gap-2">
            <Lightbulb size={16} className="text-brand-600" /> AI Suitability Summary
          </h3>
          <p className="text-slate-700 text-sm leading-relaxed">{analysis.ai_summary}</p>
        </div>

        {/* Interview Questions */}
        <div className="card">
          <button
            onClick={() => setShowQuestions(!showQuestions)}
            className="w-full flex items-center justify-between"
          >
            <h3 className="section-title flex items-center gap-2">
              <MessageSquare size={16} className="text-blue-600" />
              AI-Generated Interview Questions ({questions.length})
            </h3>
            {showQuestions ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
          </button>

          {showQuestions && (
            <div className="mt-4 space-y-3">
              <div className="flex justify-end">
                <button onClick={copyQuestions} className="btn-secondary flex items-center gap-1.5 text-xs py-1.5 px-3">
                  <Copy size={13} /> Copy all
                </button>
              </div>
              {questions.map((q, i) => (
                <div key={i} className="flex gap-3 p-3 bg-slate-50 rounded-lg">
                  <span className="w-6 h-6 bg-brand-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {i + 1}
                  </span>
                  <p className="text-slate-700 text-sm">{q}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AI Chat Assistant */}
        <div className="card">
          <h3 className="section-title mb-3">Ask AI About This Candidate</h3>
          <div className="bg-slate-50 rounded-xl p-3 min-h-24 max-h-48 overflow-y-auto mb-3 space-y-2">
            {chatHistory.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-4">
                Ask any question about this candidate or the hiring process...
              </p>
            ) : chatHistory.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs text-sm px-3 py-2 rounded-xl ${
                  m.role === 'user' ? 'bg-brand-600 text-white' : 'bg-white text-slate-700 border border-slate-200'
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 px-3 py-2 rounded-xl">
                  <div className="spinner w-4 h-4" />
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <input value={chatMsg} onChange={e => setChatMsg(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendChat()}
              className="form-input flex-1 text-sm"
              placeholder="e.g. What salary range is appropriate for this candidate?" />
            <button onClick={sendChat} disabled={chatLoading || !chatMsg.trim()} className="btn-primary px-4">
              Send
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
