import React, { useState } from 'react';

interface PlaybackSpeedProps {
    videoRef: React.RefObject<HTMLVideoElement>;
    currentSpeed: number;
    onSpeedChange: (speed: number) => void;
}

const PlaybackSpeed: React.FC<PlaybackSpeedProps> = ({
    videoRef,
    currentSpeed,
    onSpeedChange,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const speeds = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

    const handleSpeedChange = (speed: number) => {
        if (videoRef.current) {
            videoRef.current.playbackRate = speed;
            onSpeedChange(speed);
        }
        setIsOpen(false);
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="px-2 py-1 text-sm bg-gray-800/80 hover:bg-gray-700 rounded-lg transition-colors duration-200"
            >
                {currentSpeed}x
            </button>

            {isOpen && (
                <div className="absolute bottom-full mb-2 right-0 bg-gray-800 rounded-lg shadow-lg p-2 min-w-[100px] glass">
                    {speeds.map((speed) => (
                        <button
                            key={speed}
                            onClick={() => handleSpeedChange(speed)}
                            className={`w-full text-left px-3 py-1.5 text-sm rounded-md transition-colors duration-200
                                ${currentSpeed === speed
                                    ? 'bg-blue-600 text-white'
                                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}
                        >
                            {speed}x
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PlaybackSpeed; 