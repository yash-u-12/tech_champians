// Hospital Automation System - Main Exports

// Core Components
export { BaseAgent } from './agents/base-agent.js';
export { MessageBus } from './agents/message-bus.js';

// AI Agents
export { ReceptionAgent } from './agents/reception-agent.js';
export { TriageAgent } from './agents/triage-agent.js';
export { SchedulingAgent } from './agents/scheduling-agent.js';
export { PharmacyAgent } from './agents/pharmacy-agent.js';
export { LabAgent } from './agents/lab-agent.js';
export { BillingAgent } from './agents/billing-agent.js';

// Orchestrator
export { HospitalOrchestrator, getOrchestrator } from './workflows/orchestrator.js';

// Main entry point
export { main } from './index.js';
