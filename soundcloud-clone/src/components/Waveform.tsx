"use client";

import { useRef, useEffect, useCallback } from "react";

interface WaveformProps {
  data: number[];
  progress: number;
  onSeek?: (progress: number) => void;
  height?: number;
  barWidth?: number;
  barGap?: number;
  activeColor?: string;
  inactiveColor?: string;
}

export default function Waveform({
  data,
  progress,
  onSeek,
  height = 60,
  barWidth = 2,
  barGap = 1,
  activeColor = "#ff5500",
  inactiveColor = "#4a4a4a",
}: WaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, rect.width, rect.height);

    const totalBarWidth = barWidth + barGap;
    const numBars = Math.floor(rect.width / totalBarWidth);
    const step = data.length / numBars;
    const progressX = progress * rect.width;

    for (let i = 0; i < numBars; i++) {
      const dataIdx = Math.floor(i * step);
      const value = data[dataIdx] || 0;
      const barH = Math.max(2, value * (rect.height - 4));
      const x = i * totalBarWidth;
      const y = (rect.height - barH) / 2;

      ctx.fillStyle = x < progressX ? activeColor : inactiveColor;
      ctx.fillRect(x, y, barWidth, barH);
    }
  }, [data, progress, barWidth, barGap, activeColor, inactiveColor]);

  useEffect(() => {
    draw();
    const handleResize = () => draw();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [draw]);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onSeek || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newProgress = Math.max(0, Math.min(1, clickX / rect.width));
    onSeek(newProgress);
  };

  return (
    <div
      ref={containerRef}
      className="w-full cursor-pointer"
      style={{ height }}
      onClick={handleClick}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ display: "block" }}
      />
    </div>
  );
}
