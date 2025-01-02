import { WebSocket, WebSocketServer as WSServer } from 'ws';

interface Client {
  id: string;
  ws: WebSocket;
  isDispatcher: boolean;
}

interface Message {
  type: 'announce' | 'message' | 'ack' | 'client_list';
  id?: string;
  text?: string;
  messageId?: string;
  clients?: string[];
}

interface ConnectedClient {
  id: string;
  isDispatcher: boolean;
}

export class WebSocketServer {
  private wss: WSServer;
  private clients: Map<string, Client> = new Map();

  constructor() {
    this.wss = new WSServer({ port: 8080 });
    this.setupServer();
    console.log('WebSocket Server running on ws://localhost:8080');
  }

  private setupServer() {
    this.wss.on('connection', (ws: WebSocket) => {
      console.log('New client connected');

      ws.on('message', (data: Buffer) => {
        try {
          const message: Message = JSON.parse(data.toString());
          this.handleMessage(ws, message);
        } catch (error: unknown) {
          console.error('Error parsing message:', error);
        }
      });

      ws.on('close', () => {
        // Remove client on disconnect
        for (const [id, client] of this.clients.entries()) {
          if (client.ws === ws) {
            this.clients.delete(id);
            console.log(`Client ${id} disconnected`);
            this.broadcastClientList();
            break;
          }
        }
      });

      ws.on('error', (error: Error) => {
        console.error('WebSocket error:', error);
      });
    });
  }

  private handleMessage(ws: WebSocket, message: Message) {
    switch (message.type) {
      case 'announce':
        if (message.id) {
          const isDispatcher = message.id.startsWith('dispatcher-');
          this.clients.set(message.id, { 
            id: message.id, 
            ws,
            isDispatcher 
          });
          console.log(`Client ${message.id} registered (${isDispatcher ? 'Dispatcher' : 'VSCode'})`);
          this.broadcastClientList();
        }
        break;

      case 'message':
        // Generate unique message ID
        const messageId = Date.now().toString();
        const broadcastMessage = {
          type: 'message',
          text: message.text,
          messageId
        };

        // Find sender
        let senderId: string | undefined;
        for (const [id, client] of this.clients.entries()) {
          if (client.ws === ws) {
            senderId = id;
            break;
          }
        }

        // If message is from dispatcher, send to VSCode clients
        // If message is from VSCode client, send to dispatchers
        this.clients.forEach((client) => {
          const isFromDispatcher = senderId?.startsWith('dispatcher-');
          if (client.ws.readyState === WebSocket.OPEN) {
            if (isFromDispatcher && !client.isDispatcher) {
              // Send dispatcher message to VSCode clients
              client.ws.send(JSON.stringify(broadcastMessage));
            } else if (!isFromDispatcher && client.isDispatcher) {
              // Send VSCode client message to dispatchers
              client.ws.send(JSON.stringify(broadcastMessage));
            }
          }
        });
        break;

      case 'ack':
        // Handle message acknowledgment
        if (message.messageId) {
          console.log(`Message ${message.messageId} acknowledged`);
        }
        break;
    }
  }

  private broadcastClientList() {
    // Create list of connected clients
    const clientList: ConnectedClient[] = Array.from(this.clients.values()).map(client => ({
      id: client.id,
      isDispatcher: client.isDispatcher
    }));

    // Send to all dispatchers
    this.clients.forEach((client) => {
      if (client.isDispatcher && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify({
          type: 'client_list',
          clients: clientList
        }));
      }
    });
  }

  public stop() {
    this.wss.close(() => {
      console.log('WebSocket Server stopped');
    });
  }
}

// Create and export a singleton instance
export const webSocketServer = new WebSocketServer();