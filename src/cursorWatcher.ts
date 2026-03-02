import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as vscode from 'vscode';
import { parseTranscriptLine, parseFlatTxtChunk, ParsedStatus } from './transcriptParser';
import { isHooksInstalled, getStateFilePath } from './hooksInstaller';

export class CursorWatcher implements vscode.Disposable {
  private watchers: fs.FSWatcher[] = [];
  private filePositions = new Map<string, number>();
  private scanInterval: ReturnType<typeof setInterval> | null = null;
  private transcriptsDir: string | null = null;
  private onStatusChange: (status: ParsedStatus) => void;
  private idleTimer: ReturnType<typeof setTimeout> | null = null;
  private dirWatcher: fs.FSWatcher | null = null;
  private hooksMode = false;
  private hooksWatcher: fs.FSWatcher | null = null;
  private lastHooksContent = '';
  private didRealWork = false;
  private log: vscode.OutputChannel;

  constructor(onStatusChange: (status: ParsedStatus) => void) {
    this.onStatusChange = onStatusChange;
    this.log = vscode.window.createOutputChannel('Cursor Office');
  }

  start(workspacePath?: string) {
    if (isHooksInstalled()) {
      this.log.appendLine('[start] Hooks detected — using hooks mode');
      this.hooksMode = true;
      this.startHooksWatcher();
      return;
    }

    const wsPath = workspacePath || vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    this.log.appendLine(`[start] workspace: ${wsPath} (transcript mode)`);
    this.transcriptsDir = this.findTranscriptsDir(wsPath);
    if (!this.transcriptsDir) {
      this.log.appendLine('[start] No transcripts directory found — watcher inactive');
      return;
    }

    this.log.appendLine(`[start] Watching: ${this.transcriptsDir}`);
    this.scanAll();

    try {
      this.dirWatcher = fs.watch(this.transcriptsDir, { persistent: false }, (_event, filename) => {
        this.log.appendLine(`[fs.watch] event on dir, filename=${filename}`);
        this.scanAll();
      });
      this.watchers.push(this.dirWatcher);
    } catch (e) {
      this.log.appendLine(`[start] fs.watch failed: ${e}`);
    }

    this.scanInterval = setInterval(() => this.scanAll(), 2000);
  }

  private startHooksWatcher() {
    const stateFile = getStateFilePath();
    this.log.appendLine(`[hooks] Watching state file: ${stateFile}`);

    const pollState = () => {
      try {
        if (!fs.existsSync(stateFile)) return;
        const content = fs.readFileSync(stateFile, 'utf-8').trim();
        if (content === this.lastHooksContent) return;
        this.lastHooksContent = content;

        const state = JSON.parse(content);
        let activity = state.activity || 'idle';
        const tool = state.tool || null;

        if (activity === 'editing' || activity === 'running') {
          this.didRealWork = true;
        }

        if (activity === 'celebrating' && !this.didRealWork) {
          activity = 'idle';
        }

        if (activity === 'idle' || activity === 'celebrating') {
          this.didRealWork = false;
        }

        this.log.appendLine(`[hooks] ${activity}${tool ? ` (${tool})` : ''}`);

        const statusMap: Record<string, string> = {
          reading: 'Working...',
          editing: 'Working...',
          running: 'Working...',
          typing: 'Working...',
          searching: 'Working...',
          celebrating: 'Done!',
          phoning: 'Delegating...',
          error: '⁉️',
        };

        this.onStatusChange({
          activity: activity as ParsedStatus['activity'],
          statusText: statusMap[activity] || null,
        });
      } catch (e) {
        this.log.appendLine(`[hooks] Error reading state: ${e}`);
      }
    };

    try {
      this.hooksWatcher = fs.watch(path.dirname(stateFile), { persistent: false }, (_event, filename) => {
        if (filename === path.basename(stateFile)) {
          pollState();
        }
      });
    } catch {
      this.log.appendLine('[hooks] fs.watch on /tmp failed, falling back to polling');
    }

    this.scanInterval = setInterval(pollState, 1000);
  }

  private findTranscriptsDir(wsPath?: string): string | null {
    if (!wsPath) {
      this.log.appendLine('[find] No workspace path');
      return null;
    }

    const cursorRoot = path.join(os.homedir(), '.cursor', 'projects');
    if (!fs.existsSync(cursorRoot)) {
      this.log.appendLine(`[find] Cursor root missing: ${cursorRoot}`);
      return null;
    }

    const dirName = wsPath.replace(/[^a-zA-Z0-9-]/g, '-');
    const candidates = [
      dirName,
      dirName.replace(/^-+/, ''),
    ];

    this.log.appendLine(`[find] candidates: ${JSON.stringify(candidates)}`);

    for (const candidate of candidates) {
      const transcriptsDir = path.join(cursorRoot, candidate, 'agent-transcripts');
      if (fs.existsSync(transcriptsDir)) {
        this.log.appendLine(`[find] Match via candidate: ${candidate}`);
        return transcriptsDir;
      }
    }

    const wsBase = path.basename(wsPath);
    try {
      const dirs = fs.readdirSync(cursorRoot, { withFileTypes: true });
      for (const entry of dirs) {
        if (!entry.isDirectory() || !entry.name.includes(wsBase)) continue;
        const transcriptsDir = path.join(cursorRoot, entry.name, 'agent-transcripts');
        if (fs.existsSync(transcriptsDir)) {
          this.log.appendLine(`[find] Match via basename scan: ${entry.name}`);
          return transcriptsDir;
        }
      }
    } catch { /* ignore */ }

    this.log.appendLine('[find] No match found in any candidate');
    return null;
  }

  private scanAll() {
    if (!this.transcriptsDir) return;

    try {
      const entries = fs.readdirSync(this.transcriptsDir, { withFileTypes: true });
      for (const entry of entries) {
        // Format A: sub-directory with <uuid>/<uuid>.jsonl (Linux/Mac)
        if (entry.isDirectory()) {
          const jsonlPath = path.join(this.transcriptsDir, entry.name, entry.name + '.jsonl');
          if (fs.existsSync(jsonlPath)) {
            if (!this.filePositions.has(jsonlPath)) {
              this.log.appendLine(`[scan] New JSONL transcript: ${entry.name}`);
              this.watchFile(jsonlPath);
            } else {
              this.readNewContent(jsonlPath);
            }
          }
          continue;
        }

        // Format B: flat <uuid>.txt file (Windows / Cursor ≥ 0.47)
        if (entry.isFile() && entry.name.endsWith('.txt')) {
          const txtPath = path.join(this.transcriptsDir, entry.name);
          if (!this.filePositions.has(txtPath)) {
            this.log.appendLine(`[scan] New TXT transcript: ${entry.name}`);
            this.watchFile(txtPath, true);
          } else {
            this.readNewContent(txtPath, true);
          }
        }
      }
    } catch (e) {
      this.log.appendLine(`[scan] Error: ${e}`);
    }
  }

  private watchFile(filePath: string, isFlatTxt = false) {
    try {
      const fd = fs.openSync(filePath, 'r');
      const stat = fs.fstatSync(fd);
      fs.closeSync(fd);
      this.filePositions.set(filePath, Math.max(0, stat.size - 500));
      this.log.appendLine(`[watch] ${path.basename(filePath)} from pos ${this.filePositions.get(filePath)}`);

      const watcher = fs.watch(filePath, { persistent: false }, () => {
        this.readNewContent(filePath, isFlatTxt);
      });
      this.watchers.push(watcher);

      this.readNewContent(filePath, isFlatTxt);
    } catch (e) {
      this.log.appendLine(`[watch] Error: ${filePath} ${e}`);
    }
  }

  private readNewContent(filePath: string, isFlatTxt = false) {
    const prevPos = this.filePositions.get(filePath) ?? 0;

    let fd: number;
    try {
      fd = fs.openSync(filePath, 'r');
    } catch { return; }

    try {
      const stat = fs.fstatSync(fd);
      if (stat.size <= prevPos) {
        fs.closeSync(fd);
        return;
      }

      const bytesToRead = stat.size - prevPos;
      const buf = Buffer.alloc(bytesToRead);
      fs.readSync(fd, buf, 0, buf.length, prevPos);
      fs.closeSync(fd);
      this.filePositions.set(filePath, stat.size);

      this.log.appendLine(`[read] ${path.basename(filePath)} +${bytesToRead} bytes (${prevPos} → ${stat.size})`);

      const text = buf.toString('utf-8');

      if (isFlatTxt) {
        this.processStatus(parseFlatTxtChunk(text));
      } else {
        for (const line of text.split('\n').filter(l => l.trim())) {
          this.processStatus(parseTranscriptLine(line));
        }
      }
    } catch (e) {
      try { fs.closeSync(fd); } catch {}
      this.log.appendLine(`[read] Error: ${e}`);
    }
  }

  private processStatus(status: ParsedStatus | null) {
    if (!status) return;
    this.log.appendLine(`[activity] ${status.activity}: ${status.statusText}`);
    this.onStatusChange(status);
    if (status.activity !== 'idle') {
      this.resetIdleTimer();
    }
  }

  private resetIdleTimer() {
    if (this.idleTimer) clearTimeout(this.idleTimer);
    this.idleTimer = setTimeout(() => {
      this.onStatusChange({ activity: 'idle', statusText: null });
    }, 8000);
  }

  dispose() {
    for (const w of this.watchers) {
      try { w.close(); } catch {}
    }
    this.watchers = [];
    if (this.hooksWatcher) {
      try { this.hooksWatcher.close(); } catch {}
      this.hooksWatcher = null;
    }
    if (this.scanInterval) clearInterval(this.scanInterval);
    if (this.idleTimer) clearTimeout(this.idleTimer);
    this.filePositions.clear();
    this.log.dispose();
  }
}
