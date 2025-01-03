import * as vscode from "vscode";
import { ExtensionMessage } from "../../../shared/ExtensionMessage";
import { getNonce } from "../getNonce";
import { getUri } from "../getUri";
import { getTheme } from "../../../integrations/theme/getTheme";

export class WebViewManager {
  private view?: vscode.WebviewView | vscode.WebviewPanel;
  private readonly disposables: vscode.Disposable[] = [];

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly postMessageToWebview: (message: ExtensionMessage) => Promise<void>
  ) {}

  public getView(): vscode.WebviewView | vscode.WebviewPanel | undefined {
    return this.view;
  }

  public isVisible(): boolean {
    return this.view?.visible ?? false;
  }

  public dispose(): void {
    if (this.view && "dispose" in this.view) {
      this.view.dispose();
    }
    while (this.disposables.length) {
      const disposable = this.disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }

  public async resolveWebviewView(
    webviewView: vscode.WebviewView | vscode.WebviewPanel,
    _context?: vscode.WebviewViewResolveContext,
    _token?: vscode.CancellationToken
  ): Promise<void> {
    this.view = webviewView;

    const webview = webviewView.webview;
    webview.options = {
      enableScripts: true,
      localResourceRoots: [this.context.extensionUri],
    };

    webview.html = this.getHtmlContent(webview);

    // Handle visibility changes based on view type
    if (this.isWebviewPanel(webviewView)) {
      webviewView.onDidChangeViewState(
        () => this.handleVisibilityChange(),
        null,
        this.disposables
      );
    } else if (this.isWebviewView(webviewView)) {
      webviewView.onDidChangeVisibility(
        () => this.handleVisibilityChange(),
        null,
        this.disposables
      );
    }

    // Handle disposal
    webviewView.onDidDispose(
      () => {
        this.dispose();
      },
      null,
      this.disposables
    );

    // Handle theme changes
    vscode.workspace.onDidChangeConfiguration(
      async (e) => {
        if (e && e.affectsConfiguration("workbench.colorTheme")) {
          await this.postMessageToWebview({
            type: "theme",
            text: JSON.stringify(await getTheme())
          });
        }
      },
      null,
      this.disposables
    );
  }

  private isWebviewPanel(view: vscode.WebviewView | vscode.WebviewPanel): view is vscode.WebviewPanel {
    return 'onDidChangeViewState' in view;
  }

  private isWebviewView(view: vscode.WebviewView | vscode.WebviewPanel): view is vscode.WebviewView {
    return 'onDidChangeVisibility' in view;
  }

  private async handleVisibilityChange(): Promise<void> {
    if (this.view?.visible) {
      await this.postMessageToWebview({ type: "action", action: "didBecomeVisible" });
    }
  }

  private getHtmlContent(webview: vscode.Webview): string {
    const stylesUri = getUri(webview, this.context.extensionUri, [
      "webview-ui",
      "build",
      "static",
      "css",
      "main.css",
    ]);

    const scriptUri = getUri(webview, this.context.extensionUri, [
      "webview-ui",
      "build",
      "static",
      "js",
      "main.js"
    ]);

    const codiconsUri = getUri(webview, this.context.extensionUri, [
      "node_modules",
      "@vscode",
      "codicons",
      "dist",
      "codicon.css",
    ]);

    const nonce = getNonce();

    return /*html*/ `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width,initial-scale=1,shrink-to-fit=no">
          <meta name="theme-color" content="#000000">
          <meta http-equiv="Content-Security-Policy" content="default-src 'none'; font-src ${webview.cspSource}; style-src ${webview.cspSource} 'unsafe-inline'; img-src ${webview.cspSource} data:; script-src 'nonce-${nonce}';">
          <link rel="stylesheet" type="text/css" href="${stylesUri}">
          <link href="${codiconsUri}" rel="stylesheet" />
          <title>Cline</title>
        </head>
        <body>
          <noscript>You need to enable JavaScript to run this app.</noscript>
          <div id="root"></div>
          <script nonce="${nonce}" src="${scriptUri}"></script>
        </body>
      </html>
    `;
  }
}