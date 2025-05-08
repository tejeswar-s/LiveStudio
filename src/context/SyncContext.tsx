import React, { createContext, useContext, useState, useEffect } from "react";
import { io, Socket } from "socket.io-client";

interface VideoState {
    currentTime: number;
    duration: number;
    isPlaying: boolean;
    playbackRate: number;
}

interface Room {
    roomId: string;
    isHost: boolean;
    nickname?: string;
}

interface SyncContextType {
    socket: Socket | null;
    room: Room | null;
    videoState: VideoState;
    setVideoState: (state: VideoState) => void;
    joinRoom: (roomId: string, isHost: boolean, nickname: string) => void;
}

const SyncContext = createContext<SyncContextType>({
    socket: null,
    room: null,
    videoState: {
        currentTime: 0,
        duration: 0,
        isPlaying: false,
        playbackRate: 1
    },
    setVideoState: () => { },
    joinRoom: () => { },
});

export const useSync = () => useContext(SyncContext);

export const SyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [room, setRoom] = useState<Room | null>(null);
    const [videoState, setVideoState] = useState<VideoState>({
        currentTime: 0,
        duration: 0,
        isPlaying: false,
        playbackRate: 1
    });

    useEffect(() => {
        const newSocket = io("http://localhost:3000");
        setSocket(newSocket);

        newSocket.on("connect", () => {
            console.log("Connected to server");
        });

        newSocket.on("roomCreated", (data: { roomId: string }) => {
            setRoom({ roomId: data.roomId, isHost: true });
        });

        newSocket.on("roomJoined", (data: { roomId: string }) => {
            setRoom({ roomId: data.roomId, isHost: false });
        });

        newSocket.on("timeUpdate", (data: VideoState) => {
            setVideoState(data);
        });

        return () => {
            newSocket.close();
        };
    }, []);

    const joinRoom = (roomId: string, isHost: boolean, nickname: string) => {
        if (!socket) return;

        setRoom({ roomId, isHost, nickname });
        socket.emit("join-room", { roomId, isHost, nickname });
    };

    return (
        <SyncContext.Provider value={{ socket, room, videoState, setVideoState, joinRoom }}>
            {children}
        </SyncContext.Provider>
    );
}; 