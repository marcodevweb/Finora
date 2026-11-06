import React, { useEffect, useRef } from 'react';

interface GradientMeshProps {
  colors?: string[];
  distortion?: number;
  swirl?: number;
  speed?: number;
  rotation?: number;
  waveAmp?: number;
  waveFreq?: number;
  waveSpeed?: number;
  grain?: number;
}

export function GradientMesh({
  colors = ['#bcecf6', '#00aaff', '#ffd447'],
  speed = 1,
}: GradientMeshProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    const resize = () => {
      canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
    };

    resize();
    window.addEventListener('resize', resize);

    const render = () => {
      time += 0.01 * speed;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const grad1 = ctx.createRadialGradient(
        canvas.width * (0.3 + Math.sin(time) * 0.2),
        canvas.height * (0.3 + Math.cos(time * 0.8) * 0.2),
        50,
        canvas.width * 0.5,
        canvas.height * 0.5,
        Math.max(canvas.width, canvas.height)
      );
      grad1.addColorStop(0, colors[0] || '#ff682c');
      grad1.addColorStop(0.5, colors[1] || '#00aaff');
      grad1.addColorStop(1, colors[2] || '#1a1a1a');

      ctx.fillStyle = grad1;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [colors, speed]);

  return <canvas ref={canvasRef} className="w-full h-full absolute inset-0 block" />;
}
