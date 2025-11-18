// Message Bus - Central communication hub for all agents
class MessageBusClass {
  constructor() {
    this.subscribers = new Map();
    this.messageHistory = [];
    this.maxHistorySize = 1000;
  }

  // Subscribe agent to message types
  subscribe(agentName, messageTypes, callback) {
    if (!this.subscribers.has(agentName)) {
      this.subscribers.set(agentName, new Map());
    }

    const agentSubs = this.subscribers.get(agentName);
    messageTypes.forEach(type => {
      if (!agentSubs.has(type)) {
        agentSubs.set(type, []);
      }
      agentSubs.get(type).push(callback);
    });
  }

  // Unsubscribe agent
  unsubscribe(agentName, messageType = null) {
    if (messageType) {
      const agentSubs = this.subscribers.get(agentName);
      if (agentSubs) {
        agentSubs.delete(messageType);
      }
    } else {
      this.subscribers.delete(agentName);
    }
  }

  // Publish message to subscribers
  async publish(message) {
    // Store in history
    this.messageHistory.push(message);
    if (this.messageHistory.length > this.maxHistorySize) {
      this.messageHistory.shift();
    }

    // Route to specific recipient
    if (message.to) {
      const targetSubs = this.subscribers.get(message.to);
      if (targetSubs) {
        // Check for specific message type handlers
        const specificHandlers = targetSubs.get(message.type) || [];
        // Check for ALL message type handlers
        const allHandlers = targetSubs.get('ALL') || [];
        const handlers = [...specificHandlers, ...allHandlers];
        
        await Promise.all(handlers.map(handler => handler(message)));
      }
    }

    // Also notify monitoring systems
    const monitoringSubs = this.subscribers.get('monitoring');
    if (monitoringSubs) {
      const handlers = monitoringSubs.get('ALL') || [];
      await Promise.all(handlers.map(handler => handler(message)));
    }
  }

  // Get message history
  getHistory(filters = {}) {
    let history = [...this.messageHistory];

    if (filters.from) {
      history = history.filter(m => m.from === filters.from);
    }
    if (filters.to) {
      history = history.filter(m => m.to === filters.to);
    }
    if (filters.type) {
      history = history.filter(m => m.type === filters.type);
    }
    if (filters.since) {
      history = history.filter(m => new Date(m.timestamp) >= new Date(filters.since));
    }

    return history;
  }

  // Get active subscribers
  getSubscribers() {
    const result = {};
    for (const [agentName, subs] of this.subscribers.entries()) {
      result[agentName] = Array.from(subs.keys());
    }
    return result;
  }

  // Clear history
  clearHistory() {
    this.messageHistory = [];
  }
}

// Singleton instance
let instance = null;

export class MessageBus {
  static getInstance() {
    if (!instance) {
      instance = new MessageBusClass();
    }
    return instance;
  }
}

export default MessageBus;
