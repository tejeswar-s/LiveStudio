import React, { useEffect, useRef, useState } from "react";
import { fabric } from "fabric";
import { useSync } from "../../context/SyncContext";
import { useAnnotations } from "../../context/AnnotationContext";

const DrawCanvas: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
    const { socket, room } = useSync();
    const isHost = !!room?.isHost;
    const [initialCanvasJson, setInitialCanvasJson] = useState<string | null>(null);
    const [isDrawingMode, setIsDrawingMode] = useState(false);

    // On join, get initial canvas state from roomState
    useEffect(() => {
        if (!socket) return;
        const handleRoomState = (data: any) => {
            if (data.canvasJson) setInitialCanvasJson(data.canvasJson);
        };
        socket.on("roomState", handleRoomState);
        return () => {
            socket.off("roomState", handleRoomState);
        };
    }, [socket]);

    useEffect(() => {
        if (!canvasRef.current) return;
        const c = new fabric.Canvas(canvasRef.current, {
            isDrawingMode: isHost,
            width: 640,
            height: 360,
            selection: false,
        });
        c.freeDrawingBrush.width = 2;
        c.freeDrawingBrush.color = "#ff0000";
        c.isDrawingMode = isHost;
        c.selection = false;
        c.skipTargetFind = true;
        setCanvas(c);
        setIsDrawingMode(isHost); // initialize button state
        return () => {
            c.dispose();
        };
    }, [canvasRef, isHost]);

    // Load initial canvas state on join
    useEffect(() => {
        if (canvas && initialCanvasJson) {
            canvas.loadFromJSON(JSON.parse(initialCanvasJson), () => {
                canvas.renderAll();
            });
        }
    }, [canvas, initialCanvasJson]);

    // Host: emit full canvas JSON after draw/clear
    useEffect(() => {
        if (!canvas || !socket || !isHost) return;
        const handlePath = () => {
            const json = JSON.stringify(canvas.toJSON());
            socket.emit("add-annotation", {
                roomId: room?.roomId,
                annotation: {
                    drawing: json,
                },
            });
        };
        canvas.on("path:created", handlePath);
        return () => {
            canvas.off("path:created", handlePath);
        };
    }, [canvas, socket, isHost, room?.roomId]);

    // Host: emit full canvas JSON after clear
    const clearCanvas = () => {
        if (!canvas || !isHost || !socket) return;
        canvas.clear();
        socket.emit("clear-canvas", { roomId: room?.roomId });
    };

    // Viewers: always load the latest canvas JSON
    useEffect(() => {
        if (!canvas || !socket) return;
        const handleCanvasUpdate = ({ canvasJson }: { canvasJson: string | null }) => {
            if (canvasJson) {
                canvas.loadFromJSON(JSON.parse(canvasJson), () => {
                    canvas.renderAll();
                });
            } else {
                canvas.clear();
            }
        };
        socket.on("canvas-update", handleCanvasUpdate);
        return () => {
            socket.off("canvas-update", handleCanvasUpdate);
        };
    }, [canvas, socket]);

    const toggleDrawing = () => {
        if (!canvas || !isHost) return;
        const newMode = !canvas.isDrawingMode;
        canvas.isDrawingMode = newMode;
        setIsDrawingMode(newMode);
    };

    return (
        <div className="mt-4">
            <div className="flex gap-2 mb-2">
                <button
                    onClick={toggleDrawing}
                    className={`px-4 py-2 rounded ${isDrawingMode ? "bg-red-600" : "bg-blue-600"}`}
                    disabled={!isHost}
                >
                    {isDrawingMode ? "Stop Drawing" : "Start Drawing"}
                </button>
                <button
                    onClick={clearCanvas}
                    className="px-4 py-2 rounded bg-gray-600"
                    disabled={!isHost}
                >
                    Clear
                </button>
                {!isHost && (
                    <span className="ml-2 text-sm text-gray-400">View only (host can draw)</span>
                )}
            </div>
            <canvas
                ref={canvasRef}
                className="border border-gray-700 rounded"
                style={!isHost ? { pointerEvents: 'none', background: '#222' } : {}}
            />
        </div>
    );
};

export default DrawCanvas; 