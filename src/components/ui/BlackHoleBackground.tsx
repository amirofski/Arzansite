import React, { useEffect, useRef, useCallback } from 'react';
import '@/styles/blackhole.css';

interface BlackHoleBackgroundProps {
  className?: string;
  children?: React.ReactNode;
}

// Easing utility functions
const easingUtils = {
  linear: (t: number) => t,
  easeInExpo: (t: number) => t === 0 ? 0 : Math.pow(2, 10 * (t - 1)),
  easeOutExpo: (t: number) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
  easeInOutExpo: (t: number) => {
    if (t === 0) return 0;
    if (t === 1) return 1;
    if (t < 0.5) return Math.pow(2, 20 * t - 10) / 2;
    return (2 - Math.pow(2, -20 * t + 10)) / 2;
  }
};

interface Disc {
  x: number;
  y: number;
  w: number;
  h: number;
  p: number;
}

interface Particle {
  x: number;
  sx: number;
  dx: number;
  y: number;
  vy: number;
  p: number;
  r: number;
  c: string;
}

interface Point {
  x: number;
  y: number;
}

const BlackHoleBackground: React.FC<BlackHoleBackgroundProps> = ({ className = '', children }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const containerRef = useRef<HTMLDivElement>(null);
  
  const discsRef = useRef<Disc[]>([]);
  const linesRef = useRef<Point[][]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const clipRef = useRef<{ disc: Disc; i: number; path: Path2D } | null>(null);
  const particleAreaRef = useRef<{ sw: number; ew: number; h: number; sx: number; ex: number } | null>(null);
  const linesCanvasRef = useRef<OffscreenCanvas | null>(null);
  const linesCtxRef = useRef<OffscreenCanvasRenderingContext2D | null>(null);
  const renderRef = useRef<{ width: number; height: number; dpi: number } | null>(null);

  const tweenValue = useCallback((start: number, end: number, p: number, ease: keyof typeof easingUtils = 'linear') => {
    const delta = end - start;
    const easeFn = easingUtils[ease];
    return start + delta * easeFn(p);
  }, []);

  const setSize = useCallback(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    
    renderRef.current = {
      width: rect.width,
      height: rect.height,
      dpi: window.devicePixelRatio
    };

    canvasRef.current.width = renderRef.current.width * renderRef.current.dpi;
    canvasRef.current.height = renderRef.current.height * renderRef.current.dpi;
  }, []);

  const tweenDisc = useCallback((disc: Disc) => {
    if (!renderRef.current) return disc;

    const { width, height } = renderRef.current;
    
    const startDisc = {
      x: width * 0.5,
      y: height * 0.45,
      w: width * 0.75,
      h: height * 0.7
    };

    const endDisc = {
      x: width * 0.5,
      y: height * 0.95,
      w: 0,
      h: 0
    };

    disc.x = tweenValue(startDisc.x, endDisc.x, disc.p);
    disc.y = tweenValue(startDisc.y, endDisc.y, disc.p, 'easeInExpo');
    disc.w = tweenValue(startDisc.w, endDisc.w, disc.p);
    disc.h = tweenValue(startDisc.h, endDisc.h, disc.p);

    return disc;
  }, [tweenValue]);

  const setDiscs = useCallback(() => {
    if (!containerRef.current || !renderRef.current) return;

    const { width, height } = renderRef.current;
    discsRef.current = [];

    const startDisc = {
      x: width * 0.5,
      y: height * 0.45,
      w: width * 0.75,
      h: height * 0.7
    };

    const endDisc = {
      x: width * 0.5,
      y: height * 0.95,
      w: 0,
      h: 0
    };

    const totalDiscs = 100;
    let prevBottom = height;

    for (let i = 0; i < totalDiscs; i++) {
      const p = i / totalDiscs;
      const disc = {
        x: 0,
        y: 0,
        w: 0,
        h: 0,
        p
      };

      const tweenedDisc = tweenDisc(disc);
      const bottom = tweenedDisc.y + tweenedDisc.h;

      if (bottom <= prevBottom) {
        clipRef.current = {
          disc: { ...tweenedDisc },
          i,
          path: new Path2D()
        };
      }

      prevBottom = bottom;
      discsRef.current.push(tweenedDisc);
    }

    if (clipRef.current) {
      clipRef.current.path.ellipse(
        clipRef.current.disc.x,
        clipRef.current.disc.y,
        clipRef.current.disc.w,
        clipRef.current.disc.h,
        0,
        0,
        Math.PI * 2
      );
      clipRef.current.path.rect(
        clipRef.current.disc.x - clipRef.current.disc.w,
        0,
        clipRef.current.disc.w * 2,
        clipRef.current.disc.y
      );
    }
  }, [tweenDisc]);

  const initParticle = useCallback((start = false): Particle => {
    if (!particleAreaRef.current) {
      return {
        x: 0, sx: 0, dx: 0, y: 0, vy: 0, p: 0, r: 0, c: 'rgba(255, 255, 255, 0)'
      };
    }

    const sx = particleAreaRef.current.sx + particleAreaRef.current.sw * Math.random();
    const ex = particleAreaRef.current.ex + particleAreaRef.current.ew * Math.random();
    const dx = ex - sx;
    const vx = 0.1 + Math.random() * 0.5;
    const y = start ? particleAreaRef.current.h * Math.random() : particleAreaRef.current.h;
    const r = 0.5 + Math.random() * 4;
    const vy = 0.5 + Math.random();

    return {
      x: sx,
      sx,
      dx,
      y,
      vy,
      p: 0,
      r,
      c: `rgba(255, 255, 255, ${Math.random()})`
    };
  }, [particleAreaRef]);

  const setLines = useCallback(() => {
    if (!renderRef.current || !clipRef.current) return;

    const { width, height } = renderRef.current;
    linesRef.current = [];

    const totalLines = 100;
    const linesAngle = (Math.PI * 2) / totalLines;

    for (let i = 0; i < totalLines; i++) {
      linesRef.current.push([]);
    }

    discsRef.current.forEach((disc) => {
      for (let i = 0; i < totalLines; i++) {
        const angle = i * linesAngle;
        const p: Point = {
          x: disc.x + Math.cos(angle) * disc.w,
          y: disc.y + Math.sin(angle) * disc.h
        };
        linesRef.current[i].push(p);
      }
    });

    linesCanvasRef.current = new OffscreenCanvas(width, height);
    const ctx = linesCanvasRef.current.getContext('2d');
    if (!ctx) return;

    linesCtxRef.current = ctx;

    linesRef.current.forEach((line) => {
      ctx.save();
      let lineIsIn = false;
      
      line.forEach((p1, j) => {
        if (j === 0) return;

        const p0 = line[j - 1];

        if (
          !lineIsIn &&
          (ctx.isPointInPath(clipRef.current!.path, p1.x, p1.y) ||
            ctx.isPointInStroke(clipRef.current!.path, p1.x, p1.y))
        ) {
          lineIsIn = true;
        } else if (lineIsIn) {
          ctx.clip(clipRef.current!.path);
        }

        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.closePath();
      });

      ctx.restore();
    });
  }, []);

  const setParticles = useCallback(() => {
    if (!renderRef.current || !clipRef.current) return;

    const { width, height } = renderRef.current;
    particlesRef.current = [];

    particleAreaRef.current = {
      sw: clipRef.current.disc.w * 0.5,
      ew: clipRef.current.disc.w * 2,
      h: height * 0.85,
      sx: (width - clipRef.current.disc.w * 0.5) / 2,
      ex: (width - clipRef.current.disc.w * 2) / 2
    };

    const totalParticles = 100;

    for (let i = 0; i < totalParticles; i++) {
      const particle = initParticle(true);
      particlesRef.current.push(particle);
    }
  }, [initParticle]);

  const moveDiscs = useCallback(() => {
    discsRef.current.forEach((disc) => {
      disc.p = (disc.p + 0.001) % 1;
      tweenDisc(disc);
    });
  }, [tweenDisc]);

  const moveParticles = useCallback(() => {
    if (!particleAreaRef.current) return;

    particlesRef.current.forEach((particle) => {
      particle.p = 1 - particle.y / particleAreaRef.current!.h;
      particle.x = particle.sx + particle.dx * particle.p;
      particle.y -= particle.vy;

      if (particle.y < 0) {
        const newParticle = initParticle();
        particle.y = newParticle.y;
        particle.sx = newParticle.sx;
        particle.dx = newParticle.dx;
        particle.vy = newParticle.vy;
        particle.r = newParticle.r;
        particle.c = newParticle.c;
      }
    });
  }, [initParticle]);

  const drawDiscs = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 2;

    // Outer disc
    const outerDisc = {
      x: renderRef.current!.width * 0.5,
      y: renderRef.current!.height * 0.45,
      w: renderRef.current!.width * 0.75,
      h: renderRef.current!.height * 0.7
    };

    ctx.beginPath();
    ctx.ellipse(outerDisc.x, outerDisc.y, outerDisc.w, outerDisc.h, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.closePath();

    // Discs
    discsRef.current.forEach((disc, i) => {
      if (i % 5 !== 0) return;

      if (disc.w < clipRef.current!.disc.w - 5) {
        ctx.save();
        ctx.clip(clipRef.current!.path);
      }

      ctx.beginPath();
      ctx.ellipse(disc.x, disc.y, disc.w, disc.h, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.closePath();

      if (disc.w < clipRef.current!.disc.w - 5) {
        ctx.restore();
      }
    });
  }, []);

  const drawLines = useCallback((ctx: CanvasRenderingContext2D) => {
    if (linesCanvasRef.current) {
      ctx.drawImage(linesCanvasRef.current, 0, 0);
    }
  }, []);

  const drawParticles = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.save();
    ctx.clip(clipRef.current!.path);

    particlesRef.current.forEach((particle) => {
      ctx.fillStyle = particle.c;
      ctx.beginPath();
      ctx.rect(particle.x, particle.y, particle.r, particle.r);
      ctx.closePath();
      ctx.fill();
    });

    ctx.restore();
  }, []);

  const tick = useCallback(() => {
    if (!canvasRef.current || !renderRef.current) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    ctx.save();
    ctx.scale(renderRef.current.dpi, renderRef.current.dpi);

    moveDiscs();
    moveParticles();

    drawDiscs(ctx);
    drawLines(ctx);
    drawParticles(ctx);

    ctx.restore();

    animationRef.current = requestAnimationFrame(tick);
  }, [moveDiscs, moveParticles, drawDiscs, drawLines, drawParticles]);

  const onResize = useCallback(() => {
    setSize();
    setDiscs();
    setLines();
    setParticles();
  }, [setSize, setDiscs, setLines, setParticles]);

  useEffect(() => {
    setSize();
    setDiscs();
    setLines();
    setParticles();

    window.addEventListener('resize', onResize);
    animationRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('resize', onResize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [setSize, setDiscs, setLines, setParticles, onResize, tick]);

  return (
    <div ref={containerRef} className={`blackhole-container ${className}`}>
      <canvas ref={canvasRef} className="blackhole-canvas" />
      <div className="blackhole-aura" />
      <div className="blackhole-overlay" />
      {children}
    </div>
  );
};

export default BlackHoleBackground;
