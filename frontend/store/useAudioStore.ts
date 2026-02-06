import { create } from 'zustand';

export type AppState = 'IDLE' | 'RECORDING' | 'UPLOADING' | 'PROCESSING' | 'SUCCESS' | 'ERROR';

export interface ActionItem {
    title: string;
    priority: 'high' | 'medium' | 'low';
    due_date?: string;
    assignee?: string;
}

interface AudioStore {
    status: AppState;
    audioBlob: Blob | null;
    transcription: string;
    actionItems: ActionItem[];
    insights: string[];
    errorMessage: string | null;

    setAudioBlob: (blob: Blob) => void;
    setStatus: (status: AppState) => void;
    startRecording: () => void; // Integrating UI trigger logic if needed
    stopRecording: () => void;  // Integrating UI trigger logic if needed

    processAudio: (blob: Blob) => Promise<void>;
    reset: () => void;
}

export const useAudioStore = create<AudioStore>((set) => ({
    status: 'IDLE',
    audioBlob: null,
    transcription: '',
    actionItems: [],
    insights: [],
    errorMessage: null,

    setAudioBlob: (blob) => set({ audioBlob: blob }),
    setStatus: (status) => set({ status }),

    startRecording: () => set({ status: 'RECORDING', errorMessage: null }),
    stopRecording: () => set({ status: 'UPLOADING' }),

    processAudio: async (blob) => {
        set({ status: 'UPLOADING', errorMessage: null });

        try {
            const formData = new FormData();
            // Ensure specific filename for mime-type detection on backend if needed, 
            // but Multer handles generic binary streams well too.
            // We'll trust the backend whisper to handle the format.
            formData.append('audio', blob, 'recording.webm');

            set({ status: 'PROCESSING' });

            // Assuming backend is proxy-able or running on specific port.
            // Next.js rewrites can handle /api -> backend, but for now absolute URL or relative if on same origin.
            // We will assume a proxy setup or direct call.
            // Since we are running separate backend, we need the full URL or proxy.
            // For this MVP, we hardcode localhost:3001 if valid, or relative if proxy configured.
            // I will assume standard localhost:3001 for dev.
            const response = await fetch('http://localhost:3001/api/process-audio', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const message = errorData.error || response.statusText;
                throw new Error(`Server error: ${message}`);
            }

            const data = await response.json();

            set({
                status: 'SUCCESS',
                transcription: data.transcript,
                actionItems: data.actions,
                insights: data.insights,
            });
        } catch (error) {
            console.error("Processing failed", error);
            set({
                status: 'ERROR',
                errorMessage: error instanceof Error ? error.message : "Unknown error occurred"
            });
        }
    },

    reset: () => set({
        status: 'IDLE',
        audioBlob: null,
        transcription: '',
        actionItems: [],
        insights: [],
        errorMessage: null,
    }),
}));
