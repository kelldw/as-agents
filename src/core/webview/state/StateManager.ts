import * as vscode from "vscode";
import { ExtensionState } from "../../../shared/ExtensionMessage";
import { ApiProvider, ModelInfo } from "../../../shared/api";
import { HistoryItem } from "../../../shared/HistoryItem";

type SecretKey =
  | "apiKey"
  | "openRouterApiKey"
  | "awsAccessKey"
  | "awsSecretKey"
  | "awsSessionToken"
  | "openAiApiKey"
  | "geminiApiKey"
  | "openAiNativeApiKey"
  | "deepSeekApiKey";

export type GlobalStateKey =
  | "apiProvider"
  | "apiModelId"
  | "awsRegion"
  | "awsUseCrossRegionInference"
  | "vertexProjectId"
  | "vertexRegion"
  | "openAiBaseUrl"
  | "openAiModelId"
  | "ollamaModelId"
  | "ollamaBaseUrl"
  | "lmStudioModelId"
  | "lmStudioBaseUrl"
  | "anthropicBaseUrl"
  | "azureApiVersion"
  | "includeStreamOptions"
  | "openRouterModelId"
  | "openRouterModelInfo"
  | "openRouterUseMiddleOutTransform"
  | "lastShownAnnouncementId"
  | "customInstructions"
  | "alwaysAllowReadOnly"
  | "alwaysAllowWrite"
  | "alwaysAllowExecute"
  | "alwaysAllowBrowser"
  | "alwaysAllowMcp"
  | "taskHistory"
  | "allowedCommands"
  | "soundEnabled"
  | "diffEnabled"
  | "soundVolume"
  | "browserViewportSize"
  | "fuzzyMatchThreshold"
  | "preferredLanguage"
  | "writeDelayMs"
  | "screenshotQuality"
  | "terminalOutputLineLimit"
  | "webSocketId";

export class StateManager {
  constructor(private readonly context: vscode.ExtensionContext) {}

  async updateGlobalState(key: GlobalStateKey, value: any) {
    await this.context.globalState.update(key, value);
  }

  async getGlobalState(key: GlobalStateKey) {
    return await this.context.globalState.get(key);
  }

  async storeSecret(key: SecretKey, value?: string) {
    if (value) {
      await this.context.secrets.store(key, value);
    } else {
      await this.context.secrets.delete(key);
    }
  }

  async getSecret(key: SecretKey) {
    return await this.context.secrets.get(key);
  }

  async getState(): Promise<ExtensionState> {
    const [
      storedApiProvider,
      apiModelId,
      apiKey,
      openRouterApiKey,
      awsAccessKey,
      awsSecretKey,
      awsSessionToken,
      awsRegion,
      awsUseCrossRegionInference,
      vertexProjectId,
      vertexRegion,
      openAiBaseUrl,
      openAiApiKey,
      openAiModelId,
      ollamaModelId,
      ollamaBaseUrl,
      lmStudioModelId,
      lmStudioBaseUrl,
      anthropicBaseUrl,
      geminiApiKey,
      openAiNativeApiKey,
      deepSeekApiKey,
      azureApiVersion,
      includeStreamOptions,
      openRouterModelId,
      openRouterModelInfo,
      openRouterUseMiddleOutTransform,
      lastShownAnnouncementId,
      customInstructions,
      alwaysAllowReadOnly,
      alwaysAllowWrite,
      alwaysAllowExecute,
      alwaysAllowBrowser,
      alwaysAllowMcp,
      taskHistory,
      allowedCommands,
      soundEnabled,
      diffEnabled,
      soundVolume,
      browserViewportSize,
      fuzzyMatchThreshold,
      preferredLanguage,
      writeDelayMs,
      screenshotQuality,
      terminalOutputLineLimit,
    ] = await Promise.all([
      this.getGlobalState("apiProvider") as Promise<ApiProvider | undefined>,
      this.getGlobalState("apiModelId") as Promise<string | undefined>,
      this.getSecret("apiKey") as Promise<string | undefined>,
      this.getSecret("openRouterApiKey") as Promise<string | undefined>,
      this.getSecret("awsAccessKey") as Promise<string | undefined>,
      this.getSecret("awsSecretKey") as Promise<string | undefined>,
      this.getSecret("awsSessionToken") as Promise<string | undefined>,
      this.getGlobalState("awsRegion") as Promise<string | undefined>,
      this.getGlobalState("awsUseCrossRegionInference") as Promise<boolean | undefined>,
      this.getGlobalState("vertexProjectId") as Promise<string | undefined>,
      this.getGlobalState("vertexRegion") as Promise<string | undefined>,
      this.getGlobalState("openAiBaseUrl") as Promise<string | undefined>,
      this.getSecret("openAiApiKey") as Promise<string | undefined>,
      this.getGlobalState("openAiModelId") as Promise<string | undefined>,
      this.getGlobalState("ollamaModelId") as Promise<string | undefined>,
      this.getGlobalState("ollamaBaseUrl") as Promise<string | undefined>,
      this.getGlobalState("lmStudioModelId") as Promise<string | undefined>,
      this.getGlobalState("lmStudioBaseUrl") as Promise<string | undefined>,
      this.getGlobalState("anthropicBaseUrl") as Promise<string | undefined>,
      this.getSecret("geminiApiKey") as Promise<string | undefined>,
      this.getSecret("openAiNativeApiKey") as Promise<string | undefined>,
      this.getSecret("deepSeekApiKey") as Promise<string | undefined>,
      this.getGlobalState("azureApiVersion") as Promise<string | undefined>,
      this.getGlobalState("includeStreamOptions") as Promise<boolean | undefined>,
      this.getGlobalState("openRouterModelId") as Promise<string | undefined>,
      this.getGlobalState("openRouterModelInfo") as Promise<ModelInfo | undefined>,
      this.getGlobalState("openRouterUseMiddleOutTransform") as Promise<boolean | undefined>,
      this.getGlobalState("lastShownAnnouncementId") as Promise<string | undefined>,
      this.getGlobalState("customInstructions") as Promise<string | undefined>,
      this.getGlobalState("alwaysAllowReadOnly") as Promise<boolean | undefined>,
      this.getGlobalState("alwaysAllowWrite") as Promise<boolean | undefined>,
      this.getGlobalState("alwaysAllowExecute") as Promise<boolean | undefined>,
      this.getGlobalState("alwaysAllowBrowser") as Promise<boolean | undefined>,
      this.getGlobalState("alwaysAllowMcp") as Promise<boolean | undefined>,
      this.getGlobalState("taskHistory") as Promise<HistoryItem[] | undefined>,
      this.getGlobalState("allowedCommands") as Promise<string[] | undefined>,
      this.getGlobalState("soundEnabled") as Promise<boolean | undefined>,
      this.getGlobalState("diffEnabled") as Promise<boolean | undefined>,
      this.getGlobalState("soundVolume") as Promise<number | undefined>,
      this.getGlobalState("browserViewportSize") as Promise<string | undefined>,
      this.getGlobalState("fuzzyMatchThreshold") as Promise<number | undefined>,
      this.getGlobalState("preferredLanguage") as Promise<string | undefined>,
      this.getGlobalState("writeDelayMs") as Promise<number | undefined>,
      this.getGlobalState("screenshotQuality") as Promise<number | undefined>,
      this.getGlobalState("terminalOutputLineLimit") as Promise<number | undefined>,
    ]);

    let apiProvider: ApiProvider;
    if (storedApiProvider) {
      apiProvider = storedApiProvider;
    } else {
      if (apiKey) {
        apiProvider = "anthropic";
      } else {
        apiProvider = "openrouter";
      }
    }

    const state: ExtensionState = {
      version: this.context.extension?.packageJSON?.version ?? "1.0.0",
      clineMessages: [],
      taskHistory: taskHistory || [],
      shouldShowAnnouncement: lastShownAnnouncementId !== "dec-10-2024",
      apiConfiguration: {
        apiProvider,
        apiModelId,
        apiKey,
        openRouterApiKey,
        awsAccessKey,
        awsSecretKey,
        awsSessionToken,
        awsRegion,
        awsUseCrossRegionInference,
        vertexProjectId,
        vertexRegion,
        openAiBaseUrl,
        openAiApiKey,
        openAiModelId,
        ollamaModelId,
        ollamaBaseUrl,
        lmStudioModelId,
        lmStudioBaseUrl,
        anthropicBaseUrl,
        geminiApiKey,
        openAiNativeApiKey,
        deepSeekApiKey,
        azureApiVersion,
        includeStreamOptions,
        openRouterModelId,
        openRouterModelInfo,
        openRouterUseMiddleOutTransform,
      },
      customInstructions,
      alwaysAllowReadOnly: alwaysAllowReadOnly ?? false,
      alwaysAllowWrite: alwaysAllowWrite ?? false,
      alwaysAllowExecute: alwaysAllowExecute ?? false,
      alwaysAllowBrowser: alwaysAllowBrowser ?? false,
      alwaysAllowMcp: alwaysAllowMcp ?? false,
      allowedCommands,
      soundEnabled: soundEnabled ?? false,
      diffEnabled: diffEnabled ?? true,
      soundVolume,
      browserViewportSize: browserViewportSize ?? "900x600",
      screenshotQuality: screenshotQuality ?? 75,
      fuzzyMatchThreshold: fuzzyMatchThreshold ?? 1.0,
      writeDelayMs: writeDelayMs ?? 1000,
      terminalOutputLineLimit: terminalOutputLineLimit ?? 500,
      preferredLanguage: preferredLanguage ?? this.getDefaultLanguage()
    };

    return state;
  }

  private getDefaultLanguage(): string {
    const vscodeLang = vscode.env.language;
    const langMap: { [key: string]: string } = {
      'en': 'English',
      'ar': 'Arabic',
      'pt-br': 'Brazilian Portuguese',
      'cs': 'Czech',
      'fr': 'French',
      'de': 'German',
      'hi': 'Hindi',
      'hu': 'Hungarian',
      'it': 'Italian',
      'ja': 'Japanese',
      'ko': 'Korean',
      'pl': 'Polish',
      'pt': 'Portuguese',
      'ru': 'Russian',
      'zh-cn': 'Simplified Chinese',
      'es': 'Spanish',
      'zh-tw': 'Traditional Chinese',
      'tr': 'Turkish'
    };
    return langMap[vscodeLang.split('-')[0]] ?? 'English';
  }

  async resetState() {
    for (const key of this.context.globalState.keys()) {
      await this.context.globalState.update(key, undefined);
    }
    
    const secretKeys: SecretKey[] = [
      "apiKey",
      "openRouterApiKey", 
      "awsAccessKey",
      "awsSecretKey",
      "awsSessionToken",
      "openAiApiKey",
      "geminiApiKey",
      "openAiNativeApiKey",
      "deepSeekApiKey",
    ];

    for (const key of secretKeys) {
      await this.storeSecret(key, undefined);
    }
  }
}