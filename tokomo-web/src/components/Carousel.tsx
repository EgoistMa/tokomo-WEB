import React, { useState, useEffect } from 'react';
import { cn } from '../lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';

const SLIDES = [
  {
    id: 1,
    color: 'bg-zinc-100 dark:bg-zinc-800',
    content: '欢迎来到 Tokomo',
  },
  {
    id: 2,
    color: 'bg-zinc-200 dark:bg-zinc-700',
    content: '探索无限可能',
  },
  {
    id: 3,
    color: 'bg-zinc-300 dark:bg-zinc-600',
    content: '连接你我他',
  },
];

const Carousel: React.FC = () => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const next = () => setCurrent((prev) => (prev + 1) % SLIDES.length);
  const prev = () => setCurrent((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);

  return (
    <div className="relative w-full h-[400px] overflow-hidden group">
      <div 
        className="flex transition-transform duration-500 ease-in-out h-full"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {SLIDES.map((slide) => (
          <div 
            key={slide.id}
            className={cn(
              "w-full h-full flex-shrink-0 flex items-center justify-center",
              slide.color
            )}
          >
            <h2 className="text-4xl md:text-6xl font-bold text-foreground/80 tracking-tighter">
              {slide.content}
            </h2>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="absolute inset-0 flex items-center justify-between p-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="outline" size="icon" className="rounded-full bg-background/50 backdrop-blur" onClick={prev}>
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <Button variant="outline" size="icon" className="rounded-full bg-background/50 backdrop-blur" onClick={next}>
          <ChevronRight className="h-6 w-6" />
        </Button>
      </div>

      {/* Indicators */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {SLIDES.map((_, idx) => (
          <button
            key={idx}
            className={cn(
              "w-2.5 h-2.5 rounded-full transition-colors",
              idx === current ? "bg-primary" : "bg-primary/20"
            )}
            onClick={() => setCurrent(idx)}
          />
        ))}
      </div>
    </div>
  );
};

export default Carousel;