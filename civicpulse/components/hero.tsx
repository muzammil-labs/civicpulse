"use client"
import { MapIcon } from "lucide-react"
import { motion } from "framer-motion"
import StatCounter from "@/components/StatCounter"
import { useEffect, useRef } from "react";

const words1 = ["Report", "it."]
const words2 = ["Watch", "it", "act."]

export function Hero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const particles: { x:number; y:number; vx:number; vy:number; color:string; size:number }[] = [];
    // Mesmerizing theme colors with varied opacities
    const COLORS = [
      'rgba(91,191,191,0.6)', 
      'rgba(212,175,106,0.6)', 
      'rgba(232,149,122,0.5)',
      'rgba(91,191,191,0.3)'
    ];

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };

    const init = () => {
      particles.length = 0;
      for (let i = 0; i < 110; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          size: Math.random() * 2 + 0.8,
          color: COLORS[i % COLORS.length],
        });
      }
    };

    let mouseX = -999, mouseY = -999;
    const onMouse = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const dx = p.x - mouseX, dy = p.y - mouseY;
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        // Organic mouse interaction
        if (dist < 140 && mouseX !== -999) {
          const force = (140 - dist) / 140;
          p.vx += (dx / dist) * force * 0.05;
          p.vy += (dy / dist) * force * 0.05;
        }
        
        // Swirl physics base
        p.vx += Math.sin(p.y * 0.01 + Date.now() * 0.001) * 0.01;
        p.vy += Math.cos(p.x * 0.01 + Date.now() * 0.001) * 0.01;

        p.vx *= 0.985; p.vy *= 0.985;
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        // Subtle glow
        ctx.shadowBlur = 10;
        ctx.shadowColor = p.color;
        ctx.fill();
        ctx.shadowBlur = 0; // Reset for lines

        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          const ddx = p.x - q.x, ddy = p.y - q.y;
          const d = Math.sqrt(ddx*ddx + ddy*ddy);
          if (d < 140) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = `rgba(91,191,191,${(1 - d/140) * 0.15})`;
            ctx.lineWidth = 0.6 + ((1 - d/140) * 0.5);
            ctx.stroke();
          }
        }
      }
      animId = requestAnimationFrame(draw);
    };

    const ro = new ResizeObserver(() => { resize(); init(); });
    ro.observe(canvas);
    resize();
    init();
    draw();
    canvas.addEventListener('mousemove', onMouse);
    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
      canvas.removeEventListener('mousemove', onMouse);
    };
  }, []);

  return (
    <section className="relative overflow-hidden hero-grain"
      style={{ background: 'linear-gradient(180deg, #FAF7F2 0%, #FFFFFF 50%, #FAF7F2 100%)' }}>
      
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 0 }}
      />
      {/* Top right — teal */}
      <div aria-hidden="true" className="ambient-orb absolute -right-60 -top-60 h-[50rem] w-[50rem] opacity-[0.25]" />
      {/* Bottom left — coral/gold */}
      <div aria-hidden="true" className="ambient-orb absolute -left-40 bottom-20 h-[36rem] w-[36rem] opacity-[0.2]"
        style={{ background: 'linear-gradient(135deg,#E8957A,#D4AF6A)' }} />
      {/* Center subtle — teal mid */}
      <div aria-hidden="true" className="ambient-orb absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[20rem] w-[20rem] opacity-[0.1]"
        style={{ background: '#5BBFBF' }} />

      <div className="relative z-10 mx-auto max-w-6xl px-5 pb-24 pt-24 md:pb-32 md:pt-32">
        <div className="max-w-4xl">
          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1, type: "spring", stiffness: 300 }}
          >
            <div className="flex items-center gap-2 rounded-full border border-[#E8E4DB] bg-white/60 px-4 py-2 backdrop-blur-md shadow-sm-warm hover:bg-white transition-colors cursor-pointer" onClick={() => document.getElementById('upload')?.scrollIntoView({ behavior: 'smooth' })}>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#5BBFBF] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#5BBFBF]"></span>
              </span>
              <span className="font-mono text-xs text-[#7A6A58]">India</span>
            </div>
          </motion.div>

          {/* Headline */}
          <h1 className="font-display text-5xl md:text-[80px] lg:text-[96px] font-light leading-[0.95] tracking-tight text-[#1A1208] text-balance">
            {words1.map((word, i) => (
              <span key={`w1-${i}`} className="inline-block blur-reveal mr-[0.25em]"
                style={{ animationDelay: `${0.2 + i * 0.08}s` }}>
                {word}
              </span>
            ))}{" "}
            <span className="italic">
              {words2.map((word, i) => (
                <span key={`w2-${i}`} className="inline-block gradient-text blur-reveal mr-[0.2em]"
                  style={{ animationDelay: `${0.44 + i * 0.08}s` }}>
                  {word}
                </span>
              ))}
            </span>
          </h1>

          <motion.p 
            initial={{ opacity:0, y:16 }} 
            animate={{ opacity:1, y:0 }} 
            transition={{ delay:0.75, duration:0.6 }}
            className="mt-8 max-w-xl font-sans text-lg leading-relaxed text-[#3D2E1A]">
            Every day, broken streetlights, overflowing drains, and crumbling roads go
            unresolved because reports vanish into the wrong inbox. CivicPulse turns a
            single photo into a routed, actionable case — in under 30 seconds.
          </motion.p>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <a href="#upload" className="shimmer-btn magnetic-btn rounded-full px-8 py-3.5 font-sans text-sm font-semibold shadow-lg">
              Report an Issue
            </a>
            <a href="/civic/map" className="magnetic-btn inline-flex items-center gap-2 rounded-full border border-[#1A1208]
              bg-transparent px-8 py-3.5 font-sans text-sm font-medium text-[#1A1208] backdrop-blur-sm
              transition-all hover:bg-[#1A1208] hover:text-white">
              <MapIcon className="h-4 w-4" aria-hidden="true" />
              View the Map
            </a>
          </div>
        </div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-20 flex flex-wrap gap-12 perspective-[1000px]"
        >
          <motion.div 
            whileHover={{ scale: 1.05, rotateY: -10, rotateX: 5 }} 
            className="iridescent-border-animated rounded-2xl transform-style-3d transition-all duration-300"
          >
            <div className="rounded-2xl px-6 py-4 bg-white/70 backdrop-blur-md shadow-lg-warm border-white/50 border">
              <StatCounter value={0} suffix="" label="Reports on the map"
                duration={1600} liveReportCount={true} darkMode={false} />
            </div>
          </motion.div>
          <motion.div 
            whileHover={{ scale: 1.05, rotateY: 0, rotateX: 5 }} 
            className="iridescent-border-animated rounded-2xl transform-style-3d transition-all duration-300"
          >
            <div className="rounded-2xl px-6 py-4 bg-white/70 backdrop-blur-md shadow-lg-warm border-white/50 border">
              <StatCounter value={4} suffix="" label="AI review steps"
                duration={1800} darkMode={false} />
            </div>
          </motion.div>
          <motion.div 
            whileHover={{ scale: 1.05, rotateY: 10, rotateX: 5 }} 
            className="iridescent-border-animated rounded-2xl transform-style-3d transition-all duration-300"
          >
            <div className="rounded-2xl px-6 py-4 bg-white/70 backdrop-blur-md shadow-lg-warm border-white/50 border">
              <StatCounter value={5} suffix="" label="Departments routed"
                duration={1400} darkMode={false} />
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
