import React, { useState, useEffect, RefObject, useRef } from "react";
import { useSync } from "../../context/SyncContext";
import { useAnnotations } from "../../context/AnnotationContext";
import { useVideoThumbnails } from "../../hooks/useMediaSource";
import Subtitles from "./Subtitles";
import Thumbnails from "./Thumbnails";
import LoadingSpinner from "../LoadingSpinner";
import PlaybackSpeed from "./PlaybackSpeed";
import { parseVTT } from "../../utils/subtitles";
import { SubtitleDisplay } from './SubtitleDisplay';
import { FaVideo, FaClosedCaptioning } from 'react-icons/fa';

const BACKEND_URL = "http://localhost:3000";

interface VideoPlayerProps {
    videoRef: RefObject<HTMLVideoElement>;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoRef }) => {
    const [videoUrl, setVideoUrl] = useState<string>("");
    const [fileWarning, setFileWarning] = useState<string>("");
    const [uploading, setUploading] = useState(false);
    const [videoReady, setVideoReady] = useState(false);
    const [streamFilename, setStreamFilename] = useState<string>("");
    const [playbackSpeed, setPlaybackSpeed] = useState(1);
    const { socket, room, videoState, setVideoState } = useSync();
    const { addAnnotation } = useAnnotations();
    const { generateThumbnail } = useVideoThumbnails(videoRef);
    const isHost = !!room?.isHost;
    const [subtitleCues, setSubtitleCues] = useState([]);
    const [showSubtitles, setShowSubtitles] = useState(true);
    const [subtitles, setSubtitles] = useState<SubtitleCue[]>([]);
    const [subtitleUrl, setSubtitleUrl] = useState<string>("");
    const [subtitleFileName, setSubtitleFileName] = useState<string>("");
    const [videoFileName, setVideoFileName] = useState<string>("");
    const playPauseGuard = useRef(false);

    // Update video state on timeupdate
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const handleTimeUpdate = () => {
            if (socket && room?.roomId) {
                socket.emit('timeUpdate', {
                    roomId: room.roomId,
                    time: video.currentTime,
                    duration: video.duration,
                    isPlaying: !video.paused,
                    playbackRate: video.playbackRate
                });
            }
            setVideoState({
                currentTime: video.currentTime,
                duration: video.duration,
                isPlaying: !video.paused,
                playbackRate: video.playbackRate
            });
        };

        video.addEventListener('timeupdate', handleTimeUpdate);
        video.addEventListener('play', () => {
            setVideoState(prev => ({ ...prev, isPlaying: true }));
            if (socket && room?.roomId) {
                socket.emit('host-action', {
                    roomId: room.roomId,
                    action: 'play',
                    currentTime: video.currentTime,
                    playbackRate: video.playbackRate
                });
            }
        });
        video.addEventListener('pause', () => {
            setVideoState(prev => ({ ...prev, isPlaying: false }));
            if (socket && room?.roomId) {
                socket.emit('host-action', {
                    roomId: room.roomId,
                    action: 'pause',
                    currentTime: video.currentTime,
                    playbackRate: video.playbackRate
                });
            }
        });
        video.addEventListener('ratechange', () => {
            setVideoState(prev => ({ ...prev, playbackRate: video.playbackRate }));
            if (socket && room?.roomId) {
                socket.emit('host-action', {
                    roomId: room.roomId,
                    action: 'rate',
                    currentTime: video.currentTime,
                    playbackRate: video.playbackRate
                });
            }
        });

        return () => {
            video.removeEventListener('timeupdate', handleTimeUpdate);
            video.removeEventListener('play', () => { });
            video.removeEventListener('pause', () => { });
            video.removeEventListener('ratechange', () => { });
        };
    }, [videoRef, socket, room, setVideoState]);

    // Handle video seeking
    useEffect(() => {
        if (!socket || !room?.roomId) return;

        const handleSeek = (data: { time: number }) => {
            if (videoRef.current) {
                videoRef.current.currentTime = data.time;
                setVideoState(prev => ({
                    ...prev,
                    currentTime: data.time
                }));
            }
        };

        socket.on('sync-playback', (data) => {
            if (videoRef.current) {
                videoRef.current.currentTime = data.currentTime;
                videoRef.current.playbackRate = data.playbackRate;
                if (data.playing && videoRef.current.paused) {
                    videoRef.current.play().catch(err => console.error('Error playing video:', err));
                } else if (!data.playing && !videoRef.current.paused) {
                    videoRef.current.pause();
                }
                setVideoState({
                    currentTime: data.currentTime,
                    duration: videoRef.current.duration,
                    isPlaying: data.playing,
                    playbackRate: data.playbackRate
                });
            }
        });

        return () => {
            socket.off('seek', handleSeek);
            socket.off('sync-playback');
        };
    }, [socket, room, videoRef]);

    // Video upload handler
    const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !room?.roomId) return;
        setUploading(true);
        setVideoReady(false);
        setFileWarning("");
        setVideoFileName(file.name);
        const formData = new FormData();
        formData.append('video', file);
        formData.append('roomId', room.roomId);
        try {
            const res = await fetch(`${BACKEND_URL}/upload`, {
                method: 'POST',
                body: formData,
            });
            const data = await res.json();
            if (data.videoUrl) {
                const filename = data.videoUrl.split("/videos/")[1];
                setStreamFilename(filename);
                setVideoUrl(`${BACKEND_URL}/stream/${filename}`);
                if (data.subtitleUrl) {
                    setSubtitleUrl(data.subtitleUrl);
                    const subtitleRes = await fetch(data.subtitleUrl);
                    const subtitleContent = await subtitleRes.text();
                    const type = data.subtitleUrl.endsWith('.vtt') ? 'vtt' : 'srt';
                    const cues = parseVTT(subtitleContent);
                    setSubtitles(cues);
                }
            } else {
                setFileWarning("Failed to upload video file.");
            }
        } catch (err) {
            setFileWarning("Failed to upload video file.");
        } finally {
            setUploading(false);
        }
    };

    // Subtitle upload handler
    const handleSubtitleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setSubtitleFileName(file.name);
        setFileWarning("");
        const content = await file.text();
        const type = file.name.endsWith('.vtt') ? 'vtt' : 'srt';
        const cues = parseVTT(content);
        setSubtitles(cues);
    };

    // Fetch video and subtitle info for viewers
    useEffect(() => {
        if (!room?.roomId || isHost) return;
        setVideoReady(false);
        fetch(`${BACKEND_URL}/room/${room.roomId}/video`)
            .then((res) => res.json())
            .then((data) => {
                if (data.videoUrl) {
                    const filename = data.videoUrl.split("/videos/")[1];
                    setStreamFilename(filename);
                    setVideoUrl(`${BACKEND_URL}/stream/${filename}`);

                    if (data.subtitleUrl) {
                        setSubtitleUrl(data.subtitleUrl);
                        // Fetch and parse subtitle file
                        fetch(data.subtitleUrl)
                            .then(res => res.text())
                            .then(content => {
                                const type = data.subtitleUrl.endsWith('.vtt') ? 'vtt' : 'srt';
                                const cues = parseVTT(content);
                                setSubtitles(cues);
                            })
                            .catch(err => console.error('Error loading subtitles:', err));
                    }
                } else {
                    setFileWarning("No video found for this room. Wait for the host to upload.");
                }
            })
            .catch(() => setFileWarning("Failed to fetch video for this room."));
    }, [room?.roomId, isHost]);

    // Playback sync: always mirror videoState
    useEffect(() => {
        if (!videoRef.current || !videoUrl || !videoReady) return;

        const video = videoRef.current;
        const timeDiff = Math.abs(video.currentTime - videoState.currentTime);

        // Only update if there's a significant time difference (> 0.5s) or play state changed
        if (timeDiff > 0.5 || video.paused !== !videoState.isPlaying) {
            video.currentTime = videoState.currentTime;
            video.playbackRate = videoState.playbackRate;

            if (videoState.isPlaying && video.paused) {
                video.play().catch(err => console.error('Error playing video:', err));
            } else if (!videoState.isPlaying && !video.paused) {
                video.pause();
            }
        }
    }, [videoState, videoUrl, videoReady]);

    // Host: emit host-action on play/pause/seek/rate
    const emitHostAction = (action: 'play' | 'pause' | 'seek' | 'rate') => {
        if (!isHost || !videoRef.current || !socket || !room?.roomId) return;
        socket.emit("host-action", {
            roomId: room.roomId,
            action,
            currentTime: videoRef.current.currentTime,
            playbackRate: videoRef.current.playbackRate,
        });
    };

    // Host: handle player events with guard
    const handlePlay = () => {
        if (playPauseGuard.current) return;
        playPauseGuard.current = true;
        emitHostAction('play');
        setTimeout(() => { playPauseGuard.current = false; }, 100);
    };
    const handlePause = () => {
        if (playPauseGuard.current) return;
        playPauseGuard.current = true;
        emitHostAction('pause');
        setTimeout(() => { playPauseGuard.current = false; }, 100);
    };
    const handleSeeked = () => emitHostAction('seek');
    const handleRateChange = () => emitHostAction('rate');

    // When video is loaded and ready
    const handleLoadedMetadata = () => {
        setVideoReady(true);
    };

    return (
        <>
            <div className="flex flex-col gap-2 mb-4">
                <div className="flex gap-6 items-center">
                    {/* Video Upload */}
                    <label htmlFor="video-upload" className="flex items-center gap-2 cursor-pointer" title="Upload video file (mp4, webm, etc.)">
                        <FaVideo className="text-2xl" />
                        <span className="text-white font-semibold text-base">Video</span>
                        <input
                            id="video-upload"
                            type="file"
                            accept="video/*"
                            onChange={handleVideoUpload}
                            className="hidden"
                            disabled={uploading}
                        />
                    </label>
                    <span className="text-sm text-gray-300 font-medium min-w-[120px]">{videoFileName ? `Loaded: ${videoFileName}` : 'No video loaded'}</span>
                    {/* Subtitle Upload */}
                    <label htmlFor="subtitle-upload" className="flex items-center gap-2 cursor-pointer" title="Upload subtitle file (.srt, .vtt)">
                        <FaClosedCaptioning className="text-2xl" />
                        <span className="text-white font-semibold text-base">Subtitles</span>
                        <input
                            id="subtitle-upload"
                            type="file"
                            accept=".vtt,.srt"
                            onChange={handleSubtitleUpload}
                            className="hidden"
                            disabled={uploading}
                        />
                    </label>
                    <span className="text-sm text-gray-300 font-medium min-w-[120px]">{subtitleFileName ? `Loaded: ${subtitleFileName}` : 'No subtitle loaded'}</span>
                    {/* Subtitle Toggle */}
                    <button
                        onClick={() => setShowSubtitles(!showSubtitles)}
                        className={`flex items-center gap-2 px-3 py-1 rounded transition-colors font-semibold text-base ${showSubtitles ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200'} hover:bg-blue-700`}
                        title={showSubtitles ? 'Hide Subtitles' : 'Show Subtitles'}
                        style={{ minWidth: 120 }}
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                        </svg>
                        {showSubtitles ? 'Subtitles On' : 'Subtitles Off'}
                    </button>
                </div>
                {fileWarning && (
                    <div className="p-2 bg-red-600 text-white rounded font-semibold text-base">{fileWarning}</div>
                )}
            </div>
            <div className="relative w-full bg-black rounded-lg overflow-visible">
                <video
                    ref={videoRef}
                    controls
                    className="w-full rounded"
                    src={videoUrl}
                    crossOrigin="anonymous"
                    onPlay={isHost && videoReady ? handlePlay : undefined}
                    onPause={isHost && videoReady ? handlePause : undefined}
                    onSeeked={isHost && videoReady ? handleSeeked : undefined}
                    onRateChange={isHost && videoReady ? handleRateChange : undefined}
                    onLoadedMetadata={handleLoadedMetadata}
                    style={!isHost ? { pointerEvents: 'none', background: '#222' } : {}}
                />
                {(!videoReady && videoUrl) && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-60 z-10 pointer-events-none">
                        <div className="flex flex-col items-center">
                            <LoadingSpinner size="large" />
                            <span className="mt-2 text-white">Processing video, please wait...</span>
                        </div>
                    </div>
                )}
                <Subtitles videoRef={videoRef} show={showSubtitles} cues={subtitleCues} />
                <Thumbnails videoRef={videoRef} generateThumbnail={generateThumbnail} />
                <SubtitleDisplay
                    currentTime={videoState.currentTime}
                    cues={subtitles}
                    isVisible={showSubtitles}
                />
            </div>
            {!isHost && videoUrl && (
                <div className="mt-2 text-sm text-gray-400 text-center">
                    You are viewing in sync with the host. Controls are disabled.
                </div>
            )}
        </>
    );
};

export default VideoPlayer; 