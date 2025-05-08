import React, { useState, RefObject } from "react";
import { useAnnotations } from "../../context/AnnotationContext";
import { useSync } from "../../context/SyncContext";

function formatDateTime(ts: number) {
    const d = new Date(ts);
    return d.toLocaleString();
}

interface CommentsPanelProps {
    videoRef: RefObject<HTMLVideoElement>;
}

const CommentsPanel: React.FC<CommentsPanelProps> = ({ videoRef }) => {
    const { annotations, addAnnotation, updateAnnotation, deleteAnnotation } = useAnnotations();
    const { room } = useSync();
    const [newComment, setNewComment] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || !room?.nickname) return;

        addAnnotation({
            id: Date.now().toString(),
            timestamp: Date.now(),
            text: newComment.trim(),
            author: room.nickname,
        });

        setNewComment("");
    };

    const sortedAnnotations = [...annotations].sort((a, b) => b.timestamp - a.timestamp);

    return (
        <div className="p-4">
            <h2 className="text-lg font-bold mb-4">Comments</h2>

            <form onSubmit={handleSubmit} className="mb-4">
                <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="w-full p-2 rounded bg-gray-800 border border-gray-700"
                    rows={3}
                />
                <button
                    type="submit"
                    className="mt-2 px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
                >
                    Add Comment
                </button>
            </form>

            <div className="space-y-4">
                {sortedAnnotations.map((comment) => (
                    <div
                        key={comment.id}
                        className="bg-gray-800 rounded p-2 mb-2"
                    >
                        <div className="flex items-center mb-1 gap-2">
                            <span className="font-semibold text-blue-300 text-xs">{comment.author || "Unknown"}</span>
                            <span className="text-xs text-gray-400">{formatDateTime(comment.timestamp)}</span>
                        </div>
                        <p className="text-white text-sm mb-1">{comment.text}</p>
                        <div className="flex justify-end mt-2">
                            <button
                                onClick={() => deleteAnnotation(comment.id)}
                                className="text-xs text-red-400 hover:text-red-300"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CommentsPanel; 