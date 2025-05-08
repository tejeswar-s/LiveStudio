import { SubtitleCue } from "../types";

interface SubtitleCue {
  start: number;
  end: number;
  text: string;
}

export function parseVTT(content: string): SubtitleCue[] {
  const cues: SubtitleCue[] = [];
  const lines = content.split('\n');
  let currentCue: Partial<SubtitleCue> = {};
  let textBuffer: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip WEBVTT header and empty lines
    if (line === 'WEBVTT' || line === '' || line.startsWith('NOTE')) {
      continue;
    }

    // Parse timestamp line
    if (line.includes('-->')) {
      // If we have a previous cue, save it
      if (currentCue.start !== undefined && currentCue.end !== undefined && textBuffer.length > 0) {
        cues.push({
          start: currentCue.start,
          end: currentCue.end,
          text: textBuffer.join('\n')
        });
        textBuffer = [];
      }

      const [start, end] = line.split('-->').map(time => {
        const [h, m, s] = time.trim().split(':');
        return parseFloat(h) * 3600 + parseFloat(m) * 60 + parseFloat(s.replace(',', '.'));
      });

      currentCue = { start, end };
    } else if (currentCue.start !== undefined) {
      // Add text to current cue
      textBuffer.push(line);
    }
  }

  // Add the last cue
  if (currentCue.start !== undefined && currentCue.end !== undefined && textBuffer.length > 0) {
    cues.push({
      start: currentCue.start,
      end: currentCue.end,
      text: textBuffer.join('\n')
    });
  }

  return cues;
}

export function parseSRT(content: string): SubtitleCue[] {
  const cues: SubtitleCue[] = [];
  const lines = content.split('\n');
  let currentCue: Partial<SubtitleCue> = {};
  let textBuffer: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip empty lines
    if (line === '') {
      continue;
    }

    // Parse timestamp line
    if (line.includes('-->')) {
      // If we have a previous cue, save it
      if (currentCue.start !== undefined && currentCue.end !== undefined && textBuffer.length > 0) {
        cues.push({
          start: currentCue.start,
          end: currentCue.end,
          text: textBuffer.join('\n')
        });
        textBuffer = [];
      }

      const [start, end] = line.split('-->').map(time => {
        const [h, m, s] = time.trim().split(':');
        return parseFloat(h) * 3600 + parseFloat(m) * 60 + parseFloat(s.replace(',', '.'));
      });

      currentCue = { start, end };
    } else if (currentCue.start !== undefined) {
      // Add text to current cue
      textBuffer.push(line);
    }
  }

  // Add the last cue
  if (currentCue.start !== undefined && currentCue.end !== undefined && textBuffer.length > 0) {
    cues.push({
      start: currentCue.start,
      end: currentCue.end,
      text: textBuffer.join('\n')
    });
  }

  return cues;
}

export function parseSubtitleFile(content: string, type: 'vtt' | 'srt'): SubtitleCue[] {
  return type === 'vtt' ? parseVTT(content) : parseSRT(content);
} 