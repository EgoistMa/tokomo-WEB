import React, { useState, useEffect } from 'react';
import { cn } from '../lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';
import type { ImageConfig } from '@/lib/api-types';

interface CarouselProps {
  slides?: ImageConfig[];
}

const Carousel: React.FC<CarouselProps> = ({ slides = [] }) => {
  const [current, setCurrent] = useState(0);

  // 验证和标准化URL
  const normalizeUrl = (url: string): string => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    return `https://${url}`;
  };

  // 默认幻灯片（当没有从API获取到数据时使用）
  const defaultSlides: ImageConfig[] = [
    {
      url: '',
      title: '欢迎来到 Tokomo',
    },
    {
      url: '',
      title: '探索无限可能',
    },
    {
      url: '',
      title: '连接你我他',
    },
  ];

  const displaySlides = slides.length > 0 ? slides : defaultSlides;

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % displaySlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [displaySlides.length]);

  const next = () => setCurrent((prev) => (prev + 1) % displaySlides.length);
  const prev = () => setCurrent((prev) => (prev - 1 + displaySlides.length) % displaySlides.length);

  return (
    <div className="relative w-full h-[400px] overflow-hidden group">
      <div
        className="flex transition-transform duration-500 ease-in-out h-full"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {displaySlides.map((slide, idx) => {
          const slideContent = (
            <>
              {slide.url ? (
                <img
                  src={slide.url}
                  alt={slide.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-700">
                  <h2 className="text-4xl md:text-6xl font-bold text-foreground/80 tracking-tighter">
                    {slide.title}
                  </h2>
                </div>
              )}
              {slide.url && slide.title && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6">
                  <h2 className="text-2xl md:text-4xl font-bold text-white tracking-tight">
                    {slide.title}
                  </h2>
                </div>
              )}
            </>
          );

          return (
            <div
              key={idx}
              className="w-full h-full flex-shrink-0 relative"
            >
              {slide.link ? (
                <a
                  href={normalizeUrl(slide.link || '')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full h-full cursor-pointer hover:opacity-95 transition-opacity"
                  onClick={() => {
                    console.log('Carousel link clicked:', slide.link);
                    console.log('Normalized URL:', normalizeUrl(slide.link || ''));
                  }}
                >
                  {slideContent}
                </a>
              ) : (
                slideContent
              )}
            </div>
          );
        })}
      </div>

      {/* Controls */}
      <div className="absolute inset-0 flex items-center justify-between p-4 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <Button 
          variant="outline" 
          size="icon" 
          className="rounded-full bg-background/50 backdrop-blur pointer-events-auto z-10" 
          onClick={prev}
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <Button 
          variant="outline" 
          size="icon" 
          className="rounded-full bg-background/50 backdrop-blur pointer-events-auto z-10" 
          onClick={next}
        >
          <ChevronRight className="h-6 w-6" />
        </Button>
      </div>

      {/* Indicators */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {displaySlides.map((_, idx) => (
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