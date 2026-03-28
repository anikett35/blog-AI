import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { gsap } from 'gsap';

const STAGES = [
  { id: 1, icon: '🌱', label: 'Seed Keyword', color: '#2563eb',
    title: 'Seed Keyword Processing',
    input: 'Raw keyword string + locale (IN/US/UK)',
    output: 'Normalized keyword + search volume + difficulty score + head/long-tail classification',
    logic: 'Normalize → strip stopwords → detect locale → classify keyword type → score competition 0–100',
    example: '"AI blog tool India" → HEAD | IN locale | Vol: 2,400/mo | Difficulty: 42/100',
  },
  { id: 2, icon: '🔗', label: 'Keyword Cluster', color: '#7c3aed',
    title: 'Keyword Clustering (LSI + Long-tail)',
    input: 'Validated seed keyword + locale',
    output: '3 topic clusters, 15–25 keywords total, GEO variants, FAQ queries',
    logic: 'Groq LLM → semantic similarity scoring → topic modeling → GEO-specific expansion for India',
    example: 'Cluster 1: automation tools | Cluster 2: India pricing | Cluster 3: use cases + FAQ queries',
  },
  { id: 3, icon: '🎯', label: 'Intent Class.', color: '#059669',
    title: 'Search Intent Classification',
    input: 'Keyword cluster data',
    output: 'Intent type + content format + word count target',
    logic: 'LLM classifier → Informational / Commercial / Transactional / Navigational → maps to listicle/how-to/comparison/review format',
    example: '"best AI blog tool India" → COMMERCIAL → Review + Listicle → Target: 1,800 words',
  },
  { id: 4, icon: '📊', label: 'SERP Gap', color: '#d97706',
    title: 'SERP Gap Analysis',
    input: 'Keyword + intent classification',
    output: 'Gap report with opportunity score (0–100)',
    logic: 'Simulate top-10 competitor analysis → identify missing: FAQ schema, GEO signals, comparison tables, weak CTAs',
    example: 'Gap: 8/10 missing FAQPage schema | Gap: 7/10 no India GEO → Opportunity score: 78',
  },
  { id: 5, icon: '📋', label: 'Outline Gen', color: '#dc2626',
    title: 'Blog Outline Generation',
    input: 'Gap report + keyword clusters + intent + format',
    output: 'Full outline JSON: H1+H2s+H3s+FAQ plan+CTA placements+per-section keyword targets',
    logic: 'Gap-driven outline builder → each gap maps to a dedicated H2 section → CTAs at 40%, 75%, 100% scroll',
    example: 'H1: primary KW | H2 x5: cluster keywords | FAQ: 4 questions | Internal links: 3 anchors',
  },
  { id: 6, icon: '✍️', label: 'Content Gen', color: '#2563eb',
    title: 'Section-wise Content Generation',
    input: 'Outline JSON + keyword cluster + tone settings',
    output: 'Raw blog ~1,500–2,200 words, KD validated per section via Groq llama-3.3-70b',
    logic: 'Each section generated independently → validate KD (1.2–1.8%) → validate readability (Flesch 60–75) → assemble',
    example: 'Section "Why #1 in India" → 310 words → KD: 1.4% ✓ → Flesch: 71 ✓ → proceed',
  },
  { id: 7, icon: '📈', label: 'SEO Layer', color: '#7c3aed',
    title: 'SEO Optimization Layer',
    input: 'Raw assembled blog HTML',
    output: 'SEO-validated blog: meta tags, JSON-LD schema, internal links, GEO signals, ALT text',
    logic: 'Auto-inject meta title (55–60 chars) + meta description (150–160 chars) + Article+FAQPage JSON-LD + GEO signals',
    example: 'Meta title: 58 chars ✓ | Schema: Article+FAQPage | 3 internal links | IN GEO → SEO Score: 94/100',
  },
  { id: 8, icon: '🧠', label: 'Humanize', color: '#059669',
    title: 'AI Humanization Layer',
    input: 'SEO-validated blog',
    output: 'Final blog with AI detection <12%, natural tone, varied sentence rhythm',
    logic: 'AI phrase detection → rewrite robotic sentences → vary length (35% short) → add opinions + India-specific voice',
    example: '14 robotic phrases detected → rewritten → AI detection: 11% ✓ (target: <15%)',
  },
];

const METRICS = [
  { label: 'SEO Score', value: '94%', pct: 94, color: '#2563eb' },
  { label: 'Keyword Density', value: '1.4%', pct: 70, color: '#7c3aed' },
  { label: 'Readability (Flesch)', value: '73/100', pct: 73, color: '#059669' },
  { label: 'Snippet Probability', value: '82%', pct: 82, color: '#d97706' },
  { label: 'AI Detection Rate', value: '11%', pct: 11, color: '#059669' },
  { label: 'GEO Optimization (IN)', value: '89%', pct: 89, color: '#2563eb' },
  { label: 'Internal Link Coverage', value: '100%', pct: 100, color: '#7c3aed' },
  { label: 'Traffic Potential', value: '8.4K/mo', pct: 78, color: '#d97706' },
];

export default function ArchitecturePage() {
  const [activeStage, setActiveStage] = useState(0);
  const [barsAnimated, setBarsAnimated] = useState(false);
  const headerRef = useRef(null);
  const statsRef = useRef(null);
  const pipelineRef = useRef(null);

  useEffect(() => {
    const tl = gsap.timeline();
    tl.fromTo(headerRef.current,
      { opacity: 0, y: -20 },
      { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }
    )
    .fromTo(statsRef.current?.children || [],
      { opacity: 0, y: 20, scale: 0.96 },
      { opacity: 1, y: 0, scale: 1, duration: 0.4, stagger: 0.07, ease: 'back.out(1.4)' },
      '-=0.2'
    )
    .fromTo('.stage-node',
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: 0.35, stagger: 0.05, ease: 'power2.out' },
      '-=0.1'
    )
    .add(() => {
      setBarsAnimated(true);
    }, '-=0.2');
  }, []);

  // Auto-cycle stages
  useEffect(() => {
    const t = setInterval(() => setActiveStage(p => (p + 1) % STAGES.length), 3200);
    return () => clearInterval(t);
  }, []);

  const stage = STAGES[activeStage];

  return (
    <div>
      {/* Header */}
      <div className="page-header" ref={headerRef}>
        <div className="page-eyebrow">Part 1 — System Design</div>
        <h1 className="page-title">AI Blog Engine <em>Architecture</em></h1>
        <p className="page-desc">8-stage structured pipeline that converts a seed keyword into a GEO-optimized, snippet-ready, conversion-focused blog via Groq LLM.</p>
      </div>

      {/* Stats row */}
      <div className="grid-4 mb-6" ref={statsRef}>
        {[
          { num: '8', label: 'Pipeline Stages', color: '#2563eb' },
          { num: '94%', label: 'Avg SEO Score', color: '#059669' },
          { num: '<12%', label: 'AI Detection', color: '#7c3aed' },
          { num: '~90s', label: 'Generation Time', color: '#d97706' },
        ].map((s, i) => (
          <div className="stat-card" key={i}>
            <div className="stat-num" style={{ color: s.color }}>{s.num}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Pipeline grid */}
      <div className="card mb-6">
        <div className="card-label">8-Stage Pipeline — Click Any Stage</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 20 }}>
          {STAGES.map((s, i) => (
            <button
              key={i}
              className="stage-node"
              onClick={() => setActiveStage(i)}
              style={{
                padding: '14px 10px', textAlign: 'center',
                background: i === activeStage ? s.color + '12' : 'var(--bg)',
                border: `1.5px solid ${i === activeStage ? s.color : 'var(--border)'}`,
                borderRadius: 'var(--r)', cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ fontSize: 22, marginBottom: 6 }}>{s.icon}</div>
              <div style={{
                fontSize: 10, fontWeight: 700, fontFamily: 'var(--mono)',
                textTransform: 'uppercase', letterSpacing: 0.5,
                color: i === activeStage ? s.color : 'var(--ink3)',
              }}>{s.label}</div>
              <div style={{ fontSize: 9, color: 'var(--ink4)', fontFamily: 'var(--mono)', marginTop: 2 }}>
                Stage {String(i + 1).padStart(2, '0')}
              </div>
            </button>
          ))}
        </div>

        {/* Stage detail panel */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeStage}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            style={{
              background: stage.color + '08',
              border: `1px solid ${stage.color}25`,
              borderRadius: 'var(--r-lg)', padding: 20,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <span style={{ fontSize: 26 }}>{stage.icon}</span>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: stage.color }}>{stage.title}</div>
                <div style={{ fontSize: 11, color: 'var(--ink4)', fontFamily: 'var(--mono)' }}>Stage {String(stage.id).padStart(2,'0')}</div>
              </div>
            </div>
            <div className="grid-2" style={{ gap: 10 }}>
              {[
                { label: 'INPUT', val: stage.input, bg: '#eff6ff', color: '#1d4ed8' },
                { label: 'OUTPUT', val: stage.output, bg: '#ecfdf5', color: '#065f46' },
                { label: 'LOGIC', val: stage.logic, bg: '#f5f3ff', color: '#5b21b6' },
                { label: 'EXAMPLE', val: stage.example, bg: '#fffbeb', color: '#92400e' },
              ].map((item, i) => (
                <div key={i} style={{ background: item.bg, borderRadius: 'var(--r)', padding: '10px 14px' }}>
                  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.5, color: item.color, fontFamily: 'var(--mono)', marginBottom: 5 }}>{item.label}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink2)', lineHeight: 1.6 }}>{item.val}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Metrics + Linking */}
      <div className="grid-2 mb-6">
        <div className="card">
          <div className="card-label">Engine Performance Metrics</div>
          {METRICS.map((m, i) => (
            <div className="metric-row" key={i}>
              <div className="metric-header">
                <span className="metric-name">{m.label}</span>
                <span className="metric-val" style={{ color: m.color }}>{m.value}</span>
              </div>
              <div className="metric-bar">
                <div
                  className="metric-fill"
                  style={{ width: barsAnimated ? `${m.pct}%` : '0%', background: m.color, transition: `width ${1.1 + i * 0.08}s cubic-bezier(0.16,1,0.3,1) ${i * 0.05}s` }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="card-label">Keyword Clustering Topology</div>
          <div className="code-block" style={{ marginBottom: 16 }}>
            <div><span className="ok">HEAD </span> → AI blog automation India</div>
            <div><span className="fn">LSI  </span> → automated blog writing, AI content gen India</div>
            <div><span className="hi">TAIL </span> → best AI blog tool for startups India 2025</div>
            <div><span className="warn">FAQ  </span> → how to automate blog writing with AI</div>
            <div><span className="str">GEO  </span> → AI blog tool Mumbai, Delhi SEO automation</div>
          </div>
          <div className="card-label" style={{ marginTop: 16 }}>Hub & Spoke Internal Linking</div>
          <div className="code-block">
            <div><span className="ok">Pillar: /blog/ai-seo-guide [HUB]</span></div>
            <div>  └ /blog/blogy-best-tool <span className="cm">[SPOKE 1]</span></div>
            <div>  └ /blog/blogy-martech <span className="cm">[SPOKE 2]</span></div>
            <div>  └ /blog/seo-automation-india <span className="cm">[SPOKE 3]</span></div>
            <div style={{ marginTop: 8 }}><span className="warn">Rule:</span> 2–4 internal links / 1,000 words</div>
            <div><span className="warn">Anchor:</span> always use target keyword phrase</div>
          </div>
        </div>
      </div>

      {/* System flow diagram */}
      <div className="card">
        <div className="card-label">System Architecture — Text Flow</div>
        <div className="code-block" style={{ fontSize: 12, lineHeight: 2 }}>
          <div><span className="cm">USER → seed keyword + locale + domain</span></div>
          <div>  ↓</div>
          <div><span className="ok">[01]</span> Seed Processor <span className="cm">→ normalize → volume lookup → difficulty score</span></div>
          <div>  ↓</div>
          <div><span className="fn">[02]</span> Keyword Clusterer <span className="cm">→ LSI(10) + longtail(8) + GEO(4) + FAQ(5)</span></div>
          <div>  ↓</div>
          <div><span className="hi">[03]</span> Intent Classifier <span className="cm">→ informational|commercial|transactional → format + WC target</span></div>
          <div>  ↓</div>
          <div><span className="warn">[04]</span> SERP Gap Analyzer <span className="cm">→ top-10 simulation → gap_report + opportunity_score</span></div>
          <div>  ↓</div>
          <div><span className="kw">[05]</span> Outline Generator <span className="cm">→ H1+H2+H3+FAQ+CTA plan → outline.json</span></div>
          <div>  ↓</div>
          <div><span className="str">[06]</span> Content Generator <span className="cm">→ Groq llama-3.3-70b streaming → ~1,800 words</span></div>
          <div>     <span className="cm">← validate KD (1.2–1.8%) per section</span></div>
          <div>  ↓</div>
          <div><span className="fn">[07]</span> SEO Optimizer <span className="cm">→ meta tags + JSON-LD schema + GEO → score: 94/100</span></div>
          <div>  ↓</div>
          <div><span className="ok">[08]</span> Humanizer <span className="cm">→ detect AI phrases → rewrite → AI detection: 11%</span></div>
          <div>  ↓</div>
          <div><span className="cm">PUBLISH → Medium | LinkedIn | WordPress | Substack | Hashnode</span></div>
        </div>
      </div>
    </div>
  );
}
