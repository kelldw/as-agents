export interface WebSocketMessage {
  type: "getWebSocketId" | "webSocketId" | "websocketMessage" | "websocketSendAck"
  id?: string
  text?: string
  messageId?: string
}