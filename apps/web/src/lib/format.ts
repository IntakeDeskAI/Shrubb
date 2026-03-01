/**
 * Shared formatting utilities for the Shrubb app.
 */

/** Format E.164 phone number to (XXX) XXX-XXXX */
export function formatPhone(e164: string): string {
  const digits = e164.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('1')) {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return e164;
}

/** Relative time string: "just now", "5m ago", "2h ago", "3d ago" */
export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  return `${days}d ago`;
}

/** Format call duration from start/end timestamps: "4m 32s" */
export function formatDuration(
  startedAt: string,
  endedAt: string | null,
): string {
  if (!endedAt) return 'In progress';
  const ms = new Date(endedAt).getTime() - new Date(startedAt).getTime();
  if (ms < 0) return '0s';
  const totalSecs = Math.floor(ms / 1000);
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
}

/** Format response time in seconds to human-readable: "3s", "1m 12s" */
export function formatResponseTime(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  if (secs === 0) return `${mins}m`;
  return `${mins}m ${secs}s`;
}

/** Compute response time in seconds from conversation timestamps. Returns null if unavailable. */
export function getResponseSeconds(
  firstInboundAt: string | null,
  firstResponseAt: string | null,
): number | null {
  if (!firstInboundAt || !firstResponseAt) return null;
  const diff =
    (new Date(firstResponseAt).getTime() -
      new Date(firstInboundAt).getTime()) /
    1000;
  if (diff < 0 || diff > 86400) return null;
  return diff;
}

export interface TranscriptLine {
  speaker: 'ai' | 'caller';
  text: string;
}

/**
 * Parse raw transcript text into structured speaker/text pairs.
 * Handles formats like:
 *   "AI: Hello there\nCaller: I need a patio"
 *   "Assistant: ...\nUser: ..."
 */
export function parseTranscript(raw: string | null): TranscriptLine[] {
  if (!raw) return [];
  const lines: TranscriptLine[] = [];
  const parts = raw.split('\n').filter((l) => l.trim());

  for (const line of parts) {
    const aiMatch = line.match(/^(AI|Assistant|Bot|Shrubb)\s*:\s*(.+)/i);
    if (aiMatch) {
      lines.push({ speaker: 'ai', text: aiMatch[2].trim() });
      continue;
    }
    const callerMatch = line.match(
      /^(Caller|Customer|User|Human|Client)\s*:\s*(.+)/i,
    );
    if (callerMatch) {
      lines.push({ speaker: 'caller', text: callerMatch[2].trim() });
      continue;
    }
    // If no prefix, append to previous line or create as caller
    if (lines.length > 0) {
      lines[lines.length - 1].text += ' ' + line.trim();
    } else {
      lines.push({ speaker: 'caller', text: line.trim() });
    }
  }
  return lines;
}

/** Format a date for display: "Today 2:15 PM", "Yesterday 4:30 PM", or "Mar 5, 2:15 PM" */
export function formatTimestamp(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const timeStr = date.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });

  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();
  if (isToday) return `Today ${timeStr}`;

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();
  if (isYesterday) return `Yesterday ${timeStr}`;

  const monthDay = date.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
  });
  return `${monthDay}, ${timeStr}`;
}
