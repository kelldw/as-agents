import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs/promises";
import * as os from "os";
import { McpHub } from "../../../services/mcp/McpHub";
import { StateManager } from "../state/StateManager";
import { ExtensionMessage } from "../../../shared/ExtensionMessage";
import { fileExistsAtPath } from "../../../utils/fs";
import { openFile } from "../../../integrations/misc/open-file";

export class McpManager {
  private mcpHub?: McpHub;

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly stateManager: StateManager,
    private readonly postMessageToWebview: (message: ExtensionMessage) => Promise<void>,
    private readonly provider: any // Reference to ClineProvider for necessary callbacks
  ) {
    this.mcpHub = new McpHub(this.provider);
  }

  public dispose(): void {
    this.mcpHub?.dispose();
    this.mcpHub = undefined;
  }

  public getMcpHub(): McpHub | undefined {
    return this.mcpHub;
  }

  async ensureMcpServersDirectoryExists(): Promise<string> {
    const mcpServersDir = path.join(os.homedir(), "Documents", "Cline", "MCP");
    try {
      await fs.mkdir(mcpServersDir, { recursive: true });
    } catch (error) {
      // In case creating a directory in documents fails (e.g. permissions)
      // This is fine since this path is only ever used in the system prompt
      return "~/Documents/Cline/MCP";
    }
    return mcpServersDir;
  }

  async ensureSettingsDirectoryExists(): Promise<string> {
    const settingsDir = path.join(this.context.globalStorageUri.fsPath, "settings");
    await fs.mkdir(settingsDir, { recursive: true });
    return settingsDir;
  }

  async handleOpenMcpSettings(): Promise<void> {
    const mcpSettingsFilePath = await this.mcpHub?.getMcpSettingsFilePath();
    if (mcpSettingsFilePath) {
      openFile(mcpSettingsFilePath);
    }
  }

  async handleRestartMcpServer(serverName: string): Promise<void> {
    try {
      await this.mcpHub?.restartConnection(serverName);
    } catch (error) {
      console.error(`Failed to retry connection for ${serverName}:`, error);
    }
  }

  async handleToggleToolAlwaysAllow(
    serverName: string,
    toolName: string,
    alwaysAllow: boolean
  ): Promise<void> {
    try {
      await this.mcpHub?.toggleToolAlwaysAllow(serverName, toolName, alwaysAllow);
    } catch (error) {
      console.error(`Failed to toggle auto-approve for tool ${toolName}:`, error);
    }
  }

  async handleToggleMcpServer(serverName: string, disabled: boolean): Promise<void> {
    try {
      await this.mcpHub?.toggleServerDisabled(serverName, disabled);
    } catch (error) {
      console.error(`Failed to toggle MCP server ${serverName}:`, error);
    }
  }
}