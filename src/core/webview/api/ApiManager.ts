import * as vscode from "vscode";
import axios from "axios";
import { ApiProvider, ModelInfo } from "../../../shared/api";
import { StateManager } from "../state/StateManager";
import { ExtensionMessage } from "../../../shared/ExtensionMessage";
import { buildApiHandler } from "../../../api";
import { Cline } from "../../Cline";

export class ApiManager {
  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly stateManager: StateManager,
    private readonly postMessageToWebview: (message: ExtensionMessage) => Promise<void>
  ) {}

  async getOllamaModels(baseUrl?: string): Promise<string[]> {
    try {
      if (!baseUrl) {
        baseUrl = "http://localhost:11434";
      }
      if (!URL.canParse(baseUrl)) {
        return [];
      }
      const response = await axios.get(`${baseUrl}/api/tags`);
      const modelsArray = response.data?.models?.map((model: any) => model.name) || [];
      return [...new Set<string>(modelsArray)];
    } catch (error) {
      return [];
    }
  }

  async getLmStudioModels(baseUrl?: string): Promise<string[]> {
    try {
      if (!baseUrl) {
        baseUrl = "http://localhost:1234";
      }
      if (!URL.canParse(baseUrl)) {
        return [];
      }
      const response = await axios.get(`${baseUrl}/v1/models`);
      const modelsArray = response.data?.data?.map((model: any) => model.id) || [];
      return [...new Set<string>(modelsArray)];
    } catch (error) {
      return [];
    }
  }

  async getOpenAiModels(baseUrl?: string, apiKey?: string): Promise<string[]> {
    try {
      if (!baseUrl || !URL.canParse(baseUrl)) {
        return [];
      }

      const config: Record<string, any> = {};
      if (apiKey) {
        config["headers"] = { Authorization: `Bearer ${apiKey}` };
      }

      const response = await axios.get(`${baseUrl}/models`, config);
      const modelsArray = response.data?.data?.map((model: any) => model.id) || [];
      return [...new Set<string>(modelsArray)];
    } catch (error) {
      return [];
    }
  }

  async handleOpenRouterCallback(code: string, cline?: Cline): Promise<void> {
    let apiKey: string;
    try {
      const response = await axios.post("https://openrouter.ai/api/v1/auth/keys", { code });
      if (response.data && response.data.key) {
        apiKey = response.data.key;
      } else {
        throw new Error("Invalid response from OpenRouter API");
      }
    } catch (error) {
      console.error("Error exchanging code for API key:", error);
      throw error;
    }

    const openrouter: ApiProvider = "openrouter";
    await this.stateManager.updateGlobalState("apiProvider", openrouter);
    await this.stateManager.storeSecret("openRouterApiKey", apiKey);
    await this.postMessageToWebview({ type: "state", state: await this.stateManager.getState() });
    
    if (cline) {
      cline.api = buildApiHandler({ apiProvider: openrouter, openRouterApiKey: apiKey });
    }
  }

  async updateApiConfiguration(config: any, cline?: Cline): Promise<void> {
    const {
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
    } = config;

    await this.stateManager.updateGlobalState("apiProvider", apiProvider);
    await this.stateManager.updateGlobalState("apiModelId", apiModelId);
    await this.stateManager.storeSecret("apiKey", apiKey);
    await this.stateManager.storeSecret("openRouterApiKey", openRouterApiKey);
    await this.stateManager.storeSecret("awsAccessKey", awsAccessKey);
    await this.stateManager.storeSecret("awsSecretKey", awsSecretKey);
    await this.stateManager.storeSecret("awsSessionToken", awsSessionToken);
    await this.stateManager.updateGlobalState("awsRegion", awsRegion);
    await this.stateManager.updateGlobalState("awsUseCrossRegionInference", awsUseCrossRegionInference);
    await this.stateManager.updateGlobalState("vertexProjectId", vertexProjectId);
    await this.stateManager.updateGlobalState("vertexRegion", vertexRegion);
    await this.stateManager.updateGlobalState("openAiBaseUrl", openAiBaseUrl);
    await this.stateManager.storeSecret("openAiApiKey", openAiApiKey);
    await this.stateManager.updateGlobalState("openAiModelId", openAiModelId);
    await this.stateManager.updateGlobalState("ollamaModelId", ollamaModelId);
    await this.stateManager.updateGlobalState("ollamaBaseUrl", ollamaBaseUrl);
    await this.stateManager.updateGlobalState("lmStudioModelId", lmStudioModelId);
    await this.stateManager.updateGlobalState("lmStudioBaseUrl", lmStudioBaseUrl);
    await this.stateManager.updateGlobalState("anthropicBaseUrl", anthropicBaseUrl);
    await this.stateManager.storeSecret("geminiApiKey", geminiApiKey);
    await this.stateManager.storeSecret("openAiNativeApiKey", openAiNativeApiKey);
    await this.stateManager.storeSecret("deepSeekApiKey", deepSeekApiKey);
    await this.stateManager.updateGlobalState("azureApiVersion", azureApiVersion);
    await this.stateManager.updateGlobalState("includeStreamOptions", includeStreamOptions);
    await this.stateManager.updateGlobalState("openRouterModelId", openRouterModelId);
    await this.stateManager.updateGlobalState("openRouterModelInfo", openRouterModelInfo);
    await this.stateManager.updateGlobalState("openRouterUseMiddleOutTransform", openRouterUseMiddleOutTransform);

    if (cline) {
      cline.api = buildApiHandler(config);
    }

    await this.postMessageToWebview({ type: "state", state: await this.stateManager.getState() });
  }
}