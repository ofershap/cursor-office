import * as vscode from 'vscode';
import { CursorWatcher } from './cursorWatcher';
import { ParsedStatus } from './transcriptParser';

export class CursorOfficePanelProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'cursorOffice.panel';

  private view?: vscode.WebviewView;
  private watcher?: CursorWatcher;

  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly statusBar: vscode.StatusBarItem,
  ) {}

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this.view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.extensionUri],
    };

    webviewView.webview.html = this.getHtml(webviewView.webview);

    console.log('[Cursor Office] Webview resolved, starting watcher');

    this.watcher = new CursorWatcher((status: ParsedStatus) => {
      this.sendStatus(status);
    });
    this.watcher.start();

    webviewView.webview.onDidReceiveMessage((msg) => {
      if (msg.type === 'webviewReady') {
        console.log('[Cursor Office] Webview ready signal received');
      }
    });

    webviewView.onDidDispose(() => {
      console.log('[Cursor Office] Webview disposed');
      this.watcher?.dispose();
      this.watcher = undefined;
    });
  }

  private sendStatus(status: ParsedStatus) {
    if (!this.view) return;
    this.view.webview.postMessage({
      type: 'agentStatus',
      activity: status.activity,
      statusText: status.statusText,
    });

    const working = status.activity === 'typing' || status.activity === 'editing'
      || status.activity === 'running' || status.activity === 'reading'
      || status.activity === 'searching' || status.activity === 'phoning';

    if (working) {
      this.statusBar.text = '$(briefcase) Working...';
      this.statusBar.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
    } else if (status.activity === 'celebrating') {
      this.statusBar.text = '$(briefcase) Done!';
      this.statusBar.backgroundColor = new vscode.ThemeColor('statusBarItem.prominentBackground');
    } else {
      this.statusBar.text = '$(briefcase) Cursor Office';
      this.statusBar.backgroundColor = undefined;
    }
  }

  private getHtml(webview: vscode.Webview): string {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, 'dist', 'webview.js')
    );

    const nonce = getNonce();

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'nonce-${nonce}'; style-src 'unsafe-inline';">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      width: 100%;
      height: 100%;
      background: #1a1a2e;
      display: flex;
      justify-content: center;
      align-items: center;
      overflow: hidden;
    }
    #officeCanvas {
      image-rendering: pixelated;
      image-rendering: crisp-edges;
      display: block;
    }
  </style>
</head>
<body>
  <canvas id="officeCanvas"></canvas>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }

  dispose() {
    this.watcher?.dispose();
  }
}

function getNonce(): string {
  let text = '';
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return text;
}
