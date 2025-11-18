import { BaseAgent } from './base-agent.js';

export class BillingAgent extends BaseAgent {
  constructor(config = {}) {
    super('BillingAgent', config);
    
    this.setupHandlers();
    
    this.invoices = new Map();
    this.payments = new Map();
    this.pricing = this.initializePricing();
  }

  setupHandlers() {
    this.on('CONSULTATION_STARTED', this.handleConsultationStarted.bind(this));
    this.on('CONSULTATION_COMPLETE', this.handleConsultationComplete.bind(this));
    this.on('PRESCRIPTION_READY', this.handlePrescriptionReady.bind(this));
    this.on('TESTS_CHARGED', this.handleTestsCharged.bind(this));
    this.on('PROCESS_PAYMENT', this.handleProcessPayment.bind(this));
    this.on('GENERATE_INVOICE', this.handleGenerateInvoice.bind(this));
  }

  initializePricing() {
    return {
      consultations: {
        general: 100,
        cardiology: 200,
        neurology: 250,
        orthopedic: 180,
        pediatrics: 120,
        dermatology: 150,
        emergency: 300,
        internal_medicine: 180
      },
      tests: {
        blood_test: 50,
        urine_test: 30,
        x_ray: 100,
        ct_scan: 500,
        mri: 800,
        ultrasound: 200,
        ecg: 75
      },
      rooms: {
        emergency: 500,
        consultation: 50,
        observation: 200
      },
      additionalCharges: {
        urgentCare: 100,
        afterHours: 150,
        followUp: 50
      }
    };
  }

  async handleConsultationStarted(payload) {
    this.log('info', 'Creating invoice for consultation', payload);
    
    const { patientId, appointmentId, specialty, estimatedTime } = payload;
    const invoiceId = `inv-${Date.now()}`;

    const invoice = {
      invoiceId,
      patientId,
      appointmentId,
      items: [],
      subtotal: 0,
      tax: 0,
      total: 0,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    // Add consultation charge
    const consultationFee = this.pricing.consultations[specialty] || this.pricing.consultations.general;
    invoice.items.push({
      type: 'consultation',
      description: `${specialty} consultation`,
      amount: consultationFee,
      quantity: 1
    });

    invoice.subtotal = consultationFee;
    this.invoices.set(invoiceId, invoice);

    return invoice;
  }

  async handleConsultationComplete(payload) {
    this.log('info', 'Finalizing consultation charges', payload);
    
    const { patientId, appointmentId, actualDuration } = payload;
    
    // Find invoice
    const invoice = Array.from(this.invoices.values())
      .find(inv => inv.appointmentId === appointmentId);

    if (!invoice) return;

    // Add overtime charges if applicable
    const consultation = invoice.items.find(item => item.type === 'consultation');
    if (consultation && actualDuration > 60) {
      const overtimeMinutes = actualDuration - 60;
      const overtimeCharge = Math.ceil(overtimeMinutes / 15) * 25;
      
      invoice.items.push({
        type: 'overtime',
        description: `Extended consultation (${overtimeMinutes} minutes)`,
        amount: overtimeCharge,
        quantity: 1
      });
    }

    this.calculateTotal(invoice);
  }

  async handlePrescriptionReady(payload) {
    this.log('info', 'Adding prescription charges', payload);
    
    const { patientId, prescriptionId, medications, totalCost } = payload;

    // Find or create invoice for this patient
    let invoice = Array.from(this.invoices.values())
      .find(inv => inv.patientId === patientId && inv.status === 'pending');

    if (!invoice) {
      const invoiceId = `inv-${Date.now()}`;
      invoice = {
        invoiceId,
        patientId,
        items: [],
        subtotal: 0,
        tax: 0,
        total: 0,
        status: 'pending',
        createdAt: new Date().toISOString()
      };
      this.invoices.set(invoiceId, invoice);
    }

    // Add each medication
    medications.forEach(med => {
      invoice.items.push({
        type: 'medication',
        description: `${med.name} - ${med.dosage} (${med.quantity} units)`,
        amount: med.quantity * 2.5,
        quantity: 1
      });
    });

    this.calculateTotal(invoice);

    // Notify patient
    await this.sendMessage('PatientMonitoringAgent', 'INVOICE_UPDATED', {
      patientId,
      invoiceId: invoice.invoiceId,
      total: invoice.total
    });
  }

  async handleTestsCharged(payload) {
    this.log('info', 'Adding test charges', payload);
    
    const { patientId, tests } = payload;

    let invoice = Array.from(this.invoices.values())
      .find(inv => inv.patientId === patientId && inv.status === 'pending');

    if (!invoice) return;

    tests.forEach(test => {
      const testCost = this.pricing.tests[test.testType] || 50;
      invoice.items.push({
        type: 'test',
        description: test.testType.replace(/_/g, ' ').toUpperCase(),
        amount: testCost,
        quantity: 1
      });
    });

    this.calculateTotal(invoice);
  }

  calculateTotal(invoice) {
    invoice.subtotal = invoice.items.reduce((sum, item) => sum + item.amount, 0);
    invoice.tax = invoice.subtotal * 0.08; // 8% tax
    invoice.total = invoice.subtotal + invoice.tax;
    
    invoice.updatedAt = new Date().toISOString();
  }

  async handleProcessPayment(payload) {
    this.log('info', 'Processing payment', payload);
    
    const { invoiceId, patientId, paymentMethod, amount } = payload;

    const invoice = this.invoices.get(invoiceId);
    if (!invoice) {
      return { success: false, error: 'Invoice not found' };
    }

    if (amount < invoice.total) {
      return { success: false, error: 'Insufficient payment amount' };
    }

    const paymentId = `pay-${Date.now()}`;
    const payment = {
      paymentId,
      invoiceId,
      patientId,
      amount,
      paymentMethod,
      status: 'completed',
      timestamp: new Date().toISOString()
    };

    this.payments.set(paymentId, payment);
    invoice.status = 'paid';
    invoice.paidAt = payment.timestamp;
    invoice.paymentId = paymentId;

    // If overpaid, calculate change
    const change = amount - invoice.total;
    if (change > 0) {
      payment.change = change;
    }

    // Notify patient monitoring
    await this.sendMessage('PatientMonitoringAgent', 'PAYMENT_COMPLETE', {
      patientId,
      invoiceId,
      paymentId,
      change
    });

    // Update hospital records
    await this.sendMessage('monitoring', 'REVENUE_UPDATE', {
      amount: invoice.total,
      category: 'patient_services',
      timestamp: payment.timestamp
    });

    return { success: true, payment };
  }

  async handleGenerateInvoice(payload) {
    const { invoiceId } = payload;
    const invoice = this.invoices.get(invoiceId);
    
    if (!invoice) {
      return null;
    }

    // Generate detailed invoice
    const detailedInvoice = {
      ...invoice,
      hospitalInfo: {
        name: 'MedSync Hospital',
        address: '123 Medical Center Drive',
        phone: '555-0100',
        taxId: 'TAX-123456'
      },
      itemizedCharges: invoice.items.map(item => ({
        ...item,
        total: item.amount * item.quantity
      }))
    };

    return detailedInvoice;
  }

  getInvoicesForPatient(patientId) {
    return Array.from(this.invoices.values())
      .filter(inv => inv.patientId === patientId);
  }

  getPendingInvoices() {
    return Array.from(this.invoices.values())
      .filter(inv => inv.status === 'pending');
  }

  getFinancialSummary() {
    const invoices = Array.from(this.invoices.values());
    const payments = Array.from(this.payments.values());

    const totalBilled = invoices.reduce((sum, inv) => sum + inv.total, 0);
    const totalPaid = payments.reduce((sum, pay) => sum + pay.amount, 0);
    const pending = invoices.filter(inv => inv.status === 'pending').length;
    const paid = invoices.filter(inv => inv.status === 'paid').length;

    return {
      totalBilled: totalBilled.toFixed(2),
      totalPaid: totalPaid.toFixed(2),
      outstanding: (totalBilled - totalPaid).toFixed(2),
      invoiceCount: {
        total: invoices.length,
        pending,
        paid
      },
      averageInvoiceAmount: (totalBilled / invoices.length || 0).toFixed(2)
    };
  }
}

export default BillingAgent;
