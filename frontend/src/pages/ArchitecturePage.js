import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { gsap } from 'gsap';

export default function ArchitecturePage() {
  const [activeStage, setActiveStage] = useState(0);
  const [barsAnimated, setBarsAnimated] = useState(false);

  const headerRef = useRef(null);
  const statsRef = useRef(null);
  // ❌ removed pipelineRef (unused)

  useEffect(() => {
    const tl = gsap.timeline();
    tl.fromTo(headerRef.current,
      { opacity: 0, y: -20 },
      { opacity: 1, y: 0, duration: 0.5 }
    )
    .fromTo(statsRef.current?.children || [],
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.4, stagger: 0.07 }
    )
    .add(() => setBarsAnimated(true));
  }, []);

  return (
    <div>
      <h1 ref={headerRef}>Architecture Page</h1>
      <div ref={statsRef}>
        <p>Stats Loaded</p>
      </div>
    </div>
  );
}