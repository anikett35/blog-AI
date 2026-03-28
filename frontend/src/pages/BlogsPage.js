import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { gsap } from 'gsap';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import toast from 'react-hot-toast';
import { api } from '../utils/api';

const CONFIGS = {
  1: {
    title: 'Blogy – Best AI Blog Automation Tool in India',
    subtitle: 'Product review · Commercial intent · India GEO · 1,800+ words',
    keyword: 'AI blog automation tool India',
    platforms: ['Medium', 'LinkedIn', 'WordPress', 'Substack', 'Dev.to'],
    color: '#2563eb',
    bgColor: '#eff6ff',
    borderColor: '#bfdbfe',
  },
  2: {
    title: 'How Blogy is Disrupting Martech – Organic Traffic on Autopilot, Cheapest SEO',
    subtitle: 'Thought leadership · Martech disruption · India market analysis',
    keyword: 'Blogy Martech disruption cheapest SEO India',
    platforms: ['Medium', 'LinkedIn', 'Hashnode', 'Vocal Media', 'Blogger'],
    color: '#7c3aed',
    bgColor: '#f5f3ff',
    borderColor: '#ddd6fe',
  },
};

const STAGE_LABELS = ['', 'Loading Config', 'Analyzing Keywords', 'SERP Gap Analysis',
  'Generating Outline', 'Writing Content', 'Streaming Blog', 'SEO Optimization', 'Humanization'];

export default function BlogsPage() {
  const [phases, setPhases] = useState({ 1: 'idle', 2: 'idle' });
  const [stages, setStages] = useState({ 1: 0, 2: 0 });
  const [progress, setProgress] = useState({ 1: 0, 2: 0 });
  const [contents, setContents] = useState({ 1: '', 2: '' });
  const [metrics, setMetrics] = useState({ 1: null, 2: null });
  const [activeBlog, setActiveBlog] = useState(1);
  const [viewMode, setViewMode] = useState('preview');
  const cancelRefs = useRef({ 1: null, 2: null });
  const contentRef = useRef(null);
  const headerRef = useRef(null);

  useEffect(() => {
    gsap.fromTo(headerRef.current, { opacity: 0, y: -16 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' });
    gsap.fromTo('.blog-selector-card', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.1, delay: 0.2, ease: 'power2.out' });
  }, []);

  useEffect(() => {
    if (contentRef.current && phases[activeBlog] === 'generating') {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [contents, activeBlog, phases]);

  const generate = (idx) => {
    if (phases[idx] === 'generating') return;
    setContents(p => ({ ...p, [idx]: '' }));
    setMetrics(p => ({ ...p, [idx]: null }));
    setPhases(p => ({ ...p, [idx]: 'generating' }));
    setStages(p => ({ ...p, [idx]: 1 }));
    setProgress(p => ({ ...p, [idx]: 5 }));
    setActiveBlog(idx);
    setViewMode('stream');
    toast(`Generating Blog ${idx} with Groq AI...`, { icon: '✍️' });

    cancelRefs.current[idx] = api.generateBlogyBlog(
      idx,
      (chunk) => setContents(p => ({ ...p, [idx]: p[idx] + chunk })),
      (sd) => { setStages(p => ({ ...p, [idx]: sd.stage })); setProgress(p => ({ ...p, [idx]: sd.progress })); },
      (data) => {
        setPhases(p => ({ ...p, [idx]: 'done' }));
        setMetrics(p => ({ ...p, [idx]: data.metrics }));
        setStages(p => ({ ...p, [idx]: 8 }));
        setProgress(p => ({ ...p, [idx]: 100 }));
        toast.success(`Blog ${idx} complete! SEO: ${data.metrics?.seoScore}/100`);
        setViewMode('preview');
      },
      (err) => { setPhases(p => ({ ...p, [idx]: 'idle' })); toast.error(err.message); }
    );
  };

  const generateBoth = () => {
    generate(1);
    setTimeout(() => generate(2), 1500);
  };

  const copy = (idx) => { navigator.clipboard.writeText(contents[idx] || ''); toast.success('Copied to clipboard!'); };
  const download = (idx) => {
    const b = new Blob([contents[idx] || ''], { type: 'text/markdown' });
    Object.assign(document.createElement('a'), { href: URL.createObjectURL(b), download: `blog-${idx}.md` }).click();
    toast.success('Downloaded as .md');
  };

  const cfg = CONFIGS[activeBlog];
  const activeContent = contents[activeBlog];
  const activePhase = phases[activeBlog];
  const activeMetrics = metrics[activeBlog];
  const anyGenerating = Object.values(phases).some(p => p === 'generating');

  return (
    <div>
      <div className="page-header" ref={headerRef}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div className="page-eyebrow">Part 3 — Blog Generation</div>
            <h1 className="page-title">Generate <em>Blogs</em></h1>
            <p className="page-desc">Generate both problem statement blogs via real Groq AI streaming. Full SEO validation, markdown download, and platform publishing guide included.</p>
          </div>
          <button className="btn btn-primary" onClick={generateBoth} disabled={anyGenerating}>
            {anyGenerating ? <><span className="spin">⚙</span> Generating...</> : '⚡ Generate Both Blogs'}
          </button>
        </div>
      </div>

      {/* Blog selector cards */}
      <div className="grid-2 mb-6">
        {[1, 2].map(idx => {
          const c = CONFIGS[idx];
          const ph = phases[idx];
          const stg = stages[idx];
          const prog = progress[idx];
          const isActive = activeBlog === idx;
          return (
            <motion.div key={idx} className="blog-selector-card" onClick={() => setActiveBlog(idx)} whileHover={{ y: -2 }}>
              <div className="card" style={{
                cursor: 'pointer', transition: 'all 0.2s',
                border: `1.5px solid ${isActive ? c.color : 'var(--border)'}`,
                background: isActive ? c.bgColor : 'var(--white)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, fontFamily: 'var(--mono)', fontWeight: 700, color: c.color, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Blog {idx} — Problem Statement Part 3</div>
                    <div style={{ fontSize: 14, fontWeight: 800, lineHeight: 1.3, marginBottom: 6, color: 'var(--ink)' }}>{c.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--ink3)', marginBottom: 10 }}>{c.subtitle}</div>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {c.platforms.map((p, i) => <span key={i} className="tag tag-gray" style={{ fontSize: 10 }}>{p}</span>)}
                    </div>
                  </div>
                  <button
                    className="btn btn-sm"
                    onClick={e => { e.stopPropagation(); generate(idx); }}
                    disabled={ph === 'generating'}
                    style={{
                      background: ph === 'done' ? 'transparent' : c.color,
                      color: ph === 'done' ? c.color : 'white',
                      border: ph === 'done' ? `1px solid ${c.color}` : 'none',
                      flexShrink: 0,
                    }}
                  >
                    {ph === 'idle' ? '▶ Generate' : ph === 'generating' ? <span className="spin">⚙</span> : '↺ Regenerate'}
                  </button>
                </div>

                {ph !== 'idle' && (
                  <div style={{ marginTop: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 11 }}>
                      <span style={{ fontFamily: 'var(--mono)', color: 'var(--ink3)' }}>{STAGE_LABELS[stg] || 'Processing'}</span>
                      <span style={{ fontFamily: 'var(--mono)', fontWeight: 700, color: c.color }}>{prog}%</span>
                    </div>
                    <div style={{ height: 4, background: 'var(--bg2)', borderRadius: 99, overflow: 'hidden' }}>
                      <motion.div animate={{ width: `${prog}%` }} transition={{ duration: 0.4 }}
                        style={{ height: '100%', background: c.color, borderRadius: 99 }} />
                    </div>
                    {ph === 'done' && metrics[idx] && (
                      <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                        <span className="tag" style={{ background: c.bgColor, color: c.color, border: `1px solid ${c.borderColor}`, fontSize: 10 }}>SEO {metrics[idx].seoScore}/100</span>
                        <span className="tag tag-gray" style={{ fontSize: 10 }}>{metrics[idx].wordCount} words</span>
                        <span className="tag tag-gray" style={{ fontSize: 10 }}>KD {metrics[idx].kwDensity}%</span>
                        <span className="tag" style={{ background: '#ecfdf5', color: '#059669', fontSize: 10 }}>AI {metrics[idx].aiDetection}%</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Blog viewer */}
      <AnimatePresence>
        {(activeContent || activePhase === 'generating') && (
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
            {/* Toolbar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
              <div style={{ display: 'flex', gap: 4 }}>
                <div className="tabs-bar" style={{ margin: 0 }}>
                  {[['stream', '⚡ Stream'], ['preview', '📄 Preview'], ['seo', '📊 SEO']].map(([id, label]) => (
                    <button key={id} className={`tab-btn ${viewMode === id ? 'active' : ''}`} onClick={() => setViewMode(id)}>{label}</button>
                  ))}
                </div>
              </div>
              {activePhase === 'done' && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => copy(activeBlog)}>📋 Copy Markdown</button>
                  <button className="btn btn-secondary btn-sm" onClick={() => download(activeBlog)}>⬇ Download .md</button>
                </div>
              )}
            </div>

            {/* Platform tags */}
            {activePhase === 'done' && (
              <div style={{ display: 'flex', gap: 5, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: 'var(--ink4)', fontFamily: 'var(--mono)' }}>APPROVED PLATFORMS:</span>
                {cfg.platforms.map((p, i) => (
                  <motion.span key={i} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.08 }}
                    className="tag tag-green" style={{ fontSize: 11 }}>✓ {p}
                  </motion.span>
                ))}
              </div>
            )}

            {/* Content panels */}
            <AnimatePresence mode="wait">
              {viewMode === 'stream' && (
                <motion.div key="stream" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <div className="card" ref={contentRef} style={{ maxHeight: 540, overflowY: 'auto', background: '#0f1117', padding: 22 }}>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 12.5, lineHeight: 1.95, color: '#8b9eb8', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {activeContent}
                      {activePhase === 'generating' && <span className="stream-cursor" />}
                    </div>
                  </div>
                </motion.div>
              )}

              {viewMode === 'preview' && activeContent && (
                <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <div className="card" style={{ maxHeight: 620, overflowY: 'auto' }}>
                    {activeMetrics && (
                      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', padding: '10px 14px', background: 'var(--bg)', borderRadius: 'var(--r)', marginBottom: 20, fontSize: 12, fontFamily: 'var(--mono)', color: 'var(--ink3)' }}>
                        <span>KW: <strong style={{ color: 'var(--ink)' }}>{cfg.keyword}</strong></span>
                        <span>SEO <strong style={{ color: 'var(--accent)' }}>{activeMetrics.seoScore}/100</strong></span>
                        <span>Words <strong style={{ color: 'var(--ink)' }}>{activeMetrics.wordCount}</strong></span>
                        <span>KD <strong>{activeMetrics.kwDensity}%</strong></span>
                        <span>AI Det <strong style={{ color: activeMetrics.aiDetection < 15 ? 'var(--green)' : 'var(--amber)' }}>{activeMetrics.aiDetection}%</strong></span>
                        <span>Readability <strong>{activeMetrics.readability}</strong></span>
                      </div>
                    )}
                    <div className="blog-render">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{activeContent}</ReactMarkdown>
                      {activePhase === 'generating' && <span className="stream-cursor" />}
                    </div>
                  </div>
                </motion.div>
              )}

              {viewMode === 'seo' && activeMetrics && (
                <motion.div key="seo" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <div className="grid-2">
                    <div className="card">
                      <div className="card-label">SEO Scorecard</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 4 }}>
                        {[
                          { l: 'SEO Score', v: `${activeMetrics.seoScore}/100`, c: '#2563eb' },
                          { l: 'Readability', v: `${activeMetrics.readability}/100`, c: '#059669' },
                          { l: 'AI Detection', v: `${activeMetrics.aiDetection}%`, c: activeMetrics.aiDetection < 15 ? '#059669' : '#dc2626' },
                          { l: 'Word Count', v: activeMetrics.wordCount, c: '#d97706' },
                          { l: 'KW Density', v: `${activeMetrics.kwDensity}%`, c: '#7c3aed' },
                          { l: 'KW Instances', v: activeMetrics.kwCount, c: '#2563eb' },
                          { l: 'Snippet Prob.', v: `${activeMetrics.snippetProbability}%`, c: '#059669' },
                          { l: 'GEO India', v: `${activeMetrics.geoOptimization}%`, c: '#059669' },
                        ].map((item, i) => (
                          <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                            style={{ background: 'var(--bg)', borderRadius: 'var(--r)', padding: '12px', textAlign: 'center' }}>
                            <div style={{ fontSize: 10, color: 'var(--ink4)', fontFamily: 'var(--mono)', marginBottom: 4 }}>{item.l}</div>
                            <div style={{ fontSize: 22, fontWeight: 800, color: item.c, fontFamily: 'var(--mono)' }}>{item.v}</div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                    <div className="card">
                      <div className="card-label">Structure Audit</div>
                      {[
                        { l: 'H2 Sections', v: activeMetrics.h2Count, target: '≥4', ok: activeMetrics.h2Count >= 4 },
                        { l: 'H3 Sub-sections', v: activeMetrics.h3Count, target: '≥2', ok: activeMetrics.h3Count >= 2 },
                        { l: 'FAQ Block', v: activeMetrics.hasFaq ? '✓ Present' : '✗ Missing', target: 'Required', ok: activeMetrics.hasFaq },
                        { l: 'CTA Block', v: activeMetrics.hasCta ? '✓ Present' : '✗ Missing', target: 'Required', ok: activeMetrics.hasCta },
                        { l: 'KD Compliance', v: (activeMetrics.kwDensity >= 1.0 && activeMetrics.kwDensity <= 2.0) ? '✓ In Range' : '⚠ Adjust', target: '1.2–1.8%', ok: activeMetrics.kwDensity >= 1.0 },
                        { l: 'Word Count', v: activeMetrics.wordCount >= 1500 ? '✓ Good' : '⚠ Low', target: '1,500+', ok: activeMetrics.wordCount >= 1500 },
                        { l: 'GEO Signals', v: activeMetrics.geoOptimization >= 80 ? '✓ Strong' : '⚠ Weak', target: 'India terms', ok: activeMetrics.geoOptimization >= 80 },
                        { l: 'Snippet Ready', v: activeMetrics.snippetProbability >= 70 ? '✓ Yes' : '⚠ Low', target: '≥70%', ok: activeMetrics.snippetProbability >= 70 },
                      ].map((item, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: i < 7 ? '1px solid var(--border)' : 'none', fontSize: 13 }}>
                          <span style={{ color: 'var(--ink2)', fontWeight: 500 }}>{item.l}</span>
                          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                            <span style={{ fontSize: 10, color: 'var(--ink4)', fontFamily: 'var(--mono)' }}>{item.target}</span>
                            <span style={{ fontWeight: 700, color: item.ok ? 'var(--green)' : 'var(--amber)', fontFamily: 'var(--mono)', fontSize: 12 }}>{item.v}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {!activeContent && activePhase === 'idle' && (
        <div className="empty-state">
          <div className="empty-icon">📝</div>
          <div className="empty-title">Ready to Generate</div>
          <div className="empty-desc">Click "⚡ Generate Both Blogs" to generate both problem statement blogs simultaneously, or click Generate on any individual blog card above.</div>
        </div>
      )}
    </div>
  );
}
