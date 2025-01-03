import * as vscode from "vscode";
import { WebSocketMessage } from "../../shared/WebSocketMessage";
import { ExtensionMessage } from "../../shared/ExtensionMessage";
import { StateManager, GlobalStateKey } from "./state/StateManager";
import { WebSocketManager } from "./websocket/WebSocketManager";
import { TaskManager } from "./task/TaskManager";
import { WebViewManager } from "./webview/WebViewManager";
import { ApiManager } from "./api/ApiManager";
import { McpManager } from "./mcp/McpManager";
import { playSound } from "../../utils/sound";
import { enhancePrompt } from "../../utils/enhance-prompt";
import { selectImages } from "../../integrations/misc/process-images";
import { openFile, openImage } from "../../integrations/misc/open-file";
import { openMention } from "../mentions";
import * as path from "path";
import { HistoryItem } from "../../shared/HistoryItem";

export const GlobalFileNames = {
  apiConversationHistory: "api_conversation_history.json",
  uiMessages: "ui_messages.json",
  mcpSettings: "cline_mcp_settings.json"
};

export class ClineProvider implements vscode.WebviewViewProvider {
  public static readonly sideBarId = "roo-cline.SidebarProvider";
  public static readonly tabPanelId = "roo-cline.TabPanelProvider";
  private static readonly activeInstances = new Set<ClineProvider>();

  public readonly context: vscode.ExtensionContext;
  public readonly stateManager: StateManager;
  public readonly webSocketManager: WebSocketManager;
  public readonly taskManager: TaskManager;
  public readonly webViewManager: WebViewManager;
  public readonly apiManager: ApiManager;
  public readonly mcpManager: McpManager;
  public readonly mcpHub;

  constructor(
    context: vscode.ExtensionContext,
    private readonly outputChannel: vscode.OutputChannel
  ) {
    this.context = context;
    this.outputChannel.appendLine("ClineProvider instantiated");

    // Initialize managers
    this.stateManager = new StateManager(this.context);
    this.webSocketManager = new WebSocketManager(this.context, this.postMessageToWebview.bind(this));
    this.taskManager = new TaskManager(this.context, this.stateManager, this.postMessageToWebview.bind(this), this);
    this.webViewManager = new WebViewManager(this.context, this.postMessageToWebview.bind(this));
    this.apiManager = new ApiManager(this.context, this.stateManager, this.postMessageToWebview.bind(this));
    this.mcpManager = new McpManager(this.context, this.stateManager, this.postMessageToWebview.bind(this), this);
    this.mcpHub = this.mcpManager.getMcpHub();

    ClineProvider.activeInstances.add(this);
  }

  public dispose(): void {
    this.webViewManager.dispose();
    this.mcpManager.dispose();
    ClineProvider.activeInstances.delete(this);
  }

  public static getVisibleInstance(): ClineProvider | undefined {
    return Array.from(ClineProvider.activeInstances).find(
      instance => instance.webViewManager.isVisible()
    );
  }

  public async resolveWebviewView(
    webviewView: vscode.WebviewView | vscode.WebviewPanel,
    _context?: vscode.WebviewViewResolveContext,
    _token?: vscode.CancellationToken
  ): Promise<void> {
    this.outputChannel.appendLine("Resolving webview view");
    await this.webViewManager.resolveWebviewView(webviewView);
    this.setWebviewMessageListener(webviewView.webview);
  }

  public async postMessageToWebview(message: ExtensionMessage): Promise<void> {
    const view = this.webViewManager.getView();
    if (view?.webview) {
      await view.webview.postMessage(message);
    }
  }

  public async postStateToWebview(): Promise<void> {
    await this.postMessageToWebview({
      type: "state",
      state: await this.stateManager.getState()
    });
  }

  public async handleOpenRouterCallback(code: string): Promise<void> {
    await this.apiManager.handleOpenRouterCallback(code, this.taskManager.getCline());
  }

  public async getState() {
    return this.stateManager.getState();
  }

  public async getGlobalState(key: GlobalStateKey) {
    return this.stateManager.getGlobalState(key);
  }

  public async updateCustomInstructions(value: string) {
    await this.stateManager.updateGlobalState("customInstructions", value);
    await this.postStateToWebview();
  }

  public async clearTask() {
    await this.taskManager.clearTask();
  }

  public async getTaskWithId(id: string) {
    return this.taskManager.getTaskWithId(id);
  }

  public async initClineWithHistoryItem(historyItem: HistoryItem) {
    await this.taskManager.initClineWithHistoryItem(historyItem);
  }

  public async updateTaskHistory(item: HistoryItem) {
    return this.taskManager.updateTaskHistory(item);
  }

  public async ensureMcpServersDirectoryExists() {
    return this.mcpManager.ensureMcpServersDirectoryExists();
  }

  public async ensureSettingsDirectoryExists() {
    return this.mcpManager.ensureSettingsDirectoryExists();
  }

  private setWebviewMessageListener(webview: vscode.Webview): void {
    webview.onDidReceiveMessage(async (message: WebSocketMessage) => {
      try {
        switch (message.type) {
          // WebSocket related messages
          case "getWebSocketId":
          case "websocketMessage":
          case "websocketSendAck":
          case "webSocketId":
            await this.webSocketManager.handleWebSocketMessage(message);
            break;

          // Task related messages
          case "newTask":
            await this.taskManager.initClineWithTask(message.text, message.images);
            break;

          case "clearTask":
            await this.taskManager.clearTask();
            await this.postStateToWebview();
            break;

          case "cancelTask":
            if (this.taskManager.getCline()) {
              const { historyItem } = await this.taskManager.getTaskWithId(this.taskManager.getCline()!.taskId);
              this.taskManager.getCline()!.abortTask();
              await this.taskManager.initClineWithHistoryItem(historyItem);
            }
            break;

          // API related messages
          case "apiConfiguration":
            if (message.apiConfiguration) {
              await this.apiManager.updateApiConfiguration(message.apiConfiguration, this.taskManager.getCline());
            }
            break;

          case "requestOllamaModels":
            const ollamaModels = await this.apiManager.getOllamaModels(message.text);
            await this.postMessageToWebview({ type: "ollamaModels", ollamaModels });
            break;

          case "requestLmStudioModels":
            const lmStudioModels = await this.apiManager.getLmStudioModels(message.text);
            await this.postMessageToWebview({ type: "lmStudioModels", lmStudioModels });
            break;

          case "refreshOpenAiModels":
            if (message?.values?.baseUrl && message?.values?.apiKey) {
              const openAiModels = await this.apiManager.getOpenAiModels(
                message.values.baseUrl,
                message.values.apiKey
              );
              await this.postMessageToWebview({ type: "openAiModels", openAiModels });
            }
            break;

          // MCP related messages
          case "openMcpSettings":
            await this.mcpManager.handleOpenMcpSettings();
            break;

          case "restartMcpServer":
            await this.mcpManager.handleRestartMcpServer(message.text!);
            break;

          case "toggleToolAlwaysAllow":
            await this.mcpManager.handleToggleToolAlwaysAllow(
              message.serverName!,
              message.toolName!,
              message.alwaysAllow!
            );
            break;

          case "toggleMcpServer":
            await this.mcpManager.handleToggleMcpServer(message.serverName!, message.disabled!);
            break;

          // UI related messages
          case "selectImages":
            const images = await selectImages();
            await this.postMessageToWebview({ type: "selectedImages", images });
            break;

          case "openImage":
            openImage(message.text!);
            break;

          case "openFile":
            openFile(message.text!);
            break;

          case "openMention":
            openMention(message.text);
            break;

          case "playSound":
            if (message.audioType) {
              const soundPath = path.join(this.context.extensionPath, "audio", `${message.audioType}.wav`);
              playSound(soundPath);
            }
            break;

          case "enhancePrompt":
            if (message.text) {
              try {
                const { apiConfiguration } = await this.stateManager.getState();
                const enhanceConfig = {
                  ...apiConfiguration,
                  apiProvider: "openrouter" as const,
                  openRouterModelId: "gpt-4o",
                };
                const enhancedPrompt = await enhancePrompt(enhanceConfig, message.text);
                await this.postMessageToWebview({
                  type: "enhancedPrompt",
                  text: enhancedPrompt
                });
              } catch (error) {
                console.error("Error enhancing prompt:", error);
                vscode.window.showErrorMessage("Failed to enhance prompt");
              }
            }
            break;

          // State related messages
          case "webviewDidLaunch":
            await this.postStateToWebview();
            break;

          default:
            console.warn(`Unknown message type: ${message.type}`);
        }
      } catch (error) {
        console.error('Error handling message:', error);
        vscode.window.showErrorMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });
  }
}
