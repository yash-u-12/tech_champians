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

    console.log('📡 MessageBus: Publishing', message.type, 'to', this.subscribers.size, 'agent groups');
    console.log('📡 MessageBus: All subscribers:', Array.from(this.subscribers.keys()));

    // Broadcast to ALL subscribers of this message type
    const handlers = [];
    
    for (const [agentName, agentSubs] of this.subscribers.entries()) {
      console.log(`📡 MessageBus: Checking ${agentName}, agentSubs type:`, typeof agentSubs, 'is Map?', agentSubs instanceof Map);
      console.log(`📡 MessageBus: ${agentName} subscriptions:`, Array.from(agentSubs.keys()));
      
      // Get handlers for this specific message type
      const typeHandlers = agentSubs.get(message.type) || [];
      // Get handlers for ALL message types
      const allHandlers = agentSubs.get('ALL') || [];
      
      console.log(`📡 MessageBus: ${agentName} has ${typeHandlers.length} handlers for ${message.type}, ${allHandlers.length} for ALL`);
      
      handlers.push(...typeHandlers, ...allHandlers);
      
      if (typeHandlers.length > 0 || allHandlers.length > 0) {
        console.log(`📡 MessageBus: Will notify ${agentName} (${typeHandlers.length} specific, ${allHandlers.length} all)`);
      }
    }

    console.log('📡 MessageBus: Total handlers to notify:', handlers.length);
    
    if (handlers.length > 0) {
      console.log('📡 MessageBus: Calling handlers...');
      await Promise.all(handlers.map((handler, index) => {
        try {
          console.log(`📡 MessageBus: Calling handler ${index + 1}/${handlers.length}`);
          return handler(message);
        } catch (error) {
          console.error('📡 MessageBus: Handler error:', error);
          return Promise.resolve();
        }
      }));
      console.log('📡 MessageBus: All handlers called');
    } else {
      console.log('📡 MessageBus: NO HANDLERS FOUND!');
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

// Singleton instance persisted globally
export class MessageBus {
  static getInstance() {
    if (!globalThis.__HOSPITAL_MESSAGE_BUS__) {
      globalThis.__HOSPITAL_MESSAGE_BUS__ = new MessageBusClass();
    }
    return globalThis.__HOSPITAL_MESSAGE_BUS__;
  }
}

export default MessageBus;
