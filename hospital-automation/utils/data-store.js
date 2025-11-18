// Simple in-memory data store for hospital automation
// In production, this would be replaced with a real database

export class HospitalDataStore {
  constructor() {
    this.patients = new Map();
    this.doctors = new Map();
    this.visits = new Map();
    this.prescriptions = new Map();
    
    // Initialize with some demo doctors
    this.initializeDoctors();
  }

  // ==================== DOCTOR METHODS ====================
  
  initializeDoctors() {
    const doctors = [
      {
        doctorId: 'DR001',
        name: 'Dr. Sarah Smith',
        specialty: 'General Medicine',
        available: true,
        currentPatients: [],
        maxPatients: 5,
        stats: { patientsToday: 0, totalPatients: 0 }
      },
      {
        doctorId: 'DR002',
        name: 'Dr. James Wilson',
        specialty: 'General Medicine',
        available: true,
        currentPatients: [],
        maxPatients: 5,
        stats: { patientsToday: 0, totalPatients: 0 }
      },
      {
        doctorId: 'DR003',
        name: 'Dr. Emily Johnson',
        specialty: 'Pediatrics',
        available: true,
        currentPatients: [],
        maxPatients: 4,
        stats: { patientsToday: 0, totalPatients: 0 }
      },
      {
        doctorId: 'DR004',
        name: 'Dr. Michael Brown',
        specialty: 'Cardiology',
        available: true,
        currentPatients: [],
        maxPatients: 3,
        stats: { patientsToday: 0, totalPatients: 0 }
      }
    ];

    doctors.forEach(doc => this.doctors.set(doc.doctorId, doc));
  }

  getAvailableDoctors(specialty = null) {
    const allDoctors = Array.from(this.doctors.values());
    
    return allDoctors.filter(doctor => {
      const hasCapacity = doctor.currentPatients.length < doctor.maxPatients;
      const matchesSpecialty = !specialty || doctor.specialty === specialty;
      return doctor.available && hasCapacity && matchesSpecialty;
    });
  }

  getDoctor(doctorId) {
    return this.doctors.get(doctorId);
  }

  getDoctorPatients(doctorId) {
    const doctor = this.doctors.get(doctorId);
    if (!doctor) return [];

    return doctor.currentPatients.map(patientId => {
      const visit = Array.from(this.visits.values()).find(
        v => v.patientId === patientId && v.assignedDoctorId === doctorId && v.status !== 'completed'
      );
      const patient = this.patients.get(patientId);
      return { ...patient, currentVisit: visit };
    });
  }

  assignPatientToDoctor(patientId, doctorId) {
    const doctor = this.doctors.get(doctorId);
    if (!doctor || doctor.currentPatients.length >= doctor.maxPatients) {
      return false;
    }

    if (!doctor.currentPatients.includes(patientId)) {
      doctor.currentPatients.push(patientId);
      doctor.stats.patientsToday++;
      doctor.stats.totalPatients++;
    }

    return true;
  }

  removePatientFromDoctor(patientId, doctorId) {
    const doctor = this.doctors.get(doctorId);
    if (!doctor) return;

    doctor.currentPatients = doctor.currentPatients.filter(id => id !== patientId);
  }

  // ==================== PATIENT METHODS ====================

  createPatient(data) {
    const patientId = `PAT${Date.now()}`;
    const patient = {
      patientId,
      name: data.name,
      age: data.age || null,
      phone: data.phone || null,
      email: data.email || null,
      createdAt: new Date().toISOString(),
      visitHistory: []
    };

    this.patients.set(patientId, patient);
    return patient;
  }

  getPatient(patientId) {
    return this.patients.get(patientId);
  }

  getAllPatients() {
    return Array.from(this.patients.values());
  }

  updatePatient(patientId, updates) {
    const patient = this.patients.get(patientId);
    if (!patient) return null;

    Object.assign(patient, updates);
    return patient;
  }

  // ==================== VISIT METHODS ====================

  createVisit(patientId, problemDescription, urgency = 'medium') {
    const visitId = `VIS${Date.now()}`;
    const visit = {
      visitId,
      patientId,
      checkInTime: new Date().toISOString(),
      problem: problemDescription,
      urgency,
      assignedDoctorId: null,
      assignedDoctorName: null,
      status: 'waiting', // waiting, in_consultation, completed
      prescription: null,
      diagnosis: null,
      notes: null,
      completedAt: null
    };

    this.visits.set(visitId, visit);

    // Add to patient's visit history
    const patient = this.patients.get(patientId);
    if (patient) {
      patient.currentVisitId = visitId;
    }

    return visit;
  }

  getVisit(visitId) {
    return this.visits.get(visitId);
  }

  getCurrentVisit(patientId) {
    return Array.from(this.visits.values()).find(
      v => v.patientId === patientId && v.status !== 'completed'
    );
  }

  updateVisit(visitId, updates) {
    const visit = this.visits.get(visitId);
    if (!visit) return null;

    Object.assign(visit, updates);
    return visit;
  }

  assignVisitToDoctor(visitId, doctorId) {
    const visit = this.visits.get(visitId);
    const doctor = this.doctors.get(doctorId);

    if (!visit || !doctor) return false;

    visit.assignedDoctorId = doctorId;
    visit.assignedDoctorName = doctor.name;
    visit.status = 'assigned';

    this.assignPatientToDoctor(visit.patientId, doctorId);

    return visit;
  }

  startConsultation(visitId) {
    const visit = this.visits.get(visitId);
    if (!visit) return null;

    visit.status = 'in_consultation';
    visit.consultationStartTime = new Date().toISOString();

    return visit;
  }

  completeVisit(visitId, prescription, diagnosis, notes) {
    const visit = this.visits.get(visitId);
    if (!visit) return null;

    visit.prescription = prescription;
    visit.diagnosis = diagnosis;
    visit.notes = notes;
    visit.status = 'completed';
    visit.completedAt = new Date().toISOString();

    // Remove from doctor's current patients
    if (visit.assignedDoctorId) {
      this.removePatientFromDoctor(visit.patientId, visit.assignedDoctorId);
    }

    // Add to patient's visit history
    const patient = this.patients.get(visit.patientId);
    if (patient) {
      patient.visitHistory.push({
        visitId,
        date: visit.checkInTime,
        problem: visit.problem,
        doctor: visit.assignedDoctorName,
        prescription: visit.prescription,
        diagnosis: visit.diagnosis
      });
      delete patient.currentVisitId;
    }

    return visit;
  }

  // ==================== PRESCRIPTION METHODS ====================

  createPrescription(visitId, medications, doctorId) {
    const prescriptionId = `RX${Date.now()}`;
    const prescription = {
      prescriptionId,
      visitId,
      doctorId,
      medications, // Array of {name, dosage, frequency, duration, instructions}
      createdAt: new Date().toISOString(),
      status: 'pending' // pending, dispensed
    };

    this.prescriptions.set(prescriptionId, prescription);

    // Update visit with prescription
    const visit = this.visits.get(visitId);
    if (visit) {
      visit.prescription = prescription;
    }

    return prescription;
  }

  getPrescription(prescriptionId) {
    return this.prescriptions.get(prescriptionId);
  }

  getPrescriptionsByVisit(visitId) {
    return Array.from(this.prescriptions.values()).filter(
      p => p.visitId === visitId
    );
  }

  // ==================== STATISTICS METHODS ====================

  getHospitalStats() {
    const totalPatients = this.patients.size;
    const totalVisits = this.visits.size;
    const activeVisits = Array.from(this.visits.values()).filter(
      v => v.status !== 'completed'
    ).length;
    const totalDoctors = this.doctors.size;
    const availableDoctors = this.getAvailableDoctors().length;

    return {
      totalPatients,
      totalVisits,
      activeVisits,
      totalDoctors,
      availableDoctors,
      timestamp: new Date().toISOString()
    };
  }

  // ==================== UTILITY METHODS ====================

  clearAllData() {
    this.patients.clear();
    this.visits.clear();
    this.prescriptions.clear();
    this.initializeDoctors(); // Keep doctors
  }

  exportData() {
    return {
      patients: Array.from(this.patients.entries()),
      doctors: Array.from(this.doctors.entries()),
      visits: Array.from(this.visits.entries()),
      prescriptions: Array.from(this.prescriptions.entries())
    };
  }
}

// Singleton instance
let dataStoreInstance = null;

export function getDataStore() {
  if (!dataStoreInstance) {
    dataStoreInstance = new HospitalDataStore();
  }
  return dataStoreInstance;
}

// Add static method for getInstance (for consistency)
HospitalDataStore.getInstance = function() {
  if (!dataStoreInstance) {
    dataStoreInstance = new HospitalDataStore();
  }
  return dataStoreInstance;
};
