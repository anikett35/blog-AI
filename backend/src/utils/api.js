const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export const api = {
  analyzeKeyword: async (keyword, locale = 'IN') => {
    const res = await fetch(`${API_URL}/api/analyze-keyword`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keyword, locale }),
    });
    if (!res.ok) throw new Error('Keyword analysis failed');
    return res.json();
  },

  generateOutline: async (payload) => {
    const res = await fetch(`${API_URL}/api/generate-outline`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Outline generation failed');
    return res.json();
  },

  generateBlog: (payload, onChunk, onStage, onComplete, onError) => {
    const ctrl = new AbortController();
    fetch(`${API_URL}/api/generate-blog`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: ctrl.signal,
    }).then(async (res) => {
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();
        for (const line of lines) {
          if (line.startsWith('event: ')) {
            const event = line.replace('event: ', '').trim();
            const nextLine = lines[lines.indexOf(line) + 1] || '';
            if (nextLine.startsWith('data: ')) {
              try {
                const data = JSON.parse(nextLine.replace('data: ', ''));
                if (event === 'content_chunk') onChunk(data.chunk);
                else if (event === 'stage') onStage(data);
                else if (event === 'complete') onComplete(data);
                else if (event === 'error') onError(new Error(data.message));
              } catch {}
            }
          }
        }
      }
    }).catch(onError);
    return () => ctrl.abort();
  },

  generateBlogyBlog: (blogIndex, onChunk, onStage, onComplete, onError) => {
    const ctrl = new AbortController();

    const parseSSE = async (res) => {
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let lastEvent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop() || '';

        for (const part of parts) {
          const lines = part.split('\n');
          let event = lastEvent;
          let dataStr = '';
          for (const line of lines) {
            if (line.startsWith('event: ')) event = line.replace('event: ', '').trim();
            else if (line.startsWith('data: ')) dataStr = line.replace('data: ', '').trim();
          }
          if (dataStr) {
            try {
              const data = JSON.parse(dataStr);
              if (event === 'content_chunk') onChunk(data.chunk);
              else if (event === 'stage') onStage(data);
              else if (event === 'complete') onComplete(data);
              else if (event === 'error') onError(new Error(data.message));
            } catch {}
          }
          lastEvent = event;
        }
      }
    };

    fetch(`${API_URL}/api/generate-blogy-blog`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blogIndex }),
      signal: ctrl.signal,
    }).then(parseSSE).catch(onError);

    return () => ctrl.abort();
  },

  seoValidate: async (content, keyword) => {
    const res = await fetch(`${API_URL}/api/seo-validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, keyword }),
    });
    return res.json();
  },

  dashboardAnalysis: async () => {
    const res = await fetch(`${API_URL}/api/dashboard-analysis`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    return res.json();
  },

  health: async () => {
    const res = await fetch(`${API_URL}/health`);
    return res.json();
  }
};
