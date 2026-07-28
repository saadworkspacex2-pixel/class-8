"use client";

import { useEffect, useState } from "react";

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  rotation: number;
  speed: number;
  opacity: number;
  shape: "circle" | "square" | "star";
}

const COLORS = ["#006FEE", "#FFD700", "#10B981", "#F59E0B", "#7C3AED", "#FF6B6B", "#06B6D4"];

export default function Confetti({ trigger = false }: { trigger?: boolean }) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!trigger) return;
    const newParticles: Particle[] = [];
    for (let i = 0; i < 60; i++) {
      newParticles.push({
        id: i,
        x: 50 + (Math.random() - 0.5) * 30,
        y: -10 - Math.random() * 20,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: 4 + Math.random() * 8,
        rotation: Math.random() * 360,
        speed: 1 + Math.random() * 2,
        opacity: 0.8 + Math.random() * 0.2,
        shape: (["circle", "square", "star"] as const)[Math.floor(Math.random() * 3)],
      });
    }
    setParticles(newParticles);

    const interval = setInterval(() => {
      setParticles((prev) =>
        prev
          .map((p) => ({
            ...p,
            y: p.y + p.speed * 1.5,
            x: p.x + (Math.random() - 0.5) * 1.5,
            rotation: p.rotation + p.speed * 3,
            opacity: p.opacity - 0.003,
          }))
          .filter((p) => p.opacity > 0 && p.y < 110)
      );
    }, 30);

    setTimeout(() => clearInterval(interval), 5000);
    return () => clearInterval(interval);
  }, [trigger]);

  if (particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[99999]" style={{ perspective: "800px" }}>
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: p.shape === "circle" ? "50%" : p.shape === "star" ? "2px" : "2px",
            opacity: p.opacity,
            transform: `rotate(${p.rotation}deg)`,
            boxShadow: p.shape === "star" ? `0 0 6px ${p.color}` : "none",
            clipPath: p.shape === "star" ? "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)" : "none",
          }}
        />
      ))}
    </div>
  );
}
