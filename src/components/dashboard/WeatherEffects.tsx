'use client';

import { useEffect, useState } from 'react';

interface Props {
  fenomeno?: string;
}

// Interfaz para almacenar las propiedades calculadas de cada partícula
interface Particle {
  id: number;
  left: string;
  top: string;
  animationDelay: string;
  animationDuration: string;
}

export default function WeatherEffects({ fenomeno }: Props) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Marcamos que ya estamos en el cliente
    setIsClient(true);
  }, []);

  useEffect(() => {
    // Solo generamos las partículas si estamos en el cliente y hay un fenómeno
    if (!isClient || !fenomeno) return;

    const isRain = fenomeno === 'LLUVIA_TORRENCIAL';
    const isSnow = fenomeno === 'HELADA' || fenomeno === 'GRANIZADA';

    if (!isRain && !isSnow) {
        setParticles([]);
        return;
    }

    // Calculamos las propiedades aleatorias una sola vez en el cliente
    const generatedParticles = [...Array(30)].map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `-${Math.random() * 20}%`,
      animationDelay: `${Math.random() * 2}s`,
      animationDuration: `${isRain ? 0.6 + Math.random() : 3 + Math.random() * 2}s`,
    }));

    setParticles(generatedParticles);
  }, [fenomeno, isClient]);


  if (!fenomeno || !isClient) return null; // No renderizamos nada en el servidor ni si no hay fenómeno

  const isRain = fenomeno === 'LLUVIA_TORRENCIAL';

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden z-0">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className={`absolute animate-fall ${
            isRain 
              ? 'w-0.5 h-8 bg-white/40 rotate-12 blur-[0.5px]' 
              : 'w-2 h-2 bg-white/70 rounded-full blur-[1px]'
          }`}
          style={{
            left: particle.left,
            top: particle.top,
            animationDelay: particle.animationDelay,
            animationDuration: particle.animationDuration,
          }}
        />
      ))}
    </div>
  );
}