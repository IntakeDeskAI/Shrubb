"use client";

import { useState, useRef, useCallback } from "react";

export default function BeforeAfterSlider() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);

  const updatePosition = useCallback(
    (clientX: number) => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const x = clientX - rect.left;
      const percent = Math.min(100, Math.max(0, (x / rect.width) * 100));
      setPosition(percent);
    },
    [],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      setIsDragging(true);
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      updatePosition(e.clientX);
    },
    [updatePosition],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return;
      updatePosition(e.clientX);
    },
    [isDragging, updatePosition],
  );

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  return (
    <section className="mx-auto max-w-4xl px-4 py-20">
      <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
        See the transformation
      </h2>
      <p className="mx-auto mt-4 max-w-xl text-center text-lg text-gray-600">
        Drag the slider to compare before and after.
      </p>

      <div
        ref={containerRef}
        className="relative mt-12 aspect-[16/9] w-full cursor-ew-resize select-none overflow-hidden rounded-2xl shadow-lg"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        role="slider"
        aria-label="Before and after comparison slider"
        aria-valuenow={Math.round(position)}
        aria-valuemin={0}
        aria-valuemax={100}
        tabIndex={0}
      >
        {/* After layer (full background) */}
        <div className="absolute inset-0 flex items-center justify-center bg-brand-100">
          <span className="text-2xl font-semibold text-brand-700">After</span>
        </div>

        {/* Before layer (clipped) */}
        <div
          className="absolute inset-0 flex items-center justify-center bg-amber-100"
          style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
        >
          <span className="text-2xl font-semibold text-amber-700">Before</span>
        </div>

        {/* Slider handle */}
        <div
          className="pointer-events-none absolute inset-y-0 z-10"
          style={{ left: `${position}%` }}
        >
          {/* Vertical line */}
          <div className="absolute inset-y-0 -translate-x-1/2 w-0.5 bg-white shadow" />

          {/* Circle drag handle */}
          <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-white shadow-lg">
            <svg
              className="h-5 w-5 text-gray-700"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 9l4-4 4 4M8 15l4 4 4-4"
              />
            </svg>
          </div>
        </div>

        {/* Labels */}
        <span className="absolute bottom-4 left-4 rounded-full bg-black/50 px-3 py-1 text-xs font-medium text-white">
          Before
        </span>
        <span className="absolute bottom-4 right-4 rounded-full bg-black/50 px-3 py-1 text-xs font-medium text-white">
          After
        </span>
      </div>
    </section>
  );
}
