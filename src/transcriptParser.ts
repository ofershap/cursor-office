export type AgentActivityType = 'idle' | 'typing' | 'reading' | 'running' | 'editing' | 'searching' | 'celebrating';

export interface ParsedStatus {
  activity: AgentActivityType;
  statusText: string | null;
}

export function inferActivityFromText(text: string): ParsedStatus | null {
  const t = text.toLowerCase();

  if (/\b(read|reading|check|look at|inspect|examin|open)\b/.test(t) && /\b(file|code|content|config|package|module|source|dir|folder)\b/.test(t)) {
    return { activity: 'reading', statusText: extractTarget(text, 'Reading') };
  }
  if (/\b(search|grep|find|glob|looking for|scan|explor)\b/.test(t)) {
    return { activity: 'searching', statusText: extractTarget(text, 'Searching') };
  }
  if (/\b(run |running|execute|\$ |shell|terminal|npm |git |install|build|test|command)\b/.test(t)) {
    return { activity: 'running', statusText: extractTarget(text, 'Running') };
  }
  if (/\b(edit|updat|replac|modif|fix|chang|rewrit|writ|add .* to|creat|implement|refactor)\b/.test(t) && /\b(file|code|function|component|line|class|module|method)\b/.test(t)) {
    return { activity: 'editing', statusText: extractTarget(text, 'Editing') };
  }
  if (/\b(web|fetch|url|browse|http|download)\b/.test(t)) {
    return { activity: 'reading', statusText: 'Fetching web content...' };
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
