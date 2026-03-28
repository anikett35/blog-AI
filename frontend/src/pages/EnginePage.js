import React, { useState, useRef, useEffect } from 'react'; // ❌ removed useCallback
import toast from 'react-hot-toast';

export default function EnginePage() {
  const [keyword, setKeyword] = useState('');
  const [phase, setPhase] = useState('idle');
  const contentRef = useRef(null);

  useEffect(() => {
    console.log("Engine loaded");
  }, []);

  const run = async () => {
    if (!keyword.trim()) {
      toast.error('Enter a keyword');
      return;
    }

    setPhase('running');

    setTimeout(() => {
      toast.success('Generated successfully');
      setPhase('done');
    }, 2000);
  };

  return (
    <div>
      <h1>Engine Page</h1>

      <input
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        placeholder="Enter keyword"
      />

      <button onClick={run}>
        Run
      </button>

      <div ref={contentRef}>
        {phase === 'running' && <p>Generating...</p>}
        {phase === 'done' && <p>Done ✅</p>}
      </div>
    </div>
  );
}