'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Calendar, User, CheckCircle2 } from 'lucide-react';
import { useAudioStore, ActionItem } from '@/store/useAudioStore';
import clsx from 'clsx';

export const ResultsView = () => {
    const { transcription, actionItems, insights } = useAudioStore();
    const [showTranscript, setShowTranscript] = useState(false);

    return (
        <div className="w-full max-w-md space-y-6 pb-20">

            {/* 1. Insights Section */}
            <section className="space-y-3">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    Key Insights
                </h2>
                <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                    <ul className="space-y-2 text-sm text-card-foreground/90">
                        {insights.map((insight, idx) => (
                            <li key={idx} className="flex gap-2">
                                <span className="text-primary">•</span>
                                {insight}
                            </li>
                        ))}
                        {insights.length === 0 && <li className="italic text-muted-foreground">No insights extracted.</li>}
                    </ul>
                </div>
            </section>

            {/* 2. Action Items Cards */}
            <section className="space-y-3">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    Action Items
                </h2>
                <div className="space-y-3">
                    {actionItems.map((item, idx) => (
                        <ActionCard key={idx} item={item} />
                    ))}
                    {actionItems.length === 0 && (
                        <div className="text-center py-12 rounded-xl border border-dashed border-border bg-accent/5">
                            <p className="text-muted-foreground text-sm font-medium">No tasks found</p>
                            <p className="text-xs text-muted-foreground/60 mt-1">Try speaking more clearly about your action items</p>
                        </div>
                    )}
                </div>
            </section>

            {/* 3. Raw Transcript Accordion */}
            <section className="border-t border-border pt-4">
                <button
                    onClick={() => setShowTranscript(!showTranscript)}
                    className="flex w-full items-center justify-between text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                    <span>Raw Transcript</span>
                    {showTranscript ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>

                <AnimatePresence>
                    {showTranscript && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <p className="pt-3 text-sm leading-relaxed text-muted-foreground">
                                {transcription}
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </section>
        </div>
    );
};

const ActionCard = ({ item }: { item: ActionItem }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 transition-all hover:bg-accent/5"
        >
            <div className="flex items-start gap-3">
                <div className="mt-1">
                    <PriorityDot priority={item.priority} />
                </div>
                <div className="flex-1 space-y-1">
                    <p className="text-base font-medium text-foreground">{item.title}</p>

                    <div className="flex flex-wrap gap-2 pt-1">
                        {item.due_date && (
                            <Badge icon={Calendar} text={item.due_date} />
                        )}
                        {item.assignee && (
                            <Badge icon={User} text={item.assignee} />
                        )}
                    </div>
                </div>
                <button className="text-muted-foreground hover:text-primary transition-colors">
                    <CheckCircle2 className="h-5 w-5" />
                </button>
            </div>
        </motion.div>
    );
};

const PriorityDot = ({ priority }: { priority: 'high' | 'medium' | 'low' }) => {
    const color = {
        high: 'bg-red-500',
        medium: 'bg-yellow-500',
        low: 'bg-green-500',
    }[priority];

    return <div className={clsx("h-2.5 w-2.5 rounded-full shrink-0", color)} title={`${priority} priority`} />;
};

const Badge = ({ icon: Icon, text }: { icon: any, text: string }) => (
    <div className="flex items-center gap-1.5 rounded-md bg-secondary px-2 py-1 text-xs text-secondary-foreground">
        <Icon className="h-3 w-3" />
        <span>{text}</span>
    </div>
);
