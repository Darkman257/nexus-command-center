import { useEffect, useRef } from 'react';

interface Star {
  x: number; y: number; r: number; a: number; s: number;
}

export function StarfieldBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext('2d');
    if (!ctx) return;

    let w = window.innerWidth;
    let h = window.innerHeight;

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      cvs.width = w;
      cvs.height = h;
    };
    resize();
    window.addEventListener('resize', resize);

    const stars: Star[] = Array.from({ length: 200 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.4,
      a: Math.random(),
      s: 0.003 + Math.random() * 0.006,
    }));

    let animId: number;
    const draw = () => {
      ctx.fillStyle = '#010409';
      ctx.fillRect(0, 0, w, h);

      // Nebula glow cyan
      const g1 = ctx.createRadialGradient(w * 0.3, h * 0.4, 0, w * 0.3, h * 0.4, w * 0.6);
      g1.addColorStop(0, 'rgba(0,80,160,0.08)');
      g1.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g1;
      ctx.fillRect(0, 0, w, h);

      // Nebula glow purple
      const g2 = ctx.createRadialGradient(w * 0.75, h * 0.55, 0, w * 0.75, h * 0.55, w * 0.5);
      g2.addColorStop(0, 'rgba(100,0,160,0.06)');
      g2.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, w, h);

      // Stars
      stars.forEach(s => {
        s.a += s.s;
        if (s.a > 1 || s.a < 0) s.s *= -1;
        ctx.globalAlpha = Math.abs(s.a) * 0.9;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.globalAlpha = 1;
      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        width: '100vw',
        height: '100vh',
      }}
    />
  );
}
