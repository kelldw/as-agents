import { vscode } from "../../utils/vscode"
import { WebviewMessage } from "../../../../src/shared/WebviewMessage"

interface WSServerMessage {
  type: 'message' | 'ack' | 'announce'
  id?: string
  text?: string
  messageId?: string
}

export class WebSocketService {
  private ws: WebSocket | null = null
  private uniqueId: string | undefined = undefined

  constructor() {
    // Get uniqueId from environment variables via vscode extension
    vscode.postMessage({ 
      type: "getWebSocketId"
    } as WebviewMessage)

    window.addEventListener('message', (event) => {
      const message = event.data as WebviewMessage
      if (message.type === 'webSocketId') {
        this.uniqueId = message.text
        this.connect()
      }
    })
  }

  private connect() {
    if (!this.uniqueId) {
      console.error('No uniqueId available for WebSocket connection')
      return
    }

    // Connect to WebSocket server
    this.ws = new WebSocket('ws://localhost:8080')

    this.ws.onopen = () => {
      console.log('WebSocket Connected')
      // Announce presence with uniqueId
      this.sendMessage({
        type: 'announce',
        id: this.uniqueId
      })
    }

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as WSServerMessage
        if (data.type === 'message') {
          // Handle incoming message by sending to ChatView via vscode.postMessage
          vscode.postMessage({
            type: "websocketMessage",
            text: data.text
          } as WebviewMessage)
          
          // Send acknowledgment
          this.sendMessage({
            type: 'ack',
            messageId: data.messageId
          })
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error)
      }
    }

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error)
    }

    this.ws.onclose = () => {
      console.log('WebSocket connection closed')
      // Attempt to reconnect after a delay
      setTimeout(() => this.connect(), 5000)
    }
  }

  private sendMessage(data: WSServerMessage) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data))
    }
  }

  public handleMessageSent(text: string) {
    // Send acknowledgment to WebSocket server when a message is sent
    vscode.postMessage({
      type: "websocketSendAck",
      text
    } as WebviewMessage)

    this.sendMessage({
      type: 'ack',
      text
    })
  }
}

export const webSocketService = new WebSocketService()