'use client';

import { motion } from 'framer-motion';

export const AudioVisualizer = ({ isRecording }: { isRecording: boolean }) => {
    // Mock visualizer bars
    const bars = Array.from({ length: 20 });

    return (
        <div className="flex h-16 items-center justify-center gap-1">
            {bars.map((_, index) => (
                <motion.div
                    key={index}
                    className="w-1 rounded-full bg-primary"
                    animate={
                        isRecording
                            ? {
                                height: [10, Math.random() * 40 + 10, 10],
                                opacity: [0.5, 1, 0.5],
                            }
                            : { height: 4, opacity: 0.3 }
                    }
                    transition={{
                        duration: 0.5,
                        repeat: Infinity,
                        repeatType: 'reverse',
                        delay: index * 0.05,
                    }}
                />
            ))}
        </div>
    );
};
