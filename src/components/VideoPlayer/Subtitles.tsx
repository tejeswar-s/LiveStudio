import React, { useState, useEffect } from "react";
import { SubtitleCue } from "../../types";
import { parseVTT } from "../../utils/subtitles";

interface SubtitlesProps {
    videoRef: React.RefObject<HTMLVideoElement>;
    show: boolean;
    cues: SubtitleCue[];
}

const Subtitles: React.FC<SubtitlesProps> = ({ videoRef, show, cues }) => {
    const [currentCue, setCurrentCue] = useState<SubtitleCue | null>(null);

    useEffect(() => {
        if (!videoRef.current) return;

        const video = videoRef.current;
        const updateCurrentCue = () => {
            const time = video.currentTime;
            const cue = cues.find(
                (c) => time >= c.start && time <= c.end
            );
            setCurrentCue(cue || null);
        };

        video.addEventListener("timeupdate", updateCurrentCue);
        return () => {
            video.removeEventListener("timeupdate", updateCurrentCue);
        };
    }, [videoRef, cues]);

    if (!show || !currentCue) return null;
    return (
        <div className="absolute bottom-0 left-0 right-0 p-4">
            <div className="bg-black bg-opacity-75 p-2 rounded text-center">
                {currentCue.text}
            </div>
        </div>
    );
};

export default Subtitles; 