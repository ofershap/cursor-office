import * as vscode from 'vscode';
import { CursorOfficePanelProvider } from './panelProvider';
import { registerHooksCommands } from './hooksInstaller';

export function activate(context: vscode.ExtensionContext) {
  const statusBar = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    -100
  );
  statusBar.text = '$(briefcase) Cursor Office';
  statusBar.tooltip = 'Open Cursor Office';
  statusBar.command = 'cursorOffice.show';
  statusBar.show();
  context.subscriptions.push(statusBar);

  const provider = new CursorOfficePanelProvider(context.extensionUri, statusBar);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      CursorOfficePanelProvider.viewType,
      provider,
      { webviewOptions: { retainContextWhenHidden: true } }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('cursorOffice.show', () => {
      vscode.commands.executeCommand('cursorOffice.panel.focus');
    })
  );

  registerHooksCommands(context);
}

export function deactivate() {}
