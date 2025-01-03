export interface WebSocketMessage {
  type:
    | "getWebSocketId"
    | "webSocketId"
    | "websocketMessage"
    | "websocketSendAck"
    | "newTask"
    | "action"
    | "state"
    | "webviewDidLaunch"
    | "apiConfiguration"
    | "customInstructions"
    | "alwaysAllowReadOnly"
    | "alwaysAllowWrite"
    | "alwaysAllowExecute"
    | "alwaysAllowBrowser"
    | "alwaysAllowMcp"
    | "askResponse"
    | "clearTask"
    | "didShowAnnouncement"
    | "selectImages"
    | "exportCurrentTask"
    | "showTaskWithId"
    | "deleteTaskWithId"
    | "exportTaskWithId"
    | "resetState"
    | "requestOllamaModels"
    | "requestLmStudioModels"
    | "refreshOpenRouterModels"
    | "refreshOpenAiModels"
    | "openImage"
    | "openFile"
    | "openMention"
    | "cancelTask"
    | "allowedCommands"
    | "openMcpSettings"
    | "restartMcpServer"
    | "toggleToolAlwaysAllow"
    | "toggleMcpServer"
    | "playSound"
    | "soundEnabled"
    | "soundVolume"
    | "diffEnabled"
    | "browserViewportSize"
    | "fuzzyMatchThreshold"
    | "preferredLanguage"
    | "writeDelayMs"
    | "terminalOutputLineLimit"
    | "deleteMessage"
    | "screenshotQuality"
    | "enhancePrompt"
  id?: string
  text?: string
  messageId?: string
  timestamp?: number
  status?: 'sent' | 'received' | 'error'
  bool?: boolean
  value?: number
  images?: string[]
  apiConfiguration?: any
  commands?: string[]
  serverName?: string
  toolName?: string
  alwaysAllow?: boolean
  disabled?: boolean
  audioType?: string
  values?: {
    baseUrl?: string
    apiKey?: string
  }
  askResponse?: string
}

export interface WebSocketAckMessage {
  type: "websocketSendAck"
  messageId: string
  timestamp: number
  status: 'received'
}