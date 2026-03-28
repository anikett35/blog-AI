import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { gsap } from 'gsap';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import toast from 'react-hot-toast';
import { api } from '../utils/api';

const STAGE_LABELS = ['', 'Seed Processing', 'Keyword Clustering', 'Intent Classification',
  'SERP Gap Analysis', 'Outline Generation', 'Content Generation', 'SEO Optimization', 'Humanization'];

export default function EnginePage() {
  const [keyword, setKeyword] = useState('');
  const [locale, setLocale] = useState('IN');
  const [phase, setPhase] = useState('idle');
  const [currentStage, setCurrentStage] = useState(0);
  const [stagePct, setStagePct] = useState(0);
  const [kwData, setKwData] = useState(null);
  const [outline, setOutline] = useState(null);
  const [content, setContent] = useState('');
  const [metrics, setMetrics] = useState(null);
  const [tab, setTab] = useState('live');
  const contentRef = useRef(null);
  const cancelRef = useRef(null);
  const headerRef = useRef(null);
  const inputCardRef = useRef(null);

  useEffect(() => {
    gsap.fromTo(headerRef.current, { opacity: 0, y: -16 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' });
    gsap.fromTo(inputCardRef.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.45, delay: 0.15, ease: 'power2.out' });
  }, []);

  useEffect(() => {
    if (contentRef.current && phase === 'generating') {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [content, phase]);

  const run = async () => {
    if (!keyword.trim()) { toast.error('Enter a keyword first'); return; }
    setContent(''); setMetrics(null); setKwData(null); setOutline(null);
    setCurrentStage(0); setStagePct(0);

    try {
      setPhase('analyzing'); setCurrentStage(1);
      toast('Analyzing keyword with Groq AI...', { icon: '🔍' });

      const kwRes = await api.analyzeKeyword(keyword, locale);
      if (!kwRes.success) throw new Error('Keyword analysis failed');
      setKwData(kwRes.data);
      setCurrentStage(2); await sleep(300);
      setCurrentStage(3); await sleep(300);

      setPhase('outlining'); setCurrentStage(4);
      toast('Generating outline...', { icon: '📋' });

      const olRes = await api.generateOutline({
        keyword,
        intent: kwRes.data.intent,
        format: kwRes.data.contentFormat,
        serpGaps: kwRes.data.serpGaps,
        clusters: kwRes.data.clusters,
      });
      if (!olRes.success) throw new Error('Outline generation failed');
      setOutline(olRes.data);
      setCurrentStage(5); await sleep(300);

      setPhase('generating'); setCurrentStage(6); setTab('live');
      toast.success('Writing blog with llama-3.3-70b...', { icon: '✍️' });

      await new Promise((resolve, reject) => {
        cancelRef.current = api.generateBlog(
          { keyword, outline: olRes.data, clusters: kwRes.data, locale },
          (chunk) => setContent(p => p + chunk),
          (sd) => { setCurrentStage(sd.stage); setStagePct(sd.progress); },
          (data) => {
            setMetrics(data.metrics); setPhase('done');
            setCurrentStage(8); setStagePct(100);
            toast.success(`Done! SEO Score: ${data.metrics?.seoScore}/100 🚀`);
            resolve();
          },
          reject
        );
      });
    } catch (err) {
      toast.error(err.message || 'Generation failed');
      setPhase('idle');
    }
  };

  const reset = () => {
    cancelRef.current?.();
    setPhase('idle'); setContent(''); setMetrics(null);
    setKwData(null); setOutline(null); setCurrentStage(0); setStagePct(0);
  };

  const isRunning = phase !== 'idle' && phase !== 'done';

  return (
    <div>
      <div className="page-header" ref={headerRef}>
        <div className="page-eyebrow">Part 1 — Live Demo</div>
        <h1 className="page-title">Live <em>Engine</em></h1>
        <p className="page-desc">Enter any keyword and watch the real 8-stage pipeline execute — keyword clustering, outline generation, and blog writing via Groq AI with live streaming output.</p>
      </div>

      {/* Input Card */}
      <div className="card mb-6" ref={inputCardRef}>
        <div className="card-label">Keyword Input</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <input
            className="input"
            style={{ flex: 1, minWidth: 260 }}
            placeholder="Enter seed keyword (e.g. AI blog automation India)"
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !isRunning && run()}
            disabled={isRunning}
          />
          <select className="select" value={locale} onChange={e => setLocale(e.target.value)} disabled={isRunning}>
            <option value="IN">🇮🇳 India</option>
            <option value="US">🇺🇸 USA</option>
            <option value="UK">🇬🇧 UK</option>
            <option value="GLOBAL">🌍 Global</option>
          </select>
          {phase === 'done'
            ? <button className="btn btn-secondary" onClick={reset}>↺ Reset</button>
            : <button className="btn btn-primary" onClick={run} disabled={isRunning || !keyword.trim()}>
                {isRunning ? <><span className="spin">⚙</span> Running...</> : '▶ Run Pipeline'}
              </button>
          }
        </div>

        {/* Stage progress */}
        <AnimatePresence>
          {phase !== 'idle' && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} style={{ marginTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 12 }}>
                <span style={{ fontWeight: 700, color: 'var(--ink2)' }}>
                  {phase === 'done' ? '✅ Pipeline complete' : `Stage ${currentStage}: ${STAGE_LABELS[currentStage]}`}
                </span>
                <span style={{ fontFamily: 'var(--mono)', color: 'var(--accent)', fontWeight: 600 }}>{stagePct}%</span>
              </div>
              <div className="stages-row">
                {STAGE_LABELS.slice(1).map((_, i) => (
                  <div key={i} className={`stage-pip ${i + 1 < currentStage ? 'done' : i + 1 === currentStage ? 'active' : ''}`} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Keyword Intelligence */}
      <AnimatePresence>
        {kwData && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <div className="grid-2">
              <div className="card">
                <div className="card-label">Keyword Intelligence</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {[
                    { l: 'Search Volume', v: (kwData.searchVolume || 0).toLocaleString() + '/mo', c: '#2563eb' },
                    { l: 'Difficulty', v: `${kwData.difficulty}/100`, c: '#d97706' },
                    { l: 'Intent', v: (kwData.intent || '').toUpperCase(), c: '#7c3aed' },
                    { l: 'Format', v: kwData.contentFormat || '—', c: '#059669' },
                    { l: 'KW Type', v: (kwData.type || '').toUpperCase(), c: '#2563eb' },
                    { l: 'Opportunity', v: `${kwData.opportunityScore}/100`, c: '#d97706' },
                  ].map((item, i) => (
                    <div key={i} style={{ background: 'var(--bg)', borderRadius: 'var(--r)', padding: '10px 14px' }}>
                      <div style={{ fontSize: 10, color: 'var(--ink4)', fontFamily: 'var(--mono)', marginBottom: 3 }}>{item.l}</div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: item.c, fontFamily: 'var(--mono)' }}>{item.v}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="card">
                <div className="card-label">Keyword Clusters</div>
                {kwData.lsi?.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 10, color: 'var(--accent)', fontFamily: 'var(--mono)', fontWeight: 700, marginBottom: 6 }}>LSI KEYWORDS</div>
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                      {kwData.lsi.map((k, i) => <span key={i} className="tag tag-blue">{k}</span>)}
                    </div>
                  </div>
                )}
                {kwData.longtail?.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 10, color: 'var(--amber)', fontFamily: 'var(--mono)', fontWeight: 700, marginBottom: 6 }}>LONG-TAIL</div>
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                      {kwData.longtail.map((k, i) => <span key={i} className="tag tag-amber">{k}</span>)}
                    </div>
                  </div>
                )}
                {kwData.serpGaps?.length > 0 && (
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--red)', fontFamily: 'var(--mono)', fontWeight: 700, marginBottom: 6 }}>SERP GAPS</div>
                    {kwData.serpGaps.slice(0, 4).map((g, i) => (
                      <div key={i} style={{ fontSize: 11, color: 'var(--ink3)', marginBottom: 4, display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                        <span style={{ color: 'var(--red)', flexShrink: 0 }}>⚠</span> {g}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Outline */}
      <AnimatePresence>
        {outline && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <div className="card">
              <div className="card-label">Generated SEO Outline</div>
              <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--ink)', marginBottom: 8, lineHeight: 1.3 }}>{outline.title}</div>
              <div style={{ fontSize: 12, color: 'var(--accent)', background: 'var(--accent-light)', padding: '8px 12px', borderRadius: 'var(--r)', marginBottom: 14, fontFamily: 'var(--mono)' }}>
                📌 {outline.metaDescription}
              </div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 12, lineHeight: 2, color: 'var(--ink2)' }}>
                {outline.sections?.map((s, i) => (
                  <div key={i}>
                    <span style={{ color: 'var(--accent)', fontWeight: 700 }}>H2:</span> {s.h2}
                    {s.h3s?.map((h, j) => (
                      <div key={j} style={{ paddingLeft: 18, color: 'var(--ink3)' }}>
                        <span style={{ color: 'var(--purple)' }}>H3:</span> {h}
                      </div>
                    ))}
                  </div>
                ))}
                {outline.faqQuestions?.length > 0 && (
                  <div style={{ color: 'var(--amber)', marginTop: 4 }}>FAQ: {outline.faqQuestions.length} questions (FAQPage schema ready)</div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Blog output */}
      <AnimatePresence>
        {(content || phase === 'generating') && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
              <div className="tabs-bar" style={{ flex: 1, maxWidth: 380 }}>
                {[['live', '⚡ Live Stream'], ['preview', '📄 Preview'], ['metrics', '📊 Metrics']].map(([id, label]) => (
                  <button key={id} className={`tab-btn ${tab === id ? 'active' : ''}`} onClick={() => setTab(id)}>{label}</button>
                ))}
              </div>
              {phase === 'done' && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => { navigator.clipboard.writeText(content); toast.success('Copied!'); }}>📋 Copy</button>
                  <button className="btn btn-secondary btn-sm" onClick={() => {
                    const blob = new Blob([content], { type: 'text/markdown' });
                    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'blog.md' });
                    a.click(); toast.success('Downloaded!');
                  }}>⬇ Download .md</button>
                </div>
              )}
            </div>

            <AnimatePresence mode="wait">
              {tab === 'live' && (
                <motion.div key="live" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <div className="card" ref={contentRef} style={{ maxHeight: 500, overflowY: 'auto', background: '#0f1117', padding: 20 }}>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 12.5, lineHeight: 1.9, color: '#8b9eb8', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {content}
                      {phase === 'generating' && <span className="stream-cursor" />}
                    </div>
                  </div>
                </motion.div>
              )}
              {tab === 'preview' && content && (
                <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <div className="card" style={{ maxHeight: 600, overflowY: 'auto' }}>
                    {metrics && (
                      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 20, padding: '10px 14px', background: 'var(--bg)', borderRadius: 'var(--r)', fontSize: 12, fontFamily: 'var(--mono)' }}>
                        <span>SEO <strong style={{ color: 'var(--accent)' }}>{metrics.seoScore}/100</strong></span>
                        <span>Words <strong>{metrics.wordCount}</strong></span>
                        <span>KD <strong>{metrics.kwDensity}%</strong></span>
                        <span>AI Det <strong style={{ color: metrics.aiDetection < 15 ? 'var(--green)' : 'var(--amber)' }}>{metrics.aiDetection}%</strong></span>
                        <span>Readability <strong>{metrics.readability}</strong></span>
                      </div>
                    )}
                    <div className="blog-render">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
                      {phase === 'generating' && <span className="stream-cursor" />}
                    </div>
                  </div>
                </motion.div>
              )}
              {tab === 'metrics' && metrics && (
                <motion.div key="metrics" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <div className="grid-2">
                    <div className="card">
                      <div className="card-label">SEO Scorecard</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        {[
                          { l: 'SEO Score', v: `${metrics.seoScore}/100`, c: '#2563eb' },
                          { l: 'Readability', v: `${metrics.readability}/100`, c: '#059669' },
                          { l: 'AI Detection', v: `${metrics.aiDetection}%`, c: metrics.aiDetection < 15 ? '#059669' : '#dc2626' },
                          { l: 'Word Count', v: metrics.wordCount, c: '#d97706' },
                          { l: 'KW Density', v: `${metrics.kwDensity}%`, c: '#7c3aed' },
                          { l: 'Snippet Prob.', v: `${metrics.snippetProbability}%`, c: '#059669' },
                        ].map((item, i) => (
                          <div key={i} style={{ background: 'var(--bg)', borderRadius: 'var(--r)', padding: '12px', textAlign: 'center' }}>
                            <div style={{ fontSize: 10, color: 'var(--ink4)', fontFamily: 'var(--mono)', marginBottom: 4 }}>{item.l}</div>
                            <div style={{ fontSize: 22, fontWeight: 800, color: item.c, fontFamily: 'var(--mono)' }}>{item.v}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="card">
                      <div className="card-label">Structure Audit</div>
                      {[
                        { l: 'H2 Sections', v: metrics.h2Count, target: '4+', ok: metrics.h2Count >= 4 },
                        { l: 'H3 Sections', v: metrics.h3Count, target: '2+', ok: metrics.h3Count >= 2 },
                        { l: 'FAQ Block', v: metrics.hasFaq ? '✓ Present' : '✗ Missing', target: 'Required', ok: metrics.hasFaq },
                        { l: 'CTA Block', v: metrics.hasCta ? '✓ Present' : '✗ Missing', target: 'Required', ok: metrics.hasCta },
                        { l: 'KW Instances', v: metrics.kwCount, target: '8–12', ok: metrics.kwCount >= 6 },
                        { l: 'Word Count', v: metrics.wordCount, target: '1500+', ok: metrics.wordCount >= 1500 },
                      ].map((item, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                          <span style={{ fontSize: 13, color: 'var(--ink2)' }}>{item.l}</span>
                          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                            <span style={{ fontSize: 10, color: 'var(--ink4)', fontFamily: 'var(--mono)' }}>{item.target}</span>
                            <span style={{ fontSize: 13, fontWeight: 700, color: item.ok ? 'var(--green)' : 'var(--amber)', fontFamily: 'var(--mono)' }}>{item.v}</span>
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

      {phase === 'idle' && !content && (
        <div className="empty-state">
          <div className="empty-icon">⚡</div>
          <div className="empty-title">Ready to Generate</div>
          <div className="empty-desc">Enter a seed keyword above and click Run Pipeline to start the real 8-stage Groq AI pipeline.</div>
        </div>
      )}
    </div>
  );
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
