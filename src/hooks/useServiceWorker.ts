import { useEffect } from "react";

export function useServiceWorker() {
    useEffect(() => {
        if ("serviceWorker" in navigator) {
            window.addEventListener("load", () => {
                navigator.serviceWorker
                    .register("/service-worker.js")
                    .then((registration) => {
                        console.log("SW registered:", registration);
                    })
                    .catch((error) => {
                        console.log("SW registration failed:", error);
                    });
            });
        }
    }, []);
}

export function useOfflineSupport() {
    useEffect(() => {
        if ("serviceWorker" in navigator) {
            navigator.serviceWorker.ready.then((registration) => {
                registration.update();
            });
        }
    }, []);
} 