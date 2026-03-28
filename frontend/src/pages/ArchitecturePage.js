import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

export default function ArchitecturePage() {
  const headerRef = useRef(null);
  const statsRef = useRef(null);

  useEffect(() => {
    const tl = gsap.timeline();
    tl.fromTo(headerRef.current,
      { opacity: 0, y: -20 },
      { opacity: 1, y: 0, duration: 0.5 }
    )
    .fromTo(statsRef.current?.children || [],
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.4, stagger: 0.07 }
    );
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