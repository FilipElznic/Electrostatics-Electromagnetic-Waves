import React, { useEffect, useRef } from "react";

const MainMenu = ({ onNavigate }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let animationFrameId;
    let particles = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.size = Math.random() * 2 + 1;
        this.color = Math.random() > 0.5 ? "#6366f1" : "#f43f5e"; // Indigo or Rose
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
        if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
      }
    }

    const init = () => {
      resize();
      particles = [];
      for (let i = 0; i < 50; i++) {
        particles.push(new Particle());
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and Draw Particles
      particles.forEach((p) => {
        p.update();
        p.draw();
      });

      // Draw Connections
      ctx.lineWidth = 0.5;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 150) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(255, 255, 255, ${0.1 * (1 - dist / 150)})`;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    window.addEventListener("resize", resize);
    init();
    animate();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="absolute inset-0 bg-zinc-900 flex flex-col items-center justify-center z-50 overflow-hidden font-sans">
      {/* Animated Background */}
      <canvas ref={canvasRef} className="absolute inset-0 z-0 opacity-20" />

      {/* Hero Section */}
      <div className="text-center mb-16 z-10 relative">
        <h1 className="text-6xl font-bold text-zinc-100 mb-4 tracking-tight">
          Physics <span className="text-indigo-500">Playground</span>
        </h1>
        <p className="text-zinc-400 text-xl max-w-2xl mx-auto leading-relaxed">
          Explore the invisible forces of nature in a friendly, interactive lab.
        </p>
      </div>

      {/* Cards Container */}
      <div className="flex gap-8 flex-wrap justify-center max-w-6xl px-4 z-10 relative">
        {/* Electrostatics Card */}
        <button
          onClick={() => onNavigate("ELECTROSTATICS")}
          className="group relative w-80 h-96 bg-zinc-800 rounded-3xl p-8 text-left transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-indigo-500/10 border border-zinc-700 hover:border-indigo-500 flex flex-col"
        >
          <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl mb-6 flex items-center justify-center group-hover:bg-indigo-500 transition-colors duration-300">
            <svg
              className="w-8 h-8 text-indigo-500 group-hover:text-white transition-colors"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-zinc-100 mb-3 group-hover:text-indigo-400 transition-colors">
            Electrostatics
          </h2>
          <p className="text-zinc-400 leading-relaxed">
            Play with electric charges. See how they push and pull each other in
            real-time.
          </p>
          <div className="mt-auto pt-6 flex items-center text-indigo-400 font-bold opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
            Enter Lab <span className="ml-2">→</span>
          </div>
        </button>

        {/* Waves Card */}
        <button
          onClick={() => onNavigate("WAVES")}
          className="group relative w-80 h-96 bg-zinc-800 rounded-3xl p-8 text-left transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-rose-500/10 border border-zinc-700 hover:border-rose-500 flex flex-col"
        >
          <div className="w-16 h-16 bg-rose-500/10 rounded-2xl mb-6 flex items-center justify-center group-hover:bg-rose-500 transition-colors duration-300">
            <svg
              className="w-8 h-8 text-rose-500 group-hover:text-white transition-colors"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-zinc-100 mb-3 group-hover:text-rose-400 transition-colors">
            Signal Bouncer
          </h2>
          <p className="text-zinc-400 leading-relaxed">
            Guide the signal to the target using mirrors. It's like a puzzle
            with light!
          </p>
          <div className="mt-auto pt-6 flex items-center text-rose-400 font-bold opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
            Start Mission <span className="ml-2">→</span>
          </div>
        </button>

        {/* Arcade Card */}
        <button
          onClick={() => onNavigate("ARCADE")}
          className="group relative w-80 h-96 bg-zinc-800 rounded-3xl p-8 text-left transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-indigo-500/10 border border-zinc-700 hover:border-indigo-500 flex flex-col"
        >
          <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl mb-6 flex items-center justify-center group-hover:bg-indigo-500 transition-colors duration-300">
            <svg
              className="w-8 h-8 text-indigo-500 group-hover:text-white transition-colors"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-zinc-100 mb-3 group-hover:text-indigo-400 transition-colors">
            Polarity Parkour
          </h2>
          <p className="text-zinc-400 leading-relaxed">
            Jump and swing through levels using magnetic forces.
          </p>
          <div className="mt-auto pt-6 flex items-center text-indigo-400 font-bold opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
            Play Now <span className="ml-2">→</span>
          </div>
        </button>
      </div>
    </div>
  );
};

export default MainMenu;
