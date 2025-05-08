import React from "react";

// Thumbnails component stub: no thumbnail generation on timeupdate for smooth playback
const Thumbnails: React.FC<{ videoRef: React.RefObject<HTMLVideoElement>; generateThumbnail: (time: number) => Promise<string>; }> = () => {
    // Optionally, implement thumbnail generation on user hover or scrub here
    return null;
};

export default Thumbnails; 