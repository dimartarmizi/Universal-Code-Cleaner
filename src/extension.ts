import * as vscode from 'vscode';
import { removeCurrentFile, removeWorkspace } from './commands/removeWorkspace';

export function activate(context: vscode.ExtensionContext) {
  const disposableRemoveCurrent = vscode.commands.registerCommand(
    'commentRemover.removeCurrentFile',
    async () => {
      await removeCurrentFile();
    }
  );

  const disposableRemoveWorkspace = vscode.commands.registerCommand(
    'commentRemover.removeWorkspace',
    async () => {
      await removeWorkspace();
    }
  );

  context.subscriptions.push(
    disposableRemoveCurrent,
    disposableRemoveWorkspace
  );
}

export function deactivate() {}
