export type AgentActivityType = 'idle' | 'typing' | 'reading' | 'running' | 'editing' | 'searching' | 'celebrating' | 'phoning' | 'error';

export interface ParsedStatus {
  activity: AgentActivityType;
  statusText: string | null;
}

export function inferActivityFromText(text: string): ParsedStatus | null {
  const t = text.toLowerCase();

  if (/\b(read|reading|check|look at|inspect|examin|open)\b/.test(t) && /\b(file|code|content|config|package|module|source|dir|folder)\b/.test(t)) {
    return { activity: 'reading', statusText: 'Working...' };
  }
  if (/\b(search|grep|find|glob|looking for|scan|explor)\b/.test(t)) {
    return { activity: 'searching', statusText: 'Working...' };
  }
  if (/\b(run |running|execute|\$ |shell|terminal|npm |git |install|build|test|command)\b/.test(t)) {
    return { activity: 'running', statusText: 'Working...' };
  }
  if (/\b(edit|updat|replac|modif|fix|chang|rewrit|writ|add .* to|creat|implement|refactor)\b/.test(t) && /\b(file|code|function|component|line|class|module|method)\b/.test(t)) {
    return { activity: 'editing', statusText: 'Working...' };
  }
  if (/\b(web|fetch|url|browse|http|download)\b/.test(t)) {
    return { activity: 'reading', statusText: 'Working...' };
  }
  if (/\b(complet|done|finish|success|all .* complete)\b/.test(t)) {
    return { activity: 'celebrating', statusText: 'Done!' };
  }
  if (/\b(let me|i'll|going to|need to|now|start)\b/.test(t) && text.length < 200) {
    return { activity: 'typing', statusText: 'Working...' };
  }

  if (text.length > 50) {
    return { activity: 'typing', statusText: null };
  }

  return null;
}

function extractTarget(text: string, prefix: string): string {
  const fileMatch = text.match(/[`"]([^`"]+\.\w{1,5})[`"]/);
  if (fileMatch) return `${prefix} ${fileMatch[1]}...`;

  const backtickMatch = text.match(/`([^`]+)`/);
  if (backtickMatch && backtickMatch[1]!.length < 40) return `${prefix} ${backtickMatch[1]}...`;

  return `${prefix}...`;
}

export function parseTranscriptLine(line: string): ParsedStatus | null {
  try {
    const record = JSON.parse(line);
    const role = record.role || record.type;
    if (!role) return null;

    if (role === 'user') {
      return { activity: 'idle', statusText: null };
    }

    if (role === 'assistant') {
      let text = '';

      if (record.message?.content) {
        const content = record.message.content;
        if (Array.isArray(content)) {
          for (const part of content) {
            if (part.type === 'text' && part.text) {
              text += part.text + ' ';
            }
          }
        } else if (typeof content === 'string') {
          text = content;
        }
      }

      if (!text && typeof record.message === 'string') {
        text = record.message;
      }
      if (!text && record.text) {
        text = record.text;
      }
      if (!text && record.content?.[0]?.text) {
        text = record.content[0].text;
      }

      text = text.trim();
      if (!text || text.length > 2000) return null;

      return inferActivityFromText(text);
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Parses a flat-text transcript block (Cursor on Windows / recent versions).
 *
 * Cursor stores transcripts as plain-text `.txt` files directly inside
 * `agent-transcripts/`, using a block format like:
 *
 *   user:
 *   <user_query>...</user_query>
 *
 *   assistant:
 *   [Thinking] ...
 *   [Tool call] Read
 *   [Tool result] ...
 *
 * This function receives a multi-line chunk of new content appended to the
 * file and returns the first meaningful status inferred from it.
 */
export function parseFlatTxtChunk(chunk: string): ParsedStatus | null {
  const lines = chunk.split('\n');
  let currentRole: 'user' | 'assistant' | null = null;
  let assistantBuffer = '';

  for (const raw of lines) {
    const line = raw.trimEnd();

    if (line === 'user:') {
      if (assistantBuffer.trim()) {
        const status = inferActivityFromText(assistantBuffer.trim());
        if (status) return status;
      }
      currentRole = 'user';
      assistantBuffer = '';
      continue;
    }

    if (line === 'assistant:') {
      currentRole = 'assistant';
      assistantBuffer = '';
      continue;
    }

    if (currentRole === 'user' && line.trim()) {
      return { activity: 'idle', statusText: null };
    }

    if (currentRole === 'assistant' && line.trim()) {
      // [Tool call] lines give rich activity signals
      const toolCallMatch = line.match(/^\[Tool call\]\s+(\w+)/);
        if (toolCallMatch) {
          switch (toolCallMatch[1]!.toLowerCase()) {
            case 'read':
            case 'glob':
            case 'grep':
            case 'semanticsearch':
              return { activity: 'reading', statusText: 'Working...' };
            case 'shell':
            case 'bash':
              return { activity: 'running', statusText: 'Working...' };
            case 'strreplace':
            case 'write':
            case 'editnotebook':
            case 'delete':
              return { activity: 'editing', statusText: 'Working...' };
            case 'task':
              return { activity: 'phoning', statusText: 'Delegating...' };
            default:
              return { activity: 'typing', statusText: 'Working...' };
          }
        }

      // Accumulate [Thinking] and plain assistant text for inference
      const thinkingMatch = line.match(/^\[Thinking\]\s*(.*)/);
      if (thinkingMatch) {
        assistantBuffer += (thinkingMatch[1] ?? '') + ' ';
      } else if (!line.startsWith('[Tool result]') && !line.startsWith('[Tool')) {
        assistantBuffer += line + ' ';
      }
    }
  }

  if (assistantBuffer.trim()) {
    return inferActivityFromText(assistantBuffer.trim());
  }

  return null;
}
