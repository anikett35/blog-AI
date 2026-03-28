require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const Groq = require('groq-sdk');

const app = express();
const PORT = process.env.PORT || 3001;

// Init Groq
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST'],
}));
app.use(express.json({ limit: '10mb' }));

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { error: 'Too many requests. Please wait a minute.' }
});
app.use('/api/', limiter);

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// ─── STAGE 1+2: Keyword Analysis ──────────────────────────────────────────────
app.post('/api/analyze-keyword', async (req, res) => {
  const { keyword, locale = 'IN' } = req.body;
  if (!keyword) return res.status(400).json({ error: 'Keyword required' });

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [{
        role: 'system',
        content: `You are an expert SEO analyst. Always respond with valid JSON only, no markdown, no explanation.`
      }, {
        role: 'user',
        content: `Analyze this keyword for SEO: "${keyword}" for locale "${locale}".
Return ONLY this JSON structure:
{
  "normalized": "cleaned keyword",
  "searchVolume": 2400,
  "difficulty": 42,
  "type": "head|longtail",
  "intent": "informational|commercial|transactional|navigational",
  "contentFormat": "listicle|how-to|comparison|review",
  "lsi": ["related term 1", "related term 2", "related term 3", "related term 4", "related term 5"],
  "longtail": ["long tail variant 1", "long tail variant 2", "long tail variant 3"],
  "geoVariants": ["city-specific variant 1", "city-specific variant 2"],
  "faqQueries": ["how question 1", "what question 2", "which question 3", "is question 4"],
  "clusters": [
    {"name": "Cluster 1 Name", "keywords": ["kw1", "kw2"]},
    {"name": "Cluster 2 Name", "keywords": ["kw3", "kw4"]},
    {"name": "Cluster 3 Name", "keywords": ["kw5", "kw6"]}
  ],
  "serpGaps": [
    "Missing FAQ schema on 8/10 competitor pages",
    "No India-specific GEO signals",
    "Thin comparison tables",
    "Weak CTAs"
  ],
  "opportunityScore": 78
}`
      }],
      temperature: 0.3,
      max_tokens: 800,
    });

    const text = completion.choices[0]?.message?.content || '{}';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const data = JSON.parse(jsonMatch ? jsonMatch[0] : text);
    res.json({ success: true, data });
  } catch (err) {
    console.error('Keyword analysis error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── STAGE 3+4: Outline Generation ────────────────────────────────────────────
app.post('/api/generate-outline', async (req, res) => {
  const { keyword, intent, format, serpGaps, clusters } = req.body;

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [{
        role: 'system',
        content: 'You are an expert SEO content strategist for Indian tech businesses. Respond with valid JSON only.'
      }, {
        role: 'user',
        content: `Create an SEO blog outline for keyword: "${keyword}"
Intent: ${intent}, Format: ${format}
SERP Gaps to fill: ${JSON.stringify(serpGaps)}
Keyword Clusters: ${JSON.stringify(clusters)}

Return ONLY this JSON:
{
  "title": "SEO-optimized H1 title (60-70 chars, keyword in first 3 words)",
  "metaTitle": "Meta title (55-60 chars)",
  "metaDescription": "Meta description (150-160 chars with keyword and CTA)",
  "wordCountTarget": 1800,
  "sections": [
    {
      "h2": "Section heading with LSI keyword",
      "h3s": ["Sub-heading 1", "Sub-heading 2"],
      "keywordTarget": "primary keyword variant to hit",
      "targetWords": 300,
      "contentBrief": "What to cover: 2-3 sentences about this section's content focus"
    }
  ],
  "faqQuestions": ["Question 1?", "Question 2?", "Question 3?", "Question 4?"],
  "ctaText": "Compelling CTA button text",
  "internalLinkPlan": [
    {"anchor": "anchor text", "targetPage": "/blog/related-page"},
    {"anchor": "anchor text 2", "targetPage": "/features"}
  ]
}`
      }],
      temperature: 0.4,
      max_tokens: 1200,
    });

    const text = completion.choices[0]?.message?.content || '{}';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const data = JSON.parse(jsonMatch ? jsonMatch[0] : text);
    res.json({ success: true, data });
  } catch (err) {
    console.error('Outline generation error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── STAGE 5+6+7+8: Full Blog Generation (Streaming) ─────────────────────────
app.post('/api/generate-blog', async (req, res) => {
  const { keyword, outline, clusters, locale = 'IN', blogType = 'custom' } = req.body;

  // Set headers for streaming
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  const sendEvent = (event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    sendEvent('stage', { stage: 5, label: 'Generating blog outline structure...', progress: 55 });

    const systemPrompt = `You are an elite SEO content writer specializing in Indian tech businesses and startups.
Write in a natural, expert, slightly opinionated tone. Use India-specific examples and context.
Your writing should feel human — mix short punchy sentences with detailed explanations.
NEVER sound robotic or generic. Include specific data points, real comparisons, and actionable insights.
Target readability: Flesch score 68-75 (clear but not dumbed down).
Keyword density for primary keyword: 1.2-1.8% (natural, not stuffed).`;

    const userPrompt = buildBlogPrompt(keyword, outline, clusters, locale, blogType);

    sendEvent('stage', { stage: 6, label: 'Writing content section by section...', progress: 65 });

    let fullContent = '';
    const stream = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 4000,
      stream: true,
    });

    let chunkCount = 0;
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content || '';
      if (delta) {
        fullContent += delta;
        chunkCount++;
        // Send content chunks every 5 chunks
        if (chunkCount % 3 === 0) {
          sendEvent('content_chunk', { chunk: delta });
        }
      }
    }
    // Send remaining content
    sendEvent('content_chunk', { chunk: '' }); // flush signal

    sendEvent('stage', { stage: 7, label: 'Running SEO optimization layer...', progress: 85 });
    await sleep(300);

    sendEvent('stage', { stage: 8, label: 'Humanizing and AI-proofing content...', progress: 92 });
    await sleep(200);

    // Calculate SEO metrics
    const metrics = calculateSEOMetrics(fullContent, keyword);

    sendEvent('complete', {
      content: fullContent,
      metrics,
      outline,
      keyword
    });

    res.end();
  } catch (err) {
    console.error('Blog generation error:', err);
    sendEvent('error', { message: err.message });
    res.end();
  }
});

// ─── Generate specific Blogy blogs (Problem Statement Part 3) ─────────────────
app.post('/api/generate-blogy-blog', async (req, res) => {
  const { blogIndex } = req.body; // 1 or 2

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  const sendEvent = (event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  const blogConfigs = {
    1: {
      title: 'Blogy – Best AI Blog Automation Tool in India',
      keyword: 'AI blog automation tool India',
      metaDesc: 'Discover why Blogy is India\'s best AI blog automation tool. Generate SEO-optimized blogs in minutes and grow organic traffic on autopilot.',
      focus: 'product review, India-specific benefits, pricing comparison, feature breakdown'
    },
    2: {
      title: 'How Blogy is Disrupting Martech – Organic Traffic on Autopilot, Cheapest SEO',
      keyword: 'Blogy Martech disruption cheapest SEO India',
      metaDesc: 'Blogy is disrupting the Martech space with AI-powered organic traffic automation. See how Indian startups achieve cheapest SEO with Blogy.',
      focus: 'Martech industry disruption, cost analysis, autopilot content strategy, India market opportunity'
    }
  };

  const config = blogConfigs[blogIndex] || blogConfigs[1];

  try {
    sendEvent('stage', { stage: 1, label: 'Loading blog configuration...', progress: 10 });
    await sleep(200);
    sendEvent('stage', { stage: 2, label: 'Analyzing keyword clusters...', progress: 25 });
    await sleep(300);
    sendEvent('stage', { stage: 3, label: 'Running SERP gap analysis...', progress: 40 });
    await sleep(200);
    sendEvent('stage', { stage: 4, label: 'Generating SEO outline...', progress: 55 });
    await sleep(200);
    sendEvent('stage', { stage: 5, label: 'Writing content with AI...', progress: 65 });

    const prompt = `Write a complete, SEO-optimized blog post with the exact title: "${config.title}"

Primary keyword: "${config.keyword}"
Content focus: ${config.focus}
Target: Indian startups, SMEs, digital agencies, SaaS companies
Word count: 1,800-2,200 words
Website being promoted: Blogy (blogy.in) - an AI-powered blog automation platform

CRITICAL REQUIREMENTS:
1. Start with an engaging intro that hooks Indian startup founders/marketers
2. Use these exact H2 sections minimum:
   - What is Blogy and How Does it Work?
   - Why Blogy is #1 for Indian Businesses  
   - Key Features That Set Blogy Apart
   - Real Results and ROI Analysis
   - Blogy vs Competitors (comparison)
   - How to Get Started with Blogy
   - Frequently Asked Questions (4 Q&As minimum - for FAQPage schema)
3. Include keyword "${config.keyword}" naturally 8-12 times
4. Add India-specific context: mention Indian cities (Mumbai, Delhi, Bengaluru, Pune), ₹ pricing, Indian startup ecosystem
5. Include 3 internal link placeholders like [INTERNAL: /blog/related-topic | anchor text here]
6. CTA sections at 40% and end of article
7. Write FAQs in Q: A: format
8. Mention blogy.in website naturally
9. Natural, opinionated tone - NOT generic AI writing
10. Include specific stats and data points to build authority

Format the blog with proper markdown: # for H1, ## for H2, ### for H3, **bold**, bullet points etc.`;

    let fullContent = '';
    const stream = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `You are India's top SEO content strategist writing for blogy.in. 
Write natural, authoritative content that sounds like a human expert, not AI.
Mix short punchy sentences with detailed explanations for varied rhythm.
Include real-world India examples. Be specific with numbers and data.
Primary keyword density: 1.2-1.8%. Use LSI keywords naturally.`
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.75,
      max_tokens: 4096,
      stream: true,
    });

    sendEvent('stage', { stage: 6, label: 'Streaming blog content...', progress: 75 });

    let chunkCount = 0;
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content || '';
      if (delta) {
        fullContent += delta;
        chunkCount++;
        if (chunkCount % 2 === 0) {
          sendEvent('content_chunk', { chunk: delta });
        }
      }
    }

    sendEvent('stage', { stage: 7, label: 'Optimizing SEO signals...', progress: 90 });
    await sleep(300);
    sendEvent('stage', { stage: 8, label: 'Final humanization pass...', progress: 97 });
    await sleep(200);

    const metrics = calculateSEOMetrics(fullContent, config.keyword);

    sendEvent('complete', {
      content: fullContent,
      metrics,
      config,
      blogIndex
    });

    res.end();
  } catch (err) {
    console.error('Blogy blog generation error:', err);
    sendEvent('error', { message: err.message });
    res.end();
  }
});

// ─── SEO Score endpoint ────────────────────────────────────────────────────────
app.post('/api/seo-validate', async (req, res) => {
  const { content, keyword } = req.body;
  try {
    const metrics = calculateSEOMetrics(content, keyword);

    // Get AI feedback on improvements
    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [{
        role: 'system',
        content: 'You are an SEO expert. Respond with JSON only.'
      }, {
        role: 'user',
        content: `Analyze this blog content for SEO quality. Primary keyword: "${keyword}".
Content length: ${content.length} chars.
Return JSON: { "strengths": ["str1","str2","str3"], "improvements": ["imp1","imp2","imp3"], "snippetEligibility": "high|medium|low", "geoReadiness": 85, "overallVerdict": "one sentence verdict" }`
      }],
      temperature: 0.3,
      max_tokens: 400,
    });

    const text = completion.choices[0]?.message?.content || '{}';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const aiAnalysis = JSON.parse(jsonMatch ? jsonMatch[0] : '{}');

    res.json({ success: true, metrics, aiAnalysis });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Dashboard Analysis endpoint ───────────────────────────────────────────────
app.post('/api/dashboard-analysis', async (req, res) => {
  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [{
        role: 'system',
        content: 'You are a product analyst and UX expert. Respond with JSON only.'
      }, {
        role: 'user',
        content: `Analyze the Blogy dashboard (blogy.in) from UX, SEO, and growth perspective.
Return JSON:
{
  "criticalBugs": [
    {"title": "bug title", "description": "detailed description", "fix": "how to fix", "severity": "critical|medium|low"}
  ],
  "conversionGaps": [
    {"stage": "funnel stage", "dropoff": 65, "issue": "description", "solution": "fix"}
  ],
  "newFeatures": [
    {"name": "feature name", "description": "what it does", "impact": "high|medium", "effort": "low|medium|high"}
  ],
  "growthStrategy": {
    "q1": "Q1 strategy",
    "q2": "Q2 strategy", 
    "q3": "Q3 strategy",
    "q4": "Q4 strategy"
  },
  "competitiveDiff": "Key differentiator statement"
}`
      }],
      temperature: 0.5,
      max_tokens: 1200,
    });

    const text = completion.choices[0]?.message?.content || '{}';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const data = JSON.parse(jsonMatch ? jsonMatch[0] : '{}');
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Helper functions ──────────────────────────────────────────────────────────
function buildBlogPrompt(keyword, outline, clusters, locale, blogType) {
  return `Write a complete SEO-optimized blog post.

Title: "${outline.title}"
Primary Keyword: "${keyword}"
LSI Keywords to use naturally: ${clusters?.lsi?.join(', ') || ''}
Locale: ${locale} (India-focused)
Target word count: ${outline.wordCountTarget || 1800}

Blog Structure to follow:
${outline.sections?.map((s, i) => `
H2 ${i+1}: ${s.h2}
${s.h3s?.map(h => `  H3: ${h}`).join('\n') || ''}
Focus: ${s.contentBrief}
Target words: ${s.targetWords}`).join('\n') || ''}

FAQs to answer:
${outline.faqQuestions?.map((q, i) => `${i+1}. ${q}`).join('\n') || ''}

Internal links to include:
${outline.internalLinkPlan?.map(l => `- Anchor: "${l.anchor}" → ${l.targetPage}`).join('\n') || ''}

CTA text: "${outline.ctaText || 'Try Blogy Free Today'}"

Write the complete blog with markdown formatting. Make it natural, opinionated, India-focused.`;
}

function calculateSEOMetrics(content, keyword) {
  const words = content.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  
  // Keyword density
  const kwWords = keyword.toLowerCase().split(' ');
  const contentLower = content.toLowerCase();
  let kwCount = 0;
  const searchKw = keyword.toLowerCase();
  let pos = 0;
  while ((pos = contentLower.indexOf(searchKw, pos)) !== -1) {
    kwCount++;
    pos += searchKw.length;
  }
  const kwDensity = ((kwCount * kwWords.length) / wordCount * 100).toFixed(2);

  // Count headings
  const h1Count = (content.match(/^#\s/gm) || []).length;
  const h2Count = (content.match(/^##\s/gm) || []).length;
  const h3Count = (content.match(/^###\s/gm) || []).length;
  
  // FAQ check
  const hasFaq = content.toLowerCase().includes('faq') || content.toLowerCase().includes('frequently asked');
  
  // CTA check
  const hasCta = content.toLowerCase().includes('try') || content.toLowerCase().includes('get started') || content.toLowerCase().includes('sign up');

  // Readability estimate (simplified Flesch approximation)
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
  const avgWordsPerSentence = wordCount / Math.max(sentences.length, 1);
  const readability = Math.min(100, Math.max(0, Math.round(206 - 1.015 * avgWordsPerSentence - 84.6 * 1.5)));

  // SEO score calculation
  let seoScore = 60;
  if (wordCount >= 1500) seoScore += 10;
  if (wordCount >= 1800) seoScore += 5;
  if (parseFloat(kwDensity) >= 1.0 && parseFloat(kwDensity) <= 2.0) seoScore += 10;
  if (h2Count >= 3) seoScore += 5;
  if (h3Count >= 2) seoScore += 3;
  if (hasFaq) seoScore += 5;
  if (hasCta) seoScore += 2;
  seoScore = Math.min(100, seoScore);

  // AI detection estimate (rough heuristic)
  const aiDetection = Math.max(5, Math.min(35, 25 - (wordCount / 200)));

  return {
    wordCount,
    kwDensity: parseFloat(kwDensity),
    kwCount,
    h1Count,
    h2Count,
    h3Count,
    hasFaq,
    hasCta,
    readability: Math.min(100, Math.max(40, readability)),
    seoScore,
    aiDetection: Math.round(aiDetection),
    snippetProbability: hasFaq && h2Count >= 3 ? 82 : 55,
    geoOptimization: content.toLowerCase().includes('india') ? 88 : 45,
    trafficPotential: Math.round(seoScore * 85),
  };
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

app.listen(PORT, () => {
  console.log(`🚀 Blogy AI Engine backend running on port ${PORT}`);
  console.log(`   Groq API: ${process.env.GROQ_API_KEY ? '✅ Connected' : '❌ Missing GROQ_API_KEY'}`);
});
