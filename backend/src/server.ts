import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import mime from 'mime';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: 'http://localhost:5173',
        methods: ['GET', 'POST']
    }
});

app.use(cors());
app.use(express.json());

// Ensure videos directory exists
const VIDEOS_DIR = path.join(__dirname, '../../videos');
if (!fs.existsSync(VIDEOS_DIR)) {
    fs.mkdirSync(VIDEOS_DIR);
}

// Ensure subtitles directory exists
const SUBTITLES_DIR = path.join(__dirname, '../../subtitles');
if (!fs.existsSync(SUBTITLES_DIR)) {
    fs.mkdirSync(SUBTITLES_DIR);
}

// Multer setup for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, VIDEOS_DIR);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    },
});
const upload = multer({ storage });

// Serve static video files
app.use('/videos', express.static(VIDEOS_DIR));

interface PlaybackState {
    playing: boolean;
    currentTime: number;
    playbackRate: number;
    lastUpdateTimestamp: number; // server time in ms
}

interface Room {
    videoFile: string | null;
    videoUrl: string | null;
    subtitleFile: string | null;
    subtitleUrl: string | null;
    playbackState: PlaybackState;
    annotations: any[];
    hostSocketId: string | null;
    canvasJson: string | null;
    users: Map<string, { nickname: string; isHost: boolean }>;
}

const rooms = new Map<string, Room>();

// Upload endpoint (host uploads video and creates room)
app.post('/upload', upload.fields([
    { name: 'video', maxCount: 1 },
    { name: 'subtitle', maxCount: 1 }
]), async (req, res) => {
    const { roomId } = req.body;
    const videoFile = req.files && req.files['video'] ? req.files['video'][0].filename : null;
    const videoUrl = videoFile ? `/videos/${videoFile}` : null;

    // Handle subtitle file if provided
    let subtitleFile = null;
    let subtitleUrl = null;
    if (req.files && req.files['subtitle']) {
        subtitleFile = req.files['subtitle'][0].filename;
        subtitleUrl = `/subtitles/${subtitleFile}`;
    }

    if (!videoFile && !subtitleFile) {
        return res.status(400).json({ error: 'Missing file(s) or roomId' });
    }
    if (!roomId) {
        return res.status(400).json({ error: 'Missing roomId' });
    }

    // Ensure video file is fully written and flushed if present
    if (videoFile) {
        const filePath = path.join(VIDEOS_DIR, videoFile);
        let ready = false;
        let lastError = null;
        for (let i = 0; i < 5; i++) {
            try {
                const fd = await fs.promises.open(filePath, 'r');
                const buffer = Buffer.alloc(1);
                await fd.read(buffer, 0, 1, 0);
                await fd.close();
                ready = true;
                break;
            } catch (err) {
                lastError = err;
                await new Promise((resolve) => setTimeout(resolve, 200));
            }
        }
        if (!ready) {
            console.error('File not ready after upload:', lastError);
            return res.status(500).json({ error: 'File not ready after upload', details: String(lastError) });
        }
    }

    if (!rooms.has(roomId)) {
        rooms.set(roomId, {
            videoFile,
            videoUrl,
            subtitleFile,
            subtitleUrl,
            playbackState: {
                playing: false,
                currentTime: 0,
                playbackRate: 1,
                lastUpdateTimestamp: Date.now(),
            },
            annotations: [],
            hostSocketId: null,
            canvasJson: null,
            users: new Map()
        });
    } else {
        const room = rooms.get(roomId)!;
        if (videoFile) {
            room.videoFile = videoFile;
            room.videoUrl = videoUrl;
        }
        if (subtitleFile) {
            room.subtitleFile = subtitleFile;
            room.subtitleUrl = subtitleUrl;
        }
    }
    res.json({ videoUrl, subtitleUrl });
});

// Serve subtitle files
app.use('/subtitles', express.static(SUBTITLES_DIR));

// Get video info for a room
app.get('/room/:roomId/video', (req, res) => {
    const { roomId } = req.params;
    const room = rooms.get(roomId);
    if (!room || !room.videoUrl) {
        return res.status(404).json({ error: 'No video for this room' });
    }
    res.json({
        videoUrl: room.videoUrl,
        subtitleUrl: room.subtitleUrl
    });
});

// Custom video streaming endpoint
app.get('/stream/:filename', (req, res) => {
    const filePath = path.join(VIDEOS_DIR, req.params.filename);
    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            return res.status(404).end('File not found');
        }
        // CORS headers for video and canvas
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Headers', 'Range');
        res.setHeader('Access-Control-Expose-Headers', 'Content-Range, Accept-Ranges');
        const range = req.headers.range;
        const fileSize = stats.size;
        if (!range) {
            res.writeHead(200, {
                'Content-Length': fileSize,
                'Content-Type': mime.getType(filePath) || 'video/mp4',
            });
            fs.createReadStream(filePath).pipe(res);
            return;
        }
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunkSize = (end - start) + 1;
        res.writeHead(206, {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunkSize,
            'Content-Type': mime.getType(filePath) || 'video/mp4',
        });
        fs.createReadStream(filePath, { start, end }).pipe(res);
    });
});

// NTP-like clock sync
io.on('connection', (socket) => {
    socket.on('ping', (clientTime) => {
        socket.emit('pong', { serverTime: Date.now(), clientTime });
    });

    socket.on('join-room', ({ roomId, isHost, nickname }) => {
        socket.join(roomId);
        if (!rooms.has(roomId)) {
            rooms.set(roomId, {
                videoFile: null,
                videoUrl: null,
                subtitleFile: null,
                subtitleUrl: null,
                playbackState: {
                    playing: false,
                    currentTime: 0,
                    playbackRate: 1,
                    lastUpdateTimestamp: Date.now(),
                },
                annotations: [],
                hostSocketId: isHost ? socket.id : null,
                canvasJson: null,
                users: new Map([[socket.id, { nickname, isHost }]])
            });
        } else {
            const room = rooms.get(roomId)!;
            room.users.set(socket.id, { nickname, isHost });
            if (isHost) {
                room.hostSocketId = socket.id;
            }
        }
        const room = rooms.get(roomId)!;
        socket.emit('roomState', {
            videoUrl: room.videoUrl,
            subtitleUrl: room.subtitleUrl,
            playbackState: room.playbackState,
            annotations: room.annotations,
            canvasJson: room.canvasJson,
        });
    });

    // Only host can control playback
    socket.on('host-action', ({ roomId, action, currentTime, playbackRate }) => {
        const room = rooms.get(roomId);
        if (!room || room.hostSocketId !== socket.id) return;
        const now = Date.now();
        let playing = room.playbackState.playing;
        if (action === 'play') playing = true;
        if (action === 'pause') playing = false;
        room.playbackState = {
            playing,
            currentTime,
            playbackRate,
            lastUpdateTimestamp: now,
        };
        socket.to(roomId).emit('sync-playback', {
            playing,
            currentTime,
            playbackRate,
            serverTimestamp: now,
        });
    });

    // Handle time updates from host
    socket.on('timeUpdate', ({ roomId, time, duration, isPlaying, playbackRate }) => {
        const room = rooms.get(roomId);
        if (!room || room.hostSocketId !== socket.id) return;

        room.playbackState = {
            playing: isPlaying,
            currentTime: time,
            playbackRate,
            lastUpdateTimestamp: Date.now(),
        };

        // Broadcast to all viewers
        socket.to(roomId).emit('sync-playback', {
            playing: isPlaying,
            currentTime: time,
            playbackRate,
            serverTimestamp: Date.now(),
        });
    });

    // Handle seek events
    socket.on('seek', ({ roomId, time }) => {
        const room = rooms.get(roomId);
        if (!room) return;

        // Update room state
        room.playbackState = {
            ...room.playbackState,
            currentTime: time,
            lastUpdateTimestamp: Date.now(),
        };

        // Broadcast to all clients in the room
        io.to(roomId).emit('sync-playback', {
            playing: room.playbackState.playing,
            currentTime: time,
            playbackRate: room.playbackState.playbackRate,
            serverTimestamp: Date.now(),
        });
    });

    // Collaborative drawing and comments: host emits full canvas JSON, anyone can comment
    socket.on('add-annotation', ({ roomId, annotation }) => {
        const room = rooms.get(roomId);
        if (!room) return;

        // Drawing sync (host only)
        if (annotation.drawing) {
            if (room.hostSocketId === socket.id) {
                room.canvasJson = annotation.drawing;
                io.to(roomId).emit('canvas-update', { canvasJson: annotation.drawing });
            }
            return;
        }

        // Comments: allow anyone to add
        room.annotations.push(annotation);
        io.to(roomId).emit('add-annotation', annotation);
    });

    // On join, viewer can request the latest canvas state (already sent in roomState)

    socket.on('clear-canvas', ({ roomId }) => {
        const room = rooms.get(roomId);
        if (room && room.hostSocketId === socket.id) {
            room.canvasJson = null;
            io.to(roomId).emit('canvas-update', { canvasJson: null });
        }
    });

    // Annotations (comments, etc.)
    socket.on('update-annotation', ({ roomId, annotation }) => {
        const room = rooms.get(roomId);
        if (room) {
            room.annotations = room.annotations.map((a) => a.id === annotation.id ? annotation : a);
            io.to(roomId).emit('update-annotation', annotation);
        }
    });
    socket.on('delete-annotation', ({ roomId, annotationId }) => {
        const room = rooms.get(roomId);
        if (room) {
            room.annotations = room.annotations.filter((a) => a.id !== annotationId);
            io.to(roomId).emit('delete-annotation', annotationId);
        }
    });

    socket.on('disconnect', () => {
        for (const [roomId, room] of rooms.entries()) {
            if (room.hostSocketId === socket.id) {
                room.playbackState.playing = false;
                io.to(roomId).emit('sync-playback', {
                    playing: false,
                    currentTime: room.playbackState.currentTime,
                    playbackRate: room.playbackState.playbackRate,
                    serverTimestamp: Date.now(),
                });
                room.hostSocketId = null;
            }
        }
    });
});

const PORT = 3000;
httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 