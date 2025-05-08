import React, { createContext, useContext, useState, useEffect } from "react";
import { Annotation } from "../types";
import { useSync } from "./SyncContext";
import { saveAnnotation, getAnnotations } from "../hooks/useIndexedDB";

interface AnnotationContextType {
    annotations: Annotation[];
    addAnnotation: (annotation: Annotation) => void;
    updateAnnotation: (annotation: Annotation) => void;
    deleteAnnotation: (id: string) => void;
}

const AnnotationContext = createContext<AnnotationContextType | null>(null);

export const AnnotationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [annotations, setAnnotations] = useState<Annotation[]>([]);
    const { socket, room } = useSync();

    useEffect(() => {
        if (socket) {
            socket.on("add-annotation", (annotation: Annotation) => {
                setAnnotations((prev) => [...prev, annotation]);
                saveAnnotation(annotation);
            });

            socket.on("update-annotation", (annotation: Annotation) => {
                setAnnotations((prev) =>
                    prev.map((a) => (a.id === annotation.id ? annotation : a))
                );
                saveAnnotation(annotation);
            });

            socket.on("delete-annotation", (id: string) => {
                setAnnotations((prev) => prev.filter((a) => a.id !== id));
            });

            // Listen for roomState and set annotations from backend
            socket.on("roomState", (data: any) => {
                if (data.annotations) {
                    setAnnotations(data.annotations);
                }
            });
        }
    }, [socket]);

    // Clear comments when leaving the room
    useEffect(() => {
        if (!room) {
            setAnnotations([]);
        }
    }, [room]);

    const addAnnotation = (annotation: Annotation) => {
        if (room) {
            socket?.emit("add-annotation", { roomId: room.roomId, annotation });
        }
        // Do NOT update state here; let the socket event handle it
        // Optionally, you can still saveAnnotation(annotation) if you want local persistence
    };

    const updateAnnotation = (annotation: Annotation) => {
        setAnnotations((prev) =>
            prev.map((a) => (a.id === annotation.id ? annotation : a))
        );
        if (room) {
            socket?.emit("update-annotation", { roomId: room.roomId, annotation });
        }
        saveAnnotation(annotation);
    };

    const deleteAnnotation = (id: string) => {
        setAnnotations((prev) => prev.filter((a) => a.id !== id));
        if (room) {
            socket?.emit("delete-annotation", { roomId: room.roomId, annotationId: id });
        }
    };

    return (
        <AnnotationContext.Provider
            value={{ annotations, addAnnotation, updateAnnotation, deleteAnnotation }}
        >
            {children}
        </AnnotationContext.Provider>
    );
};

export const useAnnotations = () => {
    const context = useContext(AnnotationContext);
    if (!context) {
        throw new Error("useAnnotations must be used within an AnnotationProvider");
    }
    return context;
}; 