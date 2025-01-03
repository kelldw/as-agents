import * as vscode from "vscode";
import { ExtensionMessage } from "../../../shared/ExtensionMessage";
import { WebSocketMessage } from "../../../shared/WebSocketMessage";

export class WebSocketManager {
  private webSocketId?: string;

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly postMessageToWebview: (message: ExtensionMessage) => Promise<void>
  ) {
    this.initializeWebSocketId();
  }

  private async initializeWebSocketId() {
    this.webSocketId = `cline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    await this.postMessageToWebview({
      type: "webSocketId",
      text: this.webSocketId
    });
  }

  public async handleWebSocketMessage(message: WebSocketMessage): Promise<void> {
    try {
      switch (message.type) {
        case "getWebSocketId":
          if (!this.webSocketId) {
            await this.initializeWebSocketId();
          }
          await this.postMessageToWebview({
            type: "webSocketId",
            text: this.webSocketId
          });
          break;

        case "websocketMessage":
          if (message.messageId) {
            const ackMessage: ExtensionMessage = {
              type: "websocketSendAck",
              text: message.messageId,
              timestamp: Date.now()
            };
            await this.postMessageToWebview(ackMessage);
          }
          break;

        case "websocketSendAck":
          if (message.messageId) {
            console.log(`Message ${message.messageId} acknowledged`);
          }
          break;

        case "webSocketId":
          // Just acknowledge receipt
          break;

        default:
          console.warn(`Unknown WebSocket message type: ${message.type}`);
      }
    } catch (error) {
      console.error("Error handling WebSocket message:", error);
      if (message.messageId) {
        const errorMessage: ExtensionMessage = {
          type: "websocketSendAck",
          text: message.messageId,
          timestamp: Date.now()
        };
        await this.postMessageToWebview(errorMessage);
      }
      vscode.window.showErrorMessage(`WebSocket error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  public getWebSocketId(): string | undefined {
    return this.webSocketId;
  }
}