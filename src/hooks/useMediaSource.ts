import { useEffect, useRef } from "react";

export async function computeFileHash(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

export function useMediaSource(videoRef: React.RefObject<HTMLVideoElement>) {
    const mediaSourceRef = useRef<MediaSource | null>(null);

    useEffect(() => {
        if (!videoRef.current) return;

        const video = videoRef.current;
        const mediaSource = new MediaSource();
        mediaSourceRef.current = mediaSource;

        video.src = URL.createObjectURL(mediaSource);

        mediaSource.addEventListener("sourceopen", () => {
            const sourceBuffer = mediaSource.addSourceBuffer('video/mp4; codecs="avc1.42E01E,mp4a.40.2"');
            // Handle source buffer updates here
        });

        return () => {
            if (mediaSourceRef.current) {
                URL.revokeObjectURL(video.src);
                if (mediaSourceRef.current.readyState === "open") {
                    mediaSourceRef.current.endOfStream();
                }
            }
        };
    }, [videoRef]);

    return mediaSourceRef;
}

export function useVideoThumbnails(videoRef: React.RefObject<HTMLVideoElement>) {
    const generateThumbnail = async (time: number): Promise<string> => {
        if (!videoRef.current) return "";

        const video = videoRef.current;
        video.currentTime = time;

        return new Promise((resolve) => {
            const canvas = document.createElement("canvas");
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext("2d");
            ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL());
        });
    };

    return { generateThumbnail };
} 