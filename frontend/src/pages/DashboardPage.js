import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { gsap } from 'gsap';
import toast from 'react-hot-toast';
import { api } from '../utils/api';

const BUGS = [
  { sev: 'critical', title: 'No JSON-LD Schema Markup', desc: 'Blogs generated without Article + FAQPage schema. Google cannot extract structured data — snippet eligibility is 0%.', fix: 'Auto-inject JSON-LD schema during Stage 7 of the generation pipeline.' },
  { sev: 'critical', title: 'Missing Canonical Tags on Published Blogs', desc: 'Multi-platform publishing creates duplicate content signals. No canonical URL → index bloat + ranking dilution across all synced posts.', fix: 'Set rel=canonical pointing to primary domain on every syndicated version.' },
  { sev: 'critical', title: 'No robots.txt / Sitemap Auto-generation', desc: 'Dashboard-generated pages lack crawl directives. Risk: Google indexes staging URLs, draft posts, and duplicate content pages.', fix: 'Auto-generate sitemap.xml on every publish event. Expose sitemap URL in dashboard.' },
  { sev: 'medium', title: 'No Live Keyword Density Counter in Editor', desc: 'Users have no visibility into keyword density during editing. Over-stuffing risk with zero guardrails or real-time feedback.', fix: 'Implement live KD counter (target: 1.2–1.8%). Alert at >2% before publish.' },
  { sev: 'medium', title: 'CTA Placement is Always End-of-Article', desc: 'Conversion rate is highest mid-scroll (40% depth). Placing CTAs only at the end loses 60–70% of potential conversions.', fix: 'Smart CTA injection algorithm: auto-place at 40%, 75%, and 100% scroll depth.' },
  { sev: 'medium', title: 'Onboarding Has 6+ Steps Before First Blog', desc: 'Users drop off at Step 3 (API key config). Industry benchmark is ≤3 steps to first value. Each extra step = 15–20% drop-off.', fix: 'Progressive disclosure: generate first blog in 1 click with default settings. Profile setup optional.' },
  { sev: 'low', title: 'No A/B Testing for Blog Titles', desc: 'Platform generates 1 title variant. CTR optimization requires multi-variant testing across different phrasings of the same keyword.', fix: 'Generate 3 title variants per blog → track CTR → surface winner in 7 days.' },
  { sev: 'low', title: 'Analytics Shows Only Vanity Metrics', desc: 'Dashboard displays page views but not ranking position, click-through rate, impression share, or keyword movement over time.', fix: 'Integrate Google Search Console API → show rank tracking per blog per keyword.' },
];

const FEATURES = [
  { icon: '🔍', name: 'Keyword Intelligence Engine', desc: 'Real-time keyword gap finder. Shows competitors ranking for terms you\'re missing. Auto-generates content calendar from gap map.', impact: 'high', effort: 'medium' },
  { icon: '📅', name: 'Content Autopilot Calendar', desc: 'Schedule 30, 60, or 90 blogs. AI generates and auto-publishes on schedule. Weekly performance digest. True set-and-forget SEO.', impact: 'high', effort: 'medium' },
  { icon: '🌍', name: 'GEO-Local SEO Module', desc: 'Injects city/state references, local business signals, India-specific keywords. Targets city + near-me searches with precision.', impact: 'high', effort: 'low' },
  { icon: '🤖', name: 'Competitor Blog Replicator', desc: 'Paste competitor URL → AI analyzes their top blog → generates superior version filling every content gap they missed.', impact: 'high', effort: 'high' },
  { icon: '📊', name: 'Live SEO Scorecard in Editor', desc: 'Real-time SEO scoring as user edits. Tracks KD%, readability, snippet eligibility, meta length, heading structure — like Yoast, but smarter.', impact: 'medium', effort: 'medium' },
  { icon: '🔗', name: 'Auto Internal Link Builder', desc: 'Scans your blog library → auto-suggests and inserts relevant internal links → builds topic cluster authority without manual effort.', impact: 'medium', effort: 'high' },
];

const FUNNEL = [
  { stage: 'Landing Page Visit', pct: 100, color: '#2563eb' },
  { stage: 'Click Sign Up', pct: 55, drop: 45, color: '#7c3aed' },
  { stage: 'Account Created', pct: 32, drop: 23, color: '#059669' },
  { stage: 'First Blog Generated', pct: 17, drop: 15, color: '#d97706' },
  { stage: 'Converts to Paid', pct: 12, drop: 5, color: '#dc2626' },
];

const COMPARE = [
  ['India GEO Optimization', '✓', '✗', '✗'],
  ['Auto Multi-Platform Publish', '✓', 'Partial', '✗'],
  ['SERP Gap Analysis', '✓', '✗', 'Partial'],
  ['FAQPage Schema Auto-inject', '✓', '✗', '✗'],
  ['Streaming Blog Generation', '✓', '✗', '✗'],
  ['India INR Pricing', '₹999/mo', '$49/mo', '$89/mo'],
  ['Rank Tracking Built-in', 'Roadmap', '✗', '✗'],
];

const sevConfig = {
  critical: { color: '#dc2626', bg: '#fef2f2', label: 'Critical' },
  medium:   { color: '#d97706', bg: '#fffbeb', label: 'Medium' },
  low:      { color: '#059669', bg: '#ecfdf5', label: 'Low' },
};

export default function DashboardPage() {
  const [tab, setTab] = useState('bugs');
  const [aiResult, setAiResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const headerRef = useRef(null);

  useEffect(() => {
    gsap.fromTo(headerRef.current, { opacity: 0, y: -16 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' });
  }, []);

  const runAnalysis = async () => {
    setLoading(true);
    toast('Running AI product analysis with Groq...', { icon: '🤖' });
    try {
      const res = await api.dashboardAnalysis();
      if (res.success) { setAiResult(res.data); toast.success('AI analysis complete!'); }
      else throw new Error('Analysis failed');
    } catch (e) { toast.error(e.message); }
    setLoading(false);
  };

  const TABS = [
    { id: 'bugs', label: '🐛 Bugs & Issues' },
    { id: 'funnel', label: '📉 Conversion Funnel' },
    { id: 'features', label: '✨ Feature Roadmap' },
    { id: 'growth', label: '📈 Growth Strategy' },
  ];

  return (
    <div>
      <div className="page-header" ref={headerRef}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div className="page-eyebrow">Part 2 — Product Critique</div>
            <h1 className="page-title">Dashboard <em>Analysis</em></h1>
            <p className="page-desc">Critical evaluation of the Blogy dashboard across UX, SEO structure, conversion funnel, and feature opportunities.</p>
          </div>
          <button className="btn btn-secondary" onClick={runAnalysis} disabled={loading} style={{ flexShrink: 0 }}>
            {loading ? <><span className="spin">⚙</span> Analyzing...</> : '🤖 Run AI Analysis'}
          </button>
        </div>
      </div>

      {/* AI result banner */}
      <AnimatePresence>
        {aiResult && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <div className="card-accent">
              <div className="card-label" style={{ color: 'var(--accent)' }}>Groq AI Live Analysis Result</div>
              {aiResult.competitiveDiff && (
                <p style={{ fontSize: 14, color: 'var(--ink2)', fontStyle: 'italic', marginBottom: 12 }}>"{aiResult.competitiveDiff}"</p>
              )}
              {aiResult.newFeatures?.length > 0 && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {aiResult.newFeatures.slice(0, 5).map((f, i) => <span key={i} className="tag tag-blue">{f.name}</span>)}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <div className="inline-tabs mb-6">
        {TABS.map(t => (
          <button key={t.id} className={`inline-tab${tab === t.id ? ' active' : ''}`} onClick={() => setTab(t.id)}>{t.label}</button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.22 }}>

          {tab === 'bugs' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {BUGS.map((bug, i) => {
                const sc = sevConfig[bug.sev];
                return (
                  <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
                    <div className="card" style={{ display: 'flex', gap: 0, padding: 0, overflow: 'hidden' }}>
                      <div style={{ width: 4, background: sc.color, flexShrink: 0 }} />
                      <div style={{ padding: '16px 20px', flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 7 }}>
                          <span className="tag" style={{ background: sc.bg, color: sc.color, fontSize: 10 }}>{sc.label}</span>
                          <span style={{ fontSize: 14, fontWeight: 700 }}>{bug.title}</span>
                        </div>
                        <p style={{ fontSize: 13, color: 'var(--ink3)', marginBottom: 8, lineHeight: 1.6 }}>{bug.desc}</p>
                        <div style={{ fontSize: 12, color: 'var(--green)', display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                          <span>✅</span>
                          <span><strong>Fix:</strong> {bug.fix}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {tab === 'funnel' && (
            <div className="grid-2">
              <div className="card">
                <div className="card-label">Conversion Funnel Drop-off</div>
                {FUNNEL.map((stage, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }} style={{ marginBottom: 18 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                      <span style={{ fontWeight: 600, color: 'var(--ink2)' }}>{stage.stage}</span>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        {stage.drop && <span style={{ fontSize: 11, color: 'var(--red)', fontFamily: 'var(--mono)' }}>−{stage.drop}%</span>}
                        <span style={{ fontWeight: 800, fontFamily: 'var(--mono)', color: stage.color }}>{stage.pct}%</span>
                      </div>
                    </div>
                    <div className="metric-bar">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${stage.pct}%` }} transition={{ duration: 1, delay: i * 0.1 + 0.3 }}
                        style={{ height: '100%', background: stage.color, borderRadius: 99 }} />
                    </div>
                  </motion.div>
                ))}
                <div className="alert alert-info" style={{ marginTop: 16 }}>
                  Industry benchmark for SaaS: 3–5% free→paid. Blogy at 12% = above average. Target: 18% via UX fixes.
                </div>
              </div>
              <div className="card">
                <div className="card-label">Recommended 5-Step User Flow</div>
                <div className="pipeline">
                  {[
                    { n: '1', t: 'Sign Up → Instant Value (30s)', d: 'Email only, skip all setup → land on LIVE DEMO with pre-filled keyword → show generated blog instantly. First value before paywall.' },
                    { n: '2', t: 'Keyword Intelligence Dashboard', d: 'User enters niche → system surfaces top 10 keyword opportunities with volume + competition scores.' },
                    { n: '3', t: 'One-Click Generation + Live SEO Score', d: 'Generate → live SEO score updates in real-time → show projected traffic → edit inline → publish to 5+ platforms.' },
                    { n: '4', t: 'Blog Performance Tracker', d: 'GSC integration shows rank movement per blog per keyword. Weekly digest email keeps users engaged, reduces churn.' },
                    { n: '5', t: 'Autopilot Mode (Premium)', d: 'Schedule 30 blogs/month → AI generates and publishes automatically → true "organic traffic on autopilot" pitch.' },
                  ].map((item, i) => (
                    <div className="pipe-item" key={i}>
                      <div className="pipe-badge pipe-badge-blue">{item.n}</div>
                      <div><div className="pipe-title">{item.t}</div><div className="pipe-desc">{item.d}</div></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === 'features' && (
            <div className="grid-3">
              {FEATURES.map((f, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }} whileHover={{ y: -3 }}>
                  <div className="card" style={{ transition: 'all 0.2s', cursor: 'default', height: '100%' }}>
                    <div style={{ fontSize: 26, marginBottom: 10 }}>{f.icon}</div>
                    <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 6, color: 'var(--ink)' }}>{f.name}</div>
                    <p style={{ fontSize: 12.5, color: 'var(--ink3)', lineHeight: 1.65, marginBottom: 14 }}>{f.desc}</p>
                    <div style={{ display: 'flex', gap: 6, marginTop: 'auto' }}>
                      <span className={`tag ${f.impact === 'high' ? 'tag-green' : 'tag-amber'}`}>{f.impact} impact</span>
                      <span className="tag tag-gray">{f.effort} effort</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {tab === 'growth' && (
            <div className="grid-2">
              <div className="card">
                <div className="card-label">Competitive Differentiation</div>
                <table className="data-table" style={{ marginTop: 8 }}>
                  <thead>
                    <tr>
                      <th>Feature</th>
                      <th style={{ color: 'var(--accent)' }}>Blogy</th>
                      <th>Jasper</th>
                      <th>SurferSEO</th>
                    </tr>
                  </thead>
                  <tbody>
                    {COMPARE.map(([feat, ...vals], i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 600 }}>{feat}</td>
                        <td style={{ fontWeight: 700, color: 'var(--accent)' }}>{vals[0]}</td>
                        <td style={{ color: vals[1] === '✗' ? 'var(--red)' : vals[1] === '✓' ? 'var(--green)' : 'var(--amber)' }}>{vals[1]}</td>
                        <td style={{ color: vals[2] === '✗' ? 'var(--red)' : vals[2] === '✓' ? 'var(--green)' : 'var(--amber)' }}>{vals[2]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="card">
                <div className="card-label">Go-to-Market Roadmap — India</div>
                <div className="pipeline">
                  {[
                    { q: 'Q1', t: 'Product-Led Growth', d: 'Free tier: 3 blogs/month, no credit card. Target YC India & Startup India cohorts. Goal: 500 active free users, 12% paid conversion.' },
                    { q: 'Q2', t: 'Agency Channel Program', d: 'White-label reseller program. 40% margin share for digital agencies. They sell "AI SEO blog service" powered by Blogy. Goal: 20 agency partners.' },
                    { q: 'Q3', t: 'Enterprise & D2C Brands', d: 'Custom plans for e-commerce brands (Meesho sellers, D2C). 500+ blogs/month, API access, dedicated manager. Goal: 5 enterprise clients.' },
                    { q: 'Q4', t: 'Series A Readiness', d: 'MRR target: ₹25L. 2,000 paying users. Launch rank-tracking feature. Begin SEA market expansion (SG, MY, PH).' },
                  ].map((item, i) => (
                    <div className="pipe-item" key={i}>
                      <div className="pipe-badge" style={{ background: 'var(--accent-light)', color: 'var(--accent)', fontSize: 10 }}>{item.q}</div>
                      <div><div className="pipe-title">{item.t}</div><div className="pipe-desc">{item.d}</div></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
