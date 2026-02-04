'use client';

import { motion } from 'framer-motion';
import { MicrophoneButton } from '@/components/MicrophoneButton';
import { AudioVisualizer } from '@/components/AudioVisualizer';
import { LoadingState } from '@/components/LoadingState';
import { ResultsView } from '@/components/ResultsView';
import { useAudioStore } from '@/store/useAudioStore';
import { RotateCcw, AlertCircle } from 'lucide-react';

export default function Home() {
  const { status, errorMessage, reset } = useAudioStore();

  const isIdle = status === 'IDLE';
  const isRecording = status === 'RECORDING';
  const isProcessing = status === 'UPLOADING' || status === 'PROCESSING';
  const isSuccess = status === 'SUCCESS';
  const isError = status === 'ERROR';

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-6 bg-background text-foreground relative overflow-hidden">

      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-20%] right-[-20%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-secondary/20 rounded-full blur-[80px]" />
      </div>

      {/* Header */}
      <header className="z-10 w-full max-w-md flex items-center justify-between pt-4">
        <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
          EchoAction
        </h1>
        {isSuccess && (
          <button
            onClick={reset}
            className="p-2 rounded-full hover:bg-secondary/50 transition-colors"
            title="Start New Recording"
          >
            <RotateCcw className="h-5 w-5 text-muted-foreground" />
          </button>
        )}
      </header>

      {/* Main Content Area */}
      <div className="z-10 flex-1 flex flex-col items-center justify-center w-full max-w-md min-h-[400px]">

        {/* State: Idle & Recording */}
        {(isIdle || isRecording) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center space-y-12"
          >
            <div className="space-y-4 text-center">
              <h2 className="text-3xl font-light tracking-tight">
                {isRecording ? "Listening..." : "Capture your thought"}
              </h2>
              <p className="text-muted-foreground text-sm max-w-[250px]">
                {isRecording
                  ? "Speak clearly. I'll handle the notes."
                  : "Tap below to start recording. We'll extract tasks and insights."}
              </p>
            </div>

            <div className="relative">
              <MicrophoneButton />
            </div>

            <div className="h-16 w-full flex items-center justify-center">
              <AudioVisualizer isRecording={isRecording} />
            </div>
          </motion.div>
        )}

        {/* State: Processing */}
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <LoadingState />
          </motion.div>
        )}

        {/* State: Success */}
        {isSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full"
          >
            <ResultsView />
          </motion.div>
        )}

        {/* State: Error */}
        {isError && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center space-y-4 p-6 rounded-xl border border-destructive/20 bg-destructive/10"
          >
            <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
            <div>
              <h3 className="text-lg font-medium text-destructive">Recording Failed</h3>
              <p className="text-sm text-destructive/80 mt-1">{errorMessage}</p>
            </div>
            <button
              onClick={reset}
              className="px-4 py-2 bg-destructive text-white rounded-lg text-sm font-medium hover:bg-destructive/90 transition-colors"
            >
              Try Again
            </button>
          </motion.div>
        )}
      </div>

      {/* Footer / Caption */}
      {!isSuccess && !isError && (
        <div className="z-10 text-xs text-muted-foreground/50 pb-4">
          Powered by Whisper & GPT-4o
        </div>
      )}
    </main>
  );
}
