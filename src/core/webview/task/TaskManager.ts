import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs/promises";
import { Cline } from "../../Cline";
import { HistoryItem } from "../../../shared/HistoryItem";
import { ExtensionMessage } from "../../../shared/ExtensionMessage";
import { fileExistsAtPath } from "../../../utils/fs";
import { buildApiHandler } from "../../../api";
import { StateManager } from "../state/StateManager";
import { downloadTask } from "../../../integrations/misc/export-markdown";

export const GlobalFileNames = {
  apiConversationHistory: "api_conversation_history.json",
  uiMessages: "ui_messages.json",
};

export class TaskManager {
  private cline?: Cline;

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly stateManager: StateManager,
    private readonly postMessageToWebview: (message: ExtensionMessage) => Promise<void>,
    private readonly provider: any // Reference to ClineProvider for necessary callbacks
  ) {}

  async initClineWithTask(task?: string, images?: string[]) {
    await this.clearTask();
    const state = await this.stateManager.getState();
    if (!state.apiConfiguration) {
      throw new Error("API configuration is required");
    }
    
    this.cline = new Cline(
      this.provider,
      state.apiConfiguration,
      state.customInstructions,
      state.diffEnabled ?? true,
      state.fuzzyMatchThreshold ?? 1.0,
      task,
      images
    );
  }

  async initClineWithHistoryItem(historyItem: HistoryItem) {
    await this.clearTask();
    const state = await this.stateManager.getState();
    if (!state.apiConfiguration) {
      throw new Error("API configuration is required");
    }
    
    this.cline = new Cline(
      this.provider,
      state.apiConfiguration,
      state.customInstructions,
      state.diffEnabled ?? true,
      state.fuzzyMatchThreshold ?? 1.0,
      undefined,
      undefined,
      historyItem
    );
  }

  async clearTask() {
    this.cline?.abortTask();
    this.cline = undefined; // removes reference to it, so once promises end it will be garbage collected
  }

  async getTaskWithId(id: string): Promise<{
    historyItem: HistoryItem;
    taskDirPath: string;
    apiConversationHistoryFilePath: string;
    uiMessagesFilePath: string;
    apiConversationHistory: any[];
  }> {
    const history = await this.stateManager.getGlobalState("taskHistory") as HistoryItem[] || [];
    const historyItem = history.find((item) => item.id === id);
    if (historyItem) {
      const taskDirPath = path.join(this.context.globalStorageUri.fsPath, "tasks", id);
      const apiConversationHistoryFilePath = path.join(taskDirPath, GlobalFileNames.apiConversationHistory);
      const uiMessagesFilePath = path.join(taskDirPath, GlobalFileNames.uiMessages);
      const fileExists = await fileExistsAtPath(apiConversationHistoryFilePath);
      if (fileExists) {
        const apiConversationHistory = JSON.parse(await fs.readFile(apiConversationHistoryFilePath, "utf8"));
        return {
          historyItem,
          taskDirPath,
          apiConversationHistoryFilePath,
          uiMessagesFilePath,
          apiConversationHistory,
        };
      }
    }
    await this.deleteTaskFromState(id);
    throw new Error("Task not found");
  }

  async showTaskWithId(id: string) {
    if (id !== this.cline?.taskId) {
      const { historyItem } = await this.getTaskWithId(id);
      await this.initClineWithHistoryItem(historyItem);
    }
    await this.postMessageToWebview({ type: "action", action: "chatButtonClicked" });
  }

  async exportTaskWithId(id: string) {
    const { historyItem, apiConversationHistory } = await this.getTaskWithId(id);
    await downloadTask(historyItem.ts, apiConversationHistory);
  }

  async deleteTaskWithId(id: string) {
    if (id === this.cline?.taskId) {
      await this.clearTask();
    }

    const { taskDirPath, apiConversationHistoryFilePath, uiMessagesFilePath } = await this.getTaskWithId(id);
    await this.deleteTaskFromState(id);

    const apiConversationHistoryFileExists = await fileExistsAtPath(apiConversationHistoryFilePath);
    if (apiConversationHistoryFileExists) {
      await fs.unlink(apiConversationHistoryFilePath);
    }
    const uiMessagesFileExists = await fileExistsAtPath(uiMessagesFilePath);
    if (uiMessagesFileExists) {
      await fs.unlink(uiMessagesFilePath);
    }
    const legacyMessagesFilePath = path.join(taskDirPath, "claude_messages.json");
    if (await fileExistsAtPath(legacyMessagesFilePath)) {
      await fs.unlink(legacyMessagesFilePath);
    }
    await fs.rmdir(taskDirPath); // succeeds if the dir is empty
  }

  async deleteTaskFromState(id: string) {
    const taskHistory = await this.stateManager.getGlobalState("taskHistory") as HistoryItem[] || [];
    const updatedTaskHistory = taskHistory.filter((task) => task.id !== id);
    await this.stateManager.updateGlobalState("taskHistory", updatedTaskHistory);
    await this.postMessageToWebview({ type: "state", state: await this.stateManager.getState() });
  }

  async updateTaskHistory(item: HistoryItem): Promise<HistoryItem[]> {
    const history = await this.stateManager.getGlobalState("taskHistory") as HistoryItem[] || [];
    const existingItemIndex = history.findIndex((h) => h.id === item.id);
    if (existingItemIndex !== -1) {
      history[existingItemIndex] = item;
    } else {
      history.push(item);
    }
    await this.stateManager.updateGlobalState("taskHistory", history);
    return history;
  }

  getCline(): Cline | undefined {
    return this.cline;
  }

  setCline(cline: Cline | undefined) {
    this.cline = cline;
  }
}