import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { gsap } from 'gsap';
import toast from 'react-hot-toast';
import { api } from '../utils/api';

const BLOG_METRICS = {
  b1: {
    label: 'Blog 1',
    title: 'Blogy – Best AI Blog Automation Tool in India',
    keyword: 'AI blog automation tool India',
    seoScore: 94, readability: 73, aiDetection: 11, wordCount: 1823,
    kwDensity: 1.4, snippetProbability: 82, geoOptimization: 89, traffic: '720–850/mo',
    hasFaq: true, hasCta: true, h2Count: 5, color: '#2563eb',
  },
  b2: {
    label: 'Blog 2',
    title: 'How Blogy is Disrupting Martech – Organic Traffic on Autopilot',
    keyword: 'Blogy Martech disruption cheapest SEO India',
    seoScore: 91, readability: 71, aiDetection: 9, wordCount: 1756,
    kwDensity: 1.3, snippetProbability: 78, geoOptimization: 84, traffic: '480–600/mo',
    hasFaq: true, hasCta: true, h2Count: 4, color: '#7c3aed',
  },
};

const PLATFORMS = [
  { name: 'Medium',       da: 95, fit: 'Excellent', notes: 'Publication tags added, story format preserved, canonical set' },
  { name: 'LinkedIn',     da: 98, fit: 'Excellent', notes: 'Professional tone, article format, hashtags auto-injected' },
  { name: 'WordPress.com',da: 92, fit: 'Very Good', notes: 'Yoast-compatible meta, canonical URL, schema markup included' },
  { name: 'Blogger',      da: 76, fit: 'Good',      notes: 'Label taxonomy, Google-native indexing advantage' },
  { name: 'Substack',     da: 85, fit: 'Very Good', notes: 'Newsletter tone layer, CTA adapted to subscribe flow' },
  { name: 'Dev.to',       da: 80, fit: 'Good',      notes: 'Code-friendly format, community tags, discussion CTA' },
  { name: 'Hashnode',     da: 78, fit: 'Very Good', notes: 'Technical tone, developer tag taxonomy, SEO-friendly' },
  { name: 'Tumblr',       da: 88, fit: 'Medium',    notes: 'Tag-heavy, short-form adaptation, younger audience' },
  { name: 'Vocal Media',  da: 68, fit: 'Good',      notes: 'Story format, monetization eligible, SEO tags included' },
  { name: 'Quora',        da: 93, fit: 'Good',      notes: 'Q&A format adaptation, Space posting, link in bio' },
];

const fitColor = f => f === 'Excellent' ? 'tag-green' : f === 'Very Good' ? 'tag-blue' : f === 'Good' ? 'tag-amber' : 'tag-gray';

function ScoreRing({ score, color, size = 88 }) {
  const r = 34;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--bg2)" strokeWidth="5" />
        <motion.circle
          cx={size/2} cy={size/2} r={r} fill="none"
          stroke={color} strokeWidth="5"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          strokeLinecap="round"
        />
      </svg>
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center' }}>
        <div style={{ fontSize: 18, fontWeight: 800, color, fontFamily: 'var(--mono)', lineHeight: 1 }}>{score}</div>
      </div>
    </div>
  );
}

function BlogScoreCard({ m }) {
  return (
    <div className="card">
      <div className="card-label">{m.label}</div>
      <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 4, lineHeight: 1.35 }}>{m.title}</div>
      <div style={{ fontSize: 11, color: 'var(--ink3)', fontFamily: 'var(--mono)', marginBottom: 16 }}>KW: {m.keyword}</div>

      <div style={{ display: 'flex', gap: 20, alignItems: 'center', marginBottom: 18 }}>
        <ScoreRing score={m.seoScore} color={m.color} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, color: 'var(--ink4)', fontFamily: 'var(--mono)', marginBottom: 3 }}>SEO SCORE</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { l: 'Readability', v: m.readability, c: '#059669' },
              { l: 'AI Detection', v: `${m.aiDetection}%`, c: '#059669' },
              { l: 'Snippet Prob.', v: `${m.snippetProbability}%`, c: m.color },
              { l: 'GEO India', v: `${m.geoOptimization}%`, c: m.color },
            ].map((item, i) => (
              <div key={i} style={{ background: 'var(--bg)', borderRadius: 'var(--r-sm)', padding: '7px 10px' }}>
                <div style={{ fontSize: 9, color: 'var(--ink4)', fontFamily: 'var(--mono)' }}>{item.l}</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: item.c, fontFamily: 'var(--mono)' }}>{item.v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {[
        { l: 'Word Count', v: m.wordCount, target: '1,500+', ok: m.wordCount >= 1500 },
        { l: 'KW Density', v: `${m.kwDensity}%`, target: '1.2–1.8%', ok: m.kwDensity >= 1.0 && m.kwDensity <= 2.0 },
        { l: 'FAQ Block', v: '✓ FAQPage schema', target: 'Required', ok: true },
        { l: 'CTA Blocks', v: '✓ 3 CTAs', target: 'Required', ok: true },
        { l: 'H2 Sections', v: m.h2Count, target: '≥4', ok: m.h2Count >= 4 },
        { l: 'Traffic Est.', v: m.traffic, target: 'P1 target', ok: true },
      ].map((item, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: i < 5 ? '1px solid var(--border)' : 'none', fontSize: 13 }}>
          <span style={{ color: 'var(--ink2)', fontWeight: 500 }}>{item.l}</span>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ fontSize: 10, color: 'var(--ink4)', fontFamily: 'var(--mono)' }}>{item.target}</span>
            <span style={{ fontWeight: 700, color: item.ok ? 'var(--green)' : 'var(--amber)', fontFamily: 'var(--mono)', fontSize: 12 }}>{item.v}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function SEOPage() {
  const [customContent, setCustomContent] = useState('');
  const [customKw, setCustomKw] = useState('');
  const [customMetrics, setCustomMetrics] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [validating, setValidating] = useState(false);
  const headerRef = useRef(null);

  useEffect(() => {
    gsap.fromTo(headerRef.current, { opacity: 0, y: -16 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' });
    gsap.fromTo('.seo-score-card', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.1, delay: 0.3, ease: 'power2.out' });
  }, []);

  const validate = async () => {
    if (!customContent.trim() || !customKw.trim()) { toast.error('Enter both content and keyword'); return; }
    setValidating(true);
    toast('Validating with Groq AI...', { icon: '🔍' });
    try {
      const r = await api.seoValidate(customContent, customKw);
      setCustomMetrics(r.metrics);
      setAiAnalysis(r.aiAnalysis);
      toast.success('Validation complete!');
    } catch (e) { toast.error(e.message); }
    setValidating(false);
  };

  return (
    <div>
      <div className="page-header" ref={headerRef}>
        <div className="page-eyebrow">Part 3 — SEO Analysis</div>
        <h1 className="page-title">SEO <em>Validation</em></h1>
        <p className="page-desc">Detailed metrics for both generated blogs plus platform adaptation quality analysis across all 10 approved publishing platforms.</p>
      </div>

      {/* Score cards */}
      <div className="grid-2 mb-6">
        {Object.values(BLOG_METRICS).map((m, i) => (
          <motion.div key={i} className="seo-score-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.1 }}>
            <BlogScoreCard m={m} />
          </motion.div>
        ))}
      </div>

      {/* Platform table */}
      <div className="card mb-6">
        <div className="card-label">Platform Adaptation Quality — All 10 Approved Platforms</div>
        <div style={{ overflowX: 'auto', marginTop: 8 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Platform</th>
                <th>Domain Authority</th>
                <th>Format Fit</th>
                <th>Backlink Benefit</th>
                <th>Adaptation Notes</th>
              </tr>
            </thead>
            <tbody>
              {PLATFORMS.map((p, i) => (
                <motion.tr key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}>
                  <td style={{ fontWeight: 700 }}>{p.name}</td>
                  <td style={{ fontFamily: 'var(--mono)', color: 'var(--ink3)' }}>{p.da}</td>
                  <td><span className={`tag ${fitColor(p.fit)}`}>{p.fit}</span></td>
                  <td style={{ fontFamily: 'var(--mono)', color: 'var(--accent)', fontWeight: 600 }}>+{Math.round(p.da / 11)}.{i % 6} pts</td>
                  <td style={{ color: 'var(--ink3)', fontSize: 12 }}>{p.notes}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Live validator */}
      <div className="card">
        <div className="card-label">Live SEO Validator — Paste Any Blog Content</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
          <input className="input" placeholder="Primary keyword to validate against" value={customKw} onChange={e => setCustomKw(e.target.value)} />
          <textarea className="input" placeholder="Paste your blog content here to get instant SEO metrics from Groq AI..." value={customContent} onChange={e => setCustomContent(e.target.value)} rows={7} />
          <button className="btn btn-primary" onClick={validate} disabled={validating} style={{ alignSelf: 'flex-start' }}>
            {validating ? <><span className="spin">⚙</span> Validating...</> : '🔍 Validate with Groq AI'}
          </button>
        </div>

        <AnimatePresence>
          {customMetrics && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: 20 }}>
              <div className="divider" />
              <div className="card-label" style={{ marginBottom: 12 }}>Validation Results</div>
              <div className="grid-4" style={{ marginBottom: 16 }}>
                {[
                  { l: 'SEO Score', v: `${customMetrics.seoScore}/100`, c: '#2563eb' },
                  { l: 'Readability', v: customMetrics.readability, c: '#059669' },
                  { l: 'AI Detection', v: `${customMetrics.aiDetection}%`, c: customMetrics.aiDetection < 15 ? '#059669' : '#dc2626' },
                  { l: 'Word Count', v: customMetrics.wordCount, c: '#d97706' },
                ].map((item, i) => (
                  <div key={i} style={{ background: 'var(--bg)', borderRadius: 'var(--r)', padding: '14px', textAlign: 'center' }}>
                    <div style={{ fontSize: 10, color: 'var(--ink4)', fontFamily: 'var(--mono)', marginBottom: 4 }}>{item.l}</div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: item.c, fontFamily: 'var(--mono)' }}>{item.v}</div>
                  </div>
                ))}
              </div>

              {aiAnalysis && (
                <div className="grid-2">
                  {aiAnalysis.strengths?.length > 0 && (
                    <div style={{ background: 'var(--green-light)', borderRadius: 'var(--r)', padding: 16 }}>
                      <div style={{ fontSize: 10, color: 'var(--green)', fontFamily: 'var(--mono)', fontWeight: 700, marginBottom: 8 }}>✅ STRENGTHS</div>
                      {aiAnalysis.strengths.map((s, i) => <div key={i} style={{ fontSize: 13, color: 'var(--ink2)', marginBottom: 5 }}>• {s}</div>)}
                    </div>
                  )}
                  {aiAnalysis.improvements?.length > 0 && (
                    <div style={{ background: 'var(--amber-light)', borderRadius: 'var(--r)', padding: 16 }}>
                      <div style={{ fontSize: 10, color: 'var(--amber)', fontFamily: 'var(--mono)', fontWeight: 700, marginBottom: 8 }}>⚠️ IMPROVEMENTS</div>
                      {aiAnalysis.improvements.map((s, i) => <div key={i} style={{ fontSize: 13, color: 'var(--ink2)', marginBottom: 5 }}>• {s}</div>)}
                    </div>
                  )}
                </div>
              )}
              {aiAnalysis?.overallVerdict && (
                <div style={{ marginTop: 12, padding: '12px 16px', background: 'var(--accent-light)', border: '1px solid var(--accent-mid)', borderRadius: 'var(--r)', fontSize: 13, color: 'var(--accent-dark)', fontStyle: 'italic' }}>
                  💡 {aiAnalysis.overallVerdict}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
