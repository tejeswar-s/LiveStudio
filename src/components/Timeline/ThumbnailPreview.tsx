import React, { useEffect, useRef } from 'react';

interface ThumbnailPreviewProps {
    videoRef: React.RefObject<HTMLVideoElement>;
    currentTime: number;
    duration: number;
    position: number;
}

const ThumbnailPreview: React.FC<ThumbnailPreviewProps> = ({
    videoRef,
    currentTime,
    duration,
    position,
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const previewRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const generateThumbnail = async () => {
            if (!videoRef.current || !canvasRef.current) return;

            const video = videoRef.current;
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');

            if (!ctx) return;

            // Set canvas dimensions
            canvas.width = 160; // Thumbnail width
            canvas.height = 90; // Thumbnail height (16:9 aspect ratio)

            // Draw the current frame
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        };

        generateThumbnail();
    }, [currentTime, videoRef]);

    // Calculate preview position
    const previewStyle = {
        left: `${position}px`,
        transform: 'translateX(-50%)',
    };

    return (
        <div
            ref={previewRef}
            className="absolute bottom-full mb-2 pointer-events-none"
            style={previewStyle}
        >
            <div className="glass rounded-lg overflow-hidden shadow-lg">
                <canvas
                    ref={canvasRef}
                    className="w-40 h-[90px]"
                />
                <div className="px-2 py-1 text-xs text-center bg-gray-800/80">
                    {formatTime(currentTime)}
                </div>
            </div>
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-gray-800/80" />
        </div>
    );
};

// Helper function to format time
const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export default ThumbnailPreview; 