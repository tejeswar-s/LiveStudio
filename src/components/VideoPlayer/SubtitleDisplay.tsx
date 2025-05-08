import React, { useEffect, useState } from 'react';
import { SubtitleCue } from '../../types';

interface SubtitleDisplayProps {
    currentTime: number;
    cues: SubtitleCue[];
    isVisible: boolean;
}

export const SubtitleDisplay: React.FC<SubtitleDisplayProps> = ({
    currentTime,
    cues,
    isVisible
}) => {
    const [currentCue, setCurrentCue] = useState<SubtitleCue | null>(null);

    useEffect(() => {
        const activeCue = cues.find(
            cue => currentTime >= cue.start && currentTime <= cue.end
        );
        setCurrentCue(activeCue || null);
    }, [currentTime, cues]);

    if (!isVisible || !currentCue) return null;

    return (
        <div className="absolute bottom-20 left-0 right-0 flex justify-center pointer-events-none">
            <div className="bg-black/70 text-white px-4 py-2 rounded-lg max-w-[80%] text-center">
                {currentCue.text}
            </div>
        </div>
    );
}; 