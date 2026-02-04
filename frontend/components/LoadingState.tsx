'use client';

import { motion } from 'framer-motion';
import { useAudioStore } from '@/store/useAudioStore';

export const LoadingState = () => {
    const { status } = useAudioStore();

    return (
        <div className="flex flex-col items-center justify-center p-8 space-y-6">
            {/* Dynamic Icon/Loader */}
            <div className="relative h-16 w-16">
                <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
                <div className="absolute inset-0 flex items-center justify-center rounded-full border-2 border-primary bg-background">
                    <div className="h-2 w-2 rounded-full bg-primary animate-bounce" />
                </div>
            </div>

            {/* Text Feedback */}
            <div className="text-center space-y-2">
                <motion.h3
                    key={status}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-lg font-medium text-foreground"
                >
                    {status === 'UPLOADING' && 'Transcribing Audio...'}
                    {status === 'PROCESSING' && 'Extracting Actions...'}
                </motion.h3>

                <p className="text-sm text-muted-foreground">
                    {status === 'UPLOADING' && 'Sending voice data to the cloud'}
                    {status === 'PROCESSING' && 'AI is analyzing your voice note'}
                </p>
            </div>

            {/* Progress/Shimmer Bar */}
            <div className="h-1 w-64 overflow-hidden rounded-full bg-secondary">
                <motion.div
                    className="h-full bg-primary"
                    initial={{ x: '-100%' }}
                    animate={{ x: '100%' }}
                    transition={{
                        repeat: Infinity,
                        duration: 1.5,
                        ease: 'linear',
                    }}
                />
            </div>
        </div>
    );
};
