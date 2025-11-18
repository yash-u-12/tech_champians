import { BaseAgent } from './base-agent.js';

export class SchedulingAgent extends BaseAgent {
  constructor(config = {}) {
    super('SchedulingAgent', config);
    
    this.setupHandlers();
    
    // Resources
    this.doctors = new Map();
    this.rooms = new Map();
    this.appointments = new Map();
    this.waitingList = [];
    
    this.initializeResources();
  }

  setupHandlers() {
    this.on('PATIENT_REGISTERED', this.handlePatientRegistered.bind(this));
    this.on('ASSIGN_DOCTOR', this.handleAssignDoctor.bind(this));
    this.on('UPDATE_PRIORITY', this.handleUpdatePriority.bind(this));
    this.on('CONSULTATION_COMPLETE', this.handleConsultationComplete.bind(this));
    this.on('REQUEST_ROOM', this.handleRequestRoom.bind(this));
  }

  initializeResources() {
    // Initialize available doctors by specialty
    const specialties = ['general', 'cardiology', 'neurology', 'orthopedic', 'pediatrics', 'dermatology', 'emergency', 'internal_medicine'];
    
    specialties.forEach(specialty => {
      this.doctors.set(specialty, [
        { id: `doc-${specialty}-1`, name: `Dr. Smith (${specialty})`, available: true, currentPatient: null },
        { id: `doc-${specialty}-2`, name: `Dr. Jones (${specialty})`, available: true, currentPatient: null }
      ]);
    });

    // Initialize rooms
    for (let i = 1; i <= 20; i++) {
      this.rooms.set(`room-${i}`, {
        id: `room-${i}`,
        available: true,
        currentPatient: null,
        type: i <= 5 ? 'emergency' : i <= 15 ? 'consultation' : 'observation'
      });
    }
  }

  async handlePatientRegistered(payload) {
    this.log('info', 'Patient registered in scheduling', payload);
    this.waitingList.push(payload);
  }

  async handleAssignDoctor(payload) {
    this.log('info', 'Assigning doctor', payload);
    
    const { patientId, specialty, priority, estimatedConsultationTime } = payload;

    // Find available doctor
    const doctor = this.findAvailableDoctor(specialty, priority);
    
    if (!doctor) {
      this.log('warn', 'No available doctor', { specialty, priority });
      // Add to priority queue
      this.waitingList.push({ ...payload, waitingForDoctor: true });
      
      // Notify staff coordinator
      await this.sendMessage('StaffCoordinatorAgent', 'DOCTOR_NEEDED', {
        specialty,
        priority,
        patientsWaiting: this.waitingList.length
      });
      return;
    }

    // Find available room
    const room = this.findAvailableRoom(priority === 'critical' ? 'emergency' : 'consultation');
    
    if (!room) {
      this.log('warn', 'No available room');
      this.waitingList.push({ ...payload, waitingForRoom: true, assignedDoctor: doctor.id });
      return;
    }

    // Create appointment
    const appointment = {
      appointmentId: `apt-${Date.now()}`,
      patientId,
      doctorId: doctor.id,
      doctorName: doctor.name,
      roomId: room.id,
      specialty,
      priority,
      estimatedTime: estimatedConsultationTime || 30,
      startTime: new Date().toISOString(),
      status: 'in_progress'
    };

    // Update resources
    doctor.available = false;
    doctor.currentPatient = patientId;
    room.available = false;
    room.currentPatient = patientId;

    this.appointments.set(appointment.appointmentId, appointment);

    // Notify patient monitoring
    await this.sendMessage('PatientMonitoringAgent', 'CONSULTATION_STARTED', {
      patientId,
      appointmentId: appointment.appointmentId,
      doctorId: doctor.id,
      roomId: room.id
    });

    // Notify billing
    await this.sendMessage('BillingAgent', 'CONSULTATION_STARTED', {
      patientId,
      appointmentId: appointment.appointmentId,
      specialty,
      estimatedTime: estimatedConsultationTime
    });

    this.log('info', 'Appointment created', appointment);
    return appointment;
  }

  async handleUpdatePriority(payload) {
    this.log('info', 'Updating priority', payload);
    
    const { patientId, newPriority } = payload;

    // Find patient in waiting list
    const waitingPatient = this.waitingList.find(p => p.patientId === patientId);
    if (waitingPatient) {
      waitingPatient.priority = newPriority;
      
      // Re-sort waiting list by priority
      this.sortWaitingList();
      
      // Try to assign if critical
      if (newPriority === 'critical') {
        await this.handleAssignDoctor(waitingPatient);
      }
    }
  }

  async handleConsultationComplete(payload) {
    this.log('info', 'Consultation complete', payload);
    
    const { appointmentId, patientId, prescription, followUp } = payload;

    const appointment = this.appointments.get(appointmentId);
    if (!appointment) return;

    appointment.status = 'completed';
    appointment.endTime = new Date().toISOString();
    appointment.actualDuration = Math.round(
      (new Date(appointment.endTime) - new Date(appointment.startTime)) / 60000
    );

    // Free up resources
    const doctors = this.doctors.get(appointment.specialty);
    const doctor = doctors?.find(d => d.id === appointment.doctorId);
    if (doctor) {
      doctor.available = true;
      doctor.currentPatient = null;
    }

    const room = this.rooms.get(appointment.roomId);
    if (room) {
      room.available = true;
      room.currentPatient = null;
    }

    // Send to pharmacy if prescription
    if (prescription && prescription.length > 0) {
      await this.sendMessage('PharmacyAgent', 'PRESCRIPTION_ORDER', {
        patientId,
        appointmentId,
        medications: prescription
      });
    }

    // Send to billing
    await this.sendMessage('BillingAgent', 'CONSULTATION_COMPLETE', {
      patientId,
      appointmentId,
      actualDuration: appointment.actualDuration,
      prescription
    });

    // Schedule follow-up if needed
    if (followUp) {
      await this.scheduleFollowUp(patientId, followUp);
    }

    // Process waiting list
    await this.processWaitingList();
  }

  async handleRequestRoom(payload) {
    const { patientId, roomType, priority } = payload;
    const room = this.findAvailableRoom(roomType, priority);
    
    if (room) {
      room.available = false;
      room.currentPatient = patientId;
      return room;
    }
    
    return null;
  }

  findAvailableDoctor(specialty, priority) {
    const doctors = this.doctors.get(specialty);
    if (!doctors) return null;

    // Find available doctor
    let doctor = doctors.find(d => d.available);
    
    // If critical and no available doctor, try to interrupt routine consultation
    if (!doctor && priority === 'critical') {
      const busyDoctor = doctors.find(d => !d.available);
      if (busyDoctor) {
        // Notify about interruption
        this.log('warn', 'Interrupting consultation for critical patient', {
          doctorId: busyDoctor.id
        });
        // In real scenario, would coordinate with monitoring agent
        return busyDoctor;
      }
    }

    return doctor;
  }

  findAvailableRoom(roomType, priority = 'routine') {
    let room;
    
    if (roomType === 'emergency' || priority === 'critical') {
      room = Array.from(this.rooms.values())
        .find(r => r.available && r.type === 'emergency');
    }
    
    if (!room) {
      room = Array.from(this.rooms.values())
        .find(r => r.available && r.type === roomType);
    }
    
    if (!room) {
      room = Array.from(this.rooms.values()).find(r => r.available);
    }

    return room;
  }

  sortWaitingList() {
    const priorityOrder = { critical: 0, urgent: 1, routine: 2 };
    this.waitingList.sort((a, b) => {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  async processWaitingList() {
    if (this.waitingList.length === 0) return;

    this.sortWaitingList();
    const next = this.waitingList.shift();
    
    if (next) {
      await this.handleAssignDoctor(next);
    }
  }

  async scheduleFollowUp(patientId, followUpDetails) {
    this.log('info', 'Scheduling follow-up', { patientId, followUpDetails });
    // Implementation for follow-up scheduling
  }

  getResourceStatus() {
    const doctorStatus = {};
    for (const [specialty, doctors] of this.doctors.entries()) {
      doctorStatus[specialty] = {
        total: doctors.length,
        available: doctors.filter(d => d.available).length,
        busy: doctors.filter(d => !d.available).length
      };
    }

    const roomStatus = {
      total: this.rooms.size,
      available: Array.from(this.rooms.values()).filter(r => r.available).length,
      occupied: Array.from(this.rooms.values()).filter(r => !r.available).length
    };

    return {
      doctors: doctorStatus,
      rooms: roomStatus,
      waitingList: this.waitingList.length,
      activeAppointments: Array.from(this.appointments.values())
        .filter(a => a.status === 'in_progress').length
    };
  }
}

export default SchedulingAgent;
