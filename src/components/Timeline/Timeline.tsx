import React, { useState, useRef, useEffect } from 'react';
import { useAnnotations } from "../../context/AnnotationContext";
import { useSync } from "../../context/SyncContext";
import { formatTime } from "../../utils/time";
import ThumbnailPreview from './ThumbnailPreview';

const Timeline: React.FC = () => {
  const { annotations } = useAnnotations();
  const { videoState, socket, room } = useSync();
  const timelineRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewPosition, setPreviewPosition] = useState(0);
  const [previewTime, setPreviewTime] = useState(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Get video element from the DOM
  useEffect(() => {
    videoRef.current = document.querySelector('video');
  }, []);

  const calculateTimeFromPosition = (clientX: number) => {
    if (!timelineRef.current || !videoRef.current) return 0;
    const rect = timelineRef.current.getBoundingClientRect();
    const position = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percentage = position / rect.width;
    return percentage * (videoRef.current.duration || 0);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current || !videoRef.current) return;

    const time = calculateTimeFromPosition(e.clientX);
    const rect = timelineRef.current.getBoundingClientRect();
    const position = e.clientX - rect.left;

    setPreviewPosition(position);
    setPreviewTime(time);
    setShowPreview(true);

    if (isDragging && socket && room?.roomId) {
      const seekTime = Math.max(0, Math.min(time, videoRef.current.duration));
      socket.emit('seek', { roomId: room.roomId, time: seekTime });
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current || !socket || !room?.roomId) return;
    setIsDragging(true);
    const time = calculateTimeFromPosition(e.clientX);
    const seekTime = Math.max(0, Math.min(time, videoRef.current.duration));
    socket.emit('seek', { roomId: room.roomId, time: seekTime });
    handleMouseMove(e);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setShowPreview(false);
    setIsDragging(false);
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current || !videoRef.current || !socket || !room?.roomId) return;
    const time = calculateTimeFromPosition(e.clientX);
    const seekTime = Math.max(0, Math.min(time, videoRef.current.duration));
    socket.emit('seek', { roomId: room.roomId, time: seekTime });
  };

  // Add global mouse up listener
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, []);

  return (
    <div className="relative">
      {showPreview && videoRef.current && (
        <ThumbnailPreview
          videoRef={videoRef}
          currentTime={previewTime}
          duration={videoRef.current.duration}
          position={previewPosition}
        />
      )}
      <div
        ref={timelineRef}
        className="relative h-2 bg-gray-700 rounded-full cursor-pointer group"
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onClick={handleTimelineClick}
      >
        {/* Progress bar */}
        <div
          className="absolute h-full bg-blue-600 rounded-full transition-all duration-200"
          style={{
            width: `${(videoState?.currentTime || 0) / (videoState?.duration || 1) * 100}%`
          }}
        />

        {/* Hover effect */}
        <div className="absolute inset-0 bg-blue-400/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

        {/* Playhead */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-blue-500 rounded-full shadow-lg transform -translate-x-1/2 transition-transform duration-200 group-hover:scale-110"
          style={{
            left: `${(videoState?.currentTime || 0) / (videoState?.duration || 1) * 100}%`
          }}
        />
      </div>

      {/* Time display */}
      <div className="flex justify-between text-xs text-gray-400 mt-1">
        <span>{formatTime(videoState?.currentTime || 0)}</span>
        <span>{formatTime(videoState?.duration || 0)}</span>
      </div>
    </div>
  );
};

export default Timeline; 