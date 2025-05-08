import React, { useState } from "react";
import { useSync } from "../../context/SyncContext";

const SyncControls: React.FC = () => {
    const { socket, room, joinRoom } = useSync();
    const [roomId, setRoomId] = useState("");
    const [isHost, setIsHost] = useState(false);
    const [nickname, setNickname] = useState("");
    const [showNicknameModal, setShowNicknameModal] = useState(false);
    const [pendingRoomId, setPendingRoomId] = useState("");

    const handleJoinRoom = (e: React.FormEvent) => {
        e.preventDefault();
        if (!roomId.trim() || !nickname.trim()) return;
        joinRoom(roomId.trim(), isHost, nickname.trim());
    };

    const handleCreateRoom = () => {
        const newRoomId = Math.random().toString(36).substring(7);
        setPendingRoomId(newRoomId);
        setShowNicknameModal(true);
    };

    const handleNicknameSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!nickname.trim()) return;
        joinRoom(pendingRoomId, true, nickname.trim());
        setRoomId(pendingRoomId);
        setIsHost(true);
        setShowNicknameModal(false);
    };

    return (
        <div className="mt-4 p-4 bg-gray-800 rounded">
            <h3 className="text-lg font-bold mb-2">Room Controls</h3>

            {showNicknameModal && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50">
                    <form onSubmit={handleNicknameSubmit} className="bg-gray-900 p-6 rounded shadow-lg flex flex-col gap-4 min-w-[300px]">
                        <label className="text-white font-semibold">Enter your nickname to create the room:</label>
                        <input
                            type="text"
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                            placeholder="Enter your nickname"
                            className="p-2 rounded bg-gray-700 text-white"
                            autoFocus
                        />
                        <button
                            type="submit"
                            className="px-4 py-2 bg-green-600 rounded hover:bg-green-700 text-white"
                        >
                            Create Room
                        </button>
                        <button
                            type="button"
                            className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-700 text-white"
                            onClick={() => setShowNicknameModal(false)}
                        >
                            Cancel
                        </button>
                    </form>
                </div>
            )}

            {!room ? (
                <div className="space-y-4">
                    <form onSubmit={handleJoinRoom} className="space-y-2">
                        <input
                            type="text"
                            value={roomId}
                            onChange={(e) => setRoomId(e.target.value)}
                            placeholder="Enter room ID"
                            className="w-full p-2 rounded bg-gray-700"
                        />
                        <input
                            type="text"
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                            placeholder="Enter your nickname"
                            className="w-full p-2 rounded bg-gray-700"
                        />
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="isHost"
                                checked={isHost}
                                onChange={(e) => setIsHost(e.target.checked)}
                                className="mr-2"
                            />
                            <label htmlFor="isHost">Join as host</label>
                        </div>
                        <button
                            type="submit"
                            className="w-full px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
                        >
                            Join Room
                        </button>
                    </form>

                    <div className="text-center">
                        <span className="text-gray-400">or</span>
                    </div>

                    <button
                        onClick={handleCreateRoom}
                        className="w-full px-4 py-2 bg-green-600 rounded hover:bg-green-700"
                    >
                        Create New Room
                    </button>
                </div>
            ) : (
                <div className="space-y-2">
                    <p className="text-sm">
                        Room ID: <span className="font-mono">{room.roomId}</span>
                    </p>
                    <p className="text-sm">
                        Status:{" "}
                        <span className={room.isHost ? "text-green-400" : "text-blue-400"}>
                            {room.isHost ? "Host" : "Viewer"}
                        </span>
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="w-full px-4 py-2 bg-red-600 rounded hover:bg-red-700"
                    >
                        Leave Room
                    </button>
                </div>
            )}
        </div>
    );
};

export default SyncControls; 