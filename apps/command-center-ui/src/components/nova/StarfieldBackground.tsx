import { useEffect, useRef } from 'react';

interface Star {
  x: number;
  y: number;
  r: number;
  a: number;
  s: number;
  drift: number;
  color: string;
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

    // Color choices for cosmic stars
    const starColors = [
      '#ffffff', // Pure white (80%)
      '#00d2ff', // Electric cyan (10%)
      '#d500f9', // Cosmic purple (10%)
    ];

    // Create 300 multi-layered stars
    const stars: Star[] = Array.from({ length: 300 }, () => {
      const randType = Math.random();
      const color = randType < 0.8 ? starColors[0] : randType < 0.9 ? starColors[1] : starColors[2];
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        r: 0.4 + Math.random() * 1.5,
        a: Math.random(),
        s: 0.002 + Math.random() * 0.005,
        drift: 0.01 + Math.random() * 0.03, // Slow and elegant horizontal drift
        color
      };
    });

    let animId: number;
    const draw = () => {
      // 1. Deep space base gradient
      const bgGrad = ctx.createLinearGradient(0, 0, w, h);
      bgGrad.addColorStop(0, '#02050c');
      bgGrad.addColorStop(1, '#000205');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // 2. Layered Nebula glow cyan
      const g1 = ctx.createRadialGradient(w * 0.25, h * 0.35, 0, w * 0.25, h * 0.35, w * 0.65);
      g1.addColorStop(0, 'rgba(0, 210, 255, 0.06)');
      g1.addColorStop(0.5, 'rgba(0, 80, 160, 0.02)');
      g1.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g1;
      ctx.fillRect(0, 0, w, h);

      // 3. Layered Nebula glow purple
      const g2 = ctx.createRadialGradient(w * 0.75, h * 0.6, 0, w * 0.75, h * 0.6, w * 0.55);
      g2.addColorStop(0, 'rgba(213, 0, 249, 0.05)');
      g2.addColorStop(0.5, 'rgba(123, 97, 255, 0.02)');
      g2.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, w, h);

      // 4. Subtle center cosmic bridge glow (magenta)
      const g3 = ctx.createRadialGradient(w * 0.5, h * 0.5, 0, w * 0.5, h * 0.5, w * 0.4);
      g3.addColorStop(0, 'rgba(213, 0, 249, 0.02)');
      g3.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g3;
      ctx.fillRect(0, 0, w, h);

      // 5. Draw and drift stars
      stars.forEach(s => {
        // Star Twinkle
        s.a += s.s;
        if (s.a > 1 || s.a < 0) s.s *= -1;

        // Slow horizontal space drift
        s.x += s.drift;
        if (s.x > w) {
          s.x = 0;
          s.y = Math.random() * h;
        }

        ctx.globalAlpha = 0.2 + Math.abs(s.a) * 0.8;
        ctx.fillStyle = s.color;
        
        ctx.beginPath();
        // Add a soft circular glow to cyan and purple stars
        if (s.color !== '#ffffff' && s.r > 1.0) {
          ctx.arc(s.x, s.y, s.r * 1.5, 0, Math.PI * 2);
          ctx.globalAlpha = (0.2 + Math.abs(s.a) * 0.8) * 0.3;
          ctx.fill();
          ctx.beginPath();
        }
        
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.globalAlpha = 0.2 + Math.abs(s.a) * 0.8;
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

export default StarfieldBackground;
