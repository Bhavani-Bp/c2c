"use client";

import { useEffect, useRef, useState } from 'react';

interface WheelPickerProps {
    options: number[];
    value: number;
    onChange: (value: number) => void;
}

export default function WheelPicker({ options, value, onChange }: WheelPickerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startY, setStartY] = useState(0);
    const [scrollOffset, setScrollOffset] = useState(0);
    const [velocity, setVelocity] = useState(0);
    const animationFrameRef = useRef<number>();

    const ITEM_HEIGHT = 48; // Height of each item in pixels
    const VISIBLE_ITEMS = 5; // Number of visible items

    // Calculate the index of the currently selected value
    const currentIndex = options.indexOf(value);

    useEffect(() => {
        // Initialize scroll position to center the selected value
        setScrollOffset(currentIndex * ITEM_HEIGHT);
    }, []);

    useEffect(() => {
        // Apply momentum scrolling
        if (!isDragging && Math.abs(velocity) > 0.1) {
            animationFrameRef.current = requestAnimationFrame(() => {
                const newOffset = scrollOffset + velocity;
                const maxOffset = (options.length - 1) * ITEM_HEIGHT;
                const clampedOffset = Math.max(0, Math.min(maxOffset, newOffset));

                setScrollOffset(clampedOffset);
                setVelocity(velocity * 0.95); // Friction

                // Snap to nearest item when velocity is low
                if (Math.abs(velocity) < 0.5) {
                    const nearestIndex = Math.round(clampedOffset / ITEM_HEIGHT);
                    const targetOffset = nearestIndex * ITEM_HEIGHT;

                    if (Math.abs(targetOffset - clampedOffset) > 0.5) {
                        setScrollOffset(clampedOffset + (targetOffset - clampedOffset) * 0.2);
                    } else {
                        setScrollOffset(targetOffset);
                        setVelocity(0);
                        onChange(options[nearestIndex]);
                    }
                }
            });
        }

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [isDragging, velocity, scrollOffset, options, onChange]);

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        setStartY(e.clientY);
        setVelocity(0);
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        setIsDragging(true);
        setStartY(e.touches[0].clientY);
        setVelocity(0);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging) {
            const deltaY = startY - e.clientY;
            const newOffset = scrollOffset + deltaY;
            const maxOffset = (options.length - 1) * ITEM_HEIGHT;
            const clampedOffset = Math.max(0, Math.min(maxOffset, newOffset));

            setScrollOffset(clampedOffset);
            setVelocity(deltaY * 0.5);
            setStartY(e.clientY);
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (isDragging) {
            const deltaY = startY - e.touches[0].clientY;
            const newOffset = scrollOffset + deltaY;
            const maxOffset = (options.length - 1) * ITEM_HEIGHT;
            const clampedOffset = Math.max(0, Math.min(maxOffset, newOffset));

            setScrollOffset(clampedOffset);
            setVelocity(deltaY * 0.5);
            setStartY(e.touches[0].clientY);
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleTouchEnd = () => {
        setIsDragging(false);
    };

    return (
        <div
            ref={containerRef}
            className="relative w-full h-60 overflow-hidden select-none cursor-grab active:cursor-grabbing"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {/* Center highlight overlay */}
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-12 bg-[#4169E1]/10 border-y-2 border-[#4169E1]/30 pointer-events-none z-10" />

            {/* Fade overlays */}
            <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#0A0A0A] to-transparent pointer-events-none z-20" />
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#0A0A0A] to-transparent pointer-events-none z-20" />

            {/* Scrollable items */}
            <div
                className="absolute inset-0 flex flex-col items-center justify-start py-24"
                style={{
                    transform: `translateY(${-scrollOffset + (VISIBLE_ITEMS / 2 - 0.5) * ITEM_HEIGHT}px)`,
                    transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                }}
            >
                {options.map((option, index) => {
                    const distanceFromCenter = Math.abs(scrollOffset / ITEM_HEIGHT - index);
                    const opacity = Math.max(0.2, 1 - distanceFromCenter * 0.4);
                    const scale = Math.max(0.7, 1 - distanceFromCenter * 0.15);
                    const isCentered = Math.abs(scrollOffset - index * ITEM_HEIGHT) < 5;

                    return (
                        <div
                            key={option}
                            className="flex items-center justify-center transition-all duration-100"
                            style={{
                                height: `${ITEM_HEIGHT}px`,
                                opacity,
                                transform: `scale(${scale})`,
                            }}
                        >
                            <span
                                className={`text-2xl font-semibold transition-colors ${isCentered ? 'text-[#4169E1]' : 'text-[#F8F6F0]/60'
                                    }`}
                            >
                                {option} {option === 1 ? 'user' : 'users'}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
