import { useEffect, useRef } from "react";

import { audio as audioElement } from "@/store/play-list";

interface AudioWaveformProps {
  width?: number;
  height?: number;
  barCount?: number;
  barColor?: string;
}

// Global AudioContext singleton to prevent multiple MediaElementSourceNode creation
let audioContext: AudioContext | null = null;
let analyser: AnalyserNode | null = null;
let source: MediaElementAudioSourceNode | null = null;

/**
 * 音频波形可视化组件
 * 使用 Web Audio API 实现动态频谱效果
 */
const AudioWaveform = ({ width = 56, height = 56, barCount = 40, barColor = "currentColor" }: AudioWaveformProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationIdRef = useRef<number>(0);
  const lastDrawTimeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !audioElement) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Initialize AudioContext and Analyser if not already done
    const initAudio = () => {
      if (!audioContext) {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 512; // Increased for better resolution

        try {
          // Connect the global audio element to the analyser
          source = audioContext.createMediaElementSource(audioElement);
          source.connect(analyser);
          analyser.connect(audioContext.destination);
        } catch (error) {
          console.warn("MediaElementSourceNode already connected or creation failed:", error);
        }
      }
      if (audioContext?.state === "suspended") {
        audioContext.resume();
      }
    };

    // Initialize on mount
    initAudio();

    const bufferLength = analyser?.frequencyBinCount ?? 0;
    const dataArray = new Uint8Array(bufferLength);
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    const frameInterval = reduceMotion ? 1000 / 15 : 1000 / 30;

    const draw = () => {
      if (!analyser || !ctx) return;

      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, width, height);

      const computedBarWidth = width / barCount;
      const barGap = computedBarWidth * 0.2;
      const barWidth = computedBarWidth - barGap;

      // Focus on the lower 60% of the frequency spectrum (most music energy)
      // With fftSize=512, bufferLength=256.
      // 0.6 * 256 * (44100/512) ≈ 13kHz coverage
      const usefulBufferLength = Math.floor(bufferLength * 0.6);

      ctx.fillStyle = barColor === "currentColor" ? "#666" : barColor;

      // Draw bars
      for (let i = 0; i < barCount; i++) {
        // Map bar index to frequency data index
        const dataIndex = Math.floor((i / barCount) * usefulBufferLength);
        let value = dataArray[dataIndex];

        // Boost high frequencies (right side) as they are naturally quieter
        // Linear boost from 1x to 2x
        const boost = 1 + i / barCount;
        value = Math.min(255, value * boost);

        // Calculate bar height based on value (0-255)
        // Ensure a minimum height (e.g., 2px) to show a "base" row like PotPlayer
        const barHeight = Math.max((value / 255) * height, 2);

        const x = i * computedBarWidth;
        const y = height - barHeight;

        // Draw rounded bar (simulated)
        ctx.beginPath();
        // Use rect for simplicity, or roundRect if supported
        if (ctx.roundRect) {
          ctx.roundRect(x, y, barWidth, barHeight, 2);
        } else {
          ctx.fillRect(x, y, barWidth, barHeight);
        }
        ctx.fill();
      }
    };

    const render = (timestamp: number = performance.now()) => {
      animationIdRef.current = requestAnimationFrame(render);
      if (document.hidden || timestamp - lastDrawTimeRef.current < frameInterval) return;
      lastDrawTimeRef.current = timestamp;
      draw();
    };

    const stopRendering = () => {
      if (!animationIdRef.current) return;
      cancelAnimationFrame(animationIdRef.current);
      animationIdRef.current = 0;
    };

    // Ensure context resumes on play
    const handlePlay = () => {
      if (audioContext?.state === "suspended") {
        audioContext.resume();
      }
      if (!animationIdRef.current && !document.hidden) {
        render();
      }
    };

    const handlePause = () => {
      stopRendering();
      draw();
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopRendering();
      } else if (!audioElement.paused && !animationIdRef.current) {
        render();
      }
    };

    audioElement.addEventListener("play", handlePlay);
    audioElement.addEventListener("pause", handlePause);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Initialize state
    if (!audioElement.paused && !document.hidden) {
      render();
    } else {
      draw();
    }

    return () => {
      stopRendering();
      audioElement.removeEventListener("play", handlePlay);
      audioElement.removeEventListener("pause", handlePause);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [width, height, barCount, barColor]);

  return <canvas ref={canvasRef} width={width} height={height} />;
};

export default AudioWaveform;
