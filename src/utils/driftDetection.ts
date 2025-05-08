export function isDrift(local: number, remote: number, threshold = 0.5): boolean {
    return Math.abs(local - remote) > threshold;
}

export function calculateDrift(local: number, remote: number): number {
    return local - remote;
}

export function adjustForDrift(time: number, drift: number): number {
    return time - drift;
}

export function syncTime(local: number, remote: number, threshold = 0.5): number {
    if (isDrift(local, remote, threshold)) {
        const drift = calculateDrift(local, remote);
        return adjustForDrift(local, drift);
    }
    return local;
} 