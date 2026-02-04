'use client';

import { motion } from 'framer-motion';
import { Mic, Square } from 'lucide-react';
import { useAudioStore } from '@/store/useAudioStore';
import { useMediaRecorder } from '@/hooks/useMediaRecorder';
import { useEffect } from 'react';

export const MicrophoneButton = () => {
    const { setStatus, processAudio } = useAudioStore();

    const handleRecordingStop = (blob: Blob) => {
        console.log("Recording stopped, blob size:", blob.size);
        // Determine mime type based on browser if needed, or just send blob
        processAudio(blob);
    };

    const { isRecording, startRecording, stopRecording } = useMediaRecorder({
        onStop: handleRecordingStop,
    });

    // Sync internal recorder state with global store
    useEffect(() => {
        if (isRecording) {
            setStatus('RECORDING');
        }
        // We don't auto-set IDLE here on stop because processAudio sets UPLOADING
    }, [isRecording, setStatus]);

    const handleClick = () => {
        // Haptic feedback if available
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(50);
        }

        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    };

    return (
        <div className="relative flex items-center justify-center">
            {/* Pulsing Ring Animation */}
            {isRecording && (
                <div className="absolute inset-0 rounded-full bg-primary/20 pulse-ring" />
            )}

            <motion.button
                onClick={handleClick}
                whileTap={{ scale: 0.9 }}
                animate={{ scale: isRecording ? 1.1 : 1 }}
                className={`
          z-10 flex h-24 w-24 items-center justify-center rounded-full 
          shadow-lg transition-colors duration-300
          ${isRecording ? 'bg-destructive text-white' : 'bg-primary text-primary-foreground'}
        `}
            >
                {isRecording ? (
                    <Square className="h-8 w-8 fill-current" />
                ) : (
                    <Mic className="h-10 w-10" />
                )}
            </motion.button>
        </div>
    );
};
