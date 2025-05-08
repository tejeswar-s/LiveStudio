import React, { useRef } from "react";
import { SyncProvider } from "./context/SyncContext";
import { AnnotationProvider } from "./context/AnnotationContext";
import { OfflineProvider } from "./context/OfflineContext";
import ToastContainer from "./components/ToastContainer";
import ErrorBoundary from "./components/ErrorBoundary";
import OfflineBanner from "./components/OfflineBanner";
import VideoPlayer from "./components/VideoPlayer/VideoPlayer";
import Timeline from "./components/Timeline/Timeline";
import CommentsPanel from "./components/CommentsPanel/CommentsPanel";
import DrawCanvas from "./components/DrawCanvas/DrawCanvas";
import SyncControls from "./components/SyncControls/SyncControls";
import ExportButton from "./components/ExportButton";
import ImportButton from "./components/ImportButton";
import LoadingSpinner from "./components/LoadingSpinner";

const App: React.FC = () => {
    // Create a ref to pass to both VideoPlayer and CommentsPanel
    const videoRef = useRef<HTMLVideoElement>(null);
    return (
        <ErrorBoundary>
            <OfflineProvider>
                <SyncProvider>
                    <AnnotationProvider>
                        <ToastContainer>
                            <OfflineBanner />
                            <div className="min-h-screen bg-gray-900 text-white flex flex-col">
                                <header className="p-4 bg-gray-800/80 backdrop-blur-lg border-b border-gray-700/50 shadow-lg sticky top-0 z-50">
                                    <div className="max-w-7xl mx-auto flex items-center justify-between">
                                        <h1 className="text-2xl font-bold gradient-text animate-gradient-x">Live Studio</h1>
                                        <div className="flex gap-3">
                                            <ImportButton onImport={() => { }} />
                                            <ExportButton annotations={[]} />
                                        </div>
                                    </div>
                                </header>
                                <main className="flex-1 flex flex-col md:flex-row gap-6 p-6 max-w-7xl mx-auto w-full">
                                    <section className="flex-1 flex flex-col gap-6 min-w-0">
                                        <div className="glass rounded-lg p-4 hover-card">
                                            <SyncControls />
                                        </div>
                                        <div className="glass rounded-lg p-4 hover-card">
                                            <VideoPlayer videoRef={videoRef} />
                                        </div>
                                        <div className="glass rounded-lg p-4 hover-card">
                                            <Timeline />
                                        </div>
                                        <div className="glass rounded-lg p-4 hover-card">
                                            <DrawCanvas />
                                        </div>
                                    </section>
                                    <aside className="w-full md:w-96 glass rounded-lg p-4 flex flex-col gap-4 border-l-2 border-blue-700/50 hover-card">
                                        <CommentsPanel videoRef={videoRef} />
                                        <div className="mt-4 p-4 glass rounded-lg text-sm text-gray-300">
                                            <strong className="text-blue-400 gradient-text">AI Suggestions (coming soon):</strong>
                                            <ul className="list-disc ml-4 mt-2 space-y-1">
                                                <li className="hover:text-blue-400 transition-colors duration-200">Summarize discussion</li>
                                                <li className="hover:text-blue-400 transition-colors duration-200">Suggest next steps</li>
                                                <li className="hover:text-blue-400 transition-colors duration-200">Auto-tag important moments</li>
                                            </ul>
                                        </div>
                                    </aside>
                                </main>
                            </div>
                        </ToastContainer>
                    </AnnotationProvider>
                </SyncProvider>
            </OfflineProvider>
        </ErrorBoundary>
    );
};

export default App; 