// Base Agent Class - All agents inherit from this
export class BaseAgent {
  constructor(agentName, config = {}) {
    this.agentName = agentName;
    this.config = config;
    this.state = 'idle'; // idle, busy, error
    this.messageQueue = [];
    this.handlers = new Map();
    this.logger = console; // Replace with proper logger
  }

  // Start the agent
  async start() {
    this.state = 'idle';
    this.logger.info(`[${this.agentName}] Agent started`);
    this.processQueue();
  }

  // Stop the agent
  async stop() {
    this.state = 'stopped';
    this.logger.info(`[${this.agentName}] Agent stopped`);
  }

  // Register message handlers
  on(messageType, handler) {
    this.handlers.set(messageType, handler);
  }

  // Send message to another agent
  async sendMessage(targetAgent, messageType, payload) {
    const message = {
      from: this.agentName,
      to: targetAgent,
      type: messageType,
      payload,
      timestamp: new Date().toISOString(),
      id: this.generateMessageId()
    };

    this.logger.info(`[${this.agentName}] Sending message to ${targetAgent}:`, messageType);
    
    // Use message bus for inter-agent communication
    const { MessageBus } = await import('./message-bus.js');
    await MessageBus.getInstance().publish(message);
    
    return message.id;
  }

  // Receive and process messages
  async receiveMessage(message) {
    this.messageQueue.push(message);
    await this.processQueue();
  }

  // Process message queue
  async processQueue() {
    if (this.state === 'stopped' || this.messageQueue.length === 0) {
      return;
    }

    this.state = 'busy';
    const message = this.messageQueue.shift();

    try {
      const handler = this.handlers.get(message.type);
      if (handler) {
        await handler.call(this, message.payload, message);
      } else {
        this.logger.warn(`[${this.agentName}] No handler for message type: ${message.type}`);
      }
    } catch (error) {
      this.logger.error(`[${this.agentName}] Error processing message:`, error);
      this.state = 'error';
      // Emit error event
      await this.sendMessage('monitoring', 'AGENT_ERROR', {
        agent: this.agentName,
        error: error.message,
        message
      });
    }

    this.state = 'idle';
    
    // Continue processing if more messages
    if (this.messageQueue.length > 0) {
      setImmediate(() => this.processQueue());
    }
  }

  // AI Decision Making
  async makeDecision(context, options) {
    // This will be implemented by specific agents
    // using AI models (Gemini, GPT, etc.)
    throw new Error('makeDecision must be implemented by subclass');
  }

  // Generate unique message ID
  generateMessageId() {
    return `${this.agentName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Log agent activity
  log(level, message, data = {}) {
    this.logger[level](`[${this.agentName}] ${message}`, data);
  }

  // Get agent status
  getStatus() {
    return {
      name: this.agentName,
      state: this.state,
      queueLength: this.messageQueue.length,
      timestamp: new Date().toISOString()
    };
  }
}

export default BaseAgent;
