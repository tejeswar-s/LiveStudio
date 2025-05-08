export interface Annotation {
  id: string;
  timestamp: number;
  text: string;
  thread?: Annotation[];
  author?: string;
  drawing?: string; // serialized fabric.js JSON
}

export interface VideoState {
  playing: boolean;
  currentTime: number;
  playbackRate: number;
}

export interface RoomState {
  roomId: string;
  isHost: boolean;
  nickname: string;
}

export interface User {
  nickname: string;
  isHost: boolean;
}

export interface Room {
  roomId: string;
  isHost: boolean;
  nickname: string;
  users?: Map<string, User>;
}

export interface SubtitleCue {
  start: number;
  end: number;
  text: string;
}

export interface DrawingState {
  objects: any[]; // fabric.js objects
  timestamp: number;
} 