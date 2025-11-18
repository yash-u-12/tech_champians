'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PatientCheckIn from '@/hospital-automation/interfaces/patient/PatientCheckIn';
import AIProcessing from '@/hospital-automation/interfaces/patient/AIProcessing';
import DoctorPrescriptionForm from '@/hospital-automation/interfaces/doctor/DoctorPrescriptionForm';
import { User, Stethoscope, Activity, ArrowRight } from 'lucide-react';

export default function HospitalWorkflowPage() {
  const [activeTab, setActiveTab] = useState('patient');
  const [patientId, setPatientId] = useState(null);
  const [visitId, setVisitId] = useState(null);
  const [patientData, setPatientData] = useState(null);
  const [visitData, setVisitData] = useState(null);

  // Demo data for doctor view
  const demoPatient = {
    patientId: 'PAT123',
    name: 'John Doe',
    age: 35,
    phone: '1234567890',
    email: 'john@example.com'
  };

  const demoVisit = {
    visitId: 'VIS123',
    patientId: 'PAT123',
    problem: 'Persistent cough and mild fever for 3 days',
    urgency: 'medium',
    status: 'in_consultation'
  };

  const handleCheckInComplete = (newPatientId, newVisitId) => {
    setPatientId(newPatientId);
    setVisitId(newVisitId);
    // In real app, this would fetch actual data
    setPatientData({ ...demoPatient, patientId: newPatientId });
    setVisitData({ ...demoVisit, visitId: newVisitId });
  };

  const handlePrescriptionComplete = (data) => {
    console.log('Prescription completed:', data);
    // Reset or show completion message
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold">Hospital Automation System</h1>
        <p className="text-muted-foreground text-lg">
          AI-Powered Patient Flow Management
        </p>
      </div>

      {/* Workflow Steps Visualization */}
      <Card className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-950 dark:to-green-950">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            <div className="text-center flex-1">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-2">
                <User className="h-6 w-6 text-white" />
              </div>
              <p className="text-sm font-semibold">Patient Check-In</p>
              <p className="text-xs text-muted-foreground">Describe problem</p>
            </div>

            <ArrowRight className="h-6 w-6 text-muted-foreground" />

            <div className="text-center flex-1">
              <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-2">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <p className="text-sm font-semibold">AI Processing</p>
              <p className="text-xs text-muted-foreground">Auto-assign doctor</p>
            </div>

            <ArrowRight className="h-6 w-6 text-muted-foreground" />

            <div className="text-center flex-1">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-2">
                <Stethoscope className="h-6 w-6 text-white" />
              </div>
              <p className="text-sm font-semibold">Doctor Consultation</p>
              <p className="text-xs text-muted-foreground">Upload prescription</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Workflow Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-3">
          <TabsTrigger value="patient">
            <User className="h-4 w-4 mr-2" />
            Patient
          </TabsTrigger>
          <TabsTrigger value="ai">
            <Activity className="h-4 w-4 mr-2" />
            AI Process
          </TabsTrigger>
          <TabsTrigger value="doctor">
            <Stethoscope className="h-4 w-4 mr-2" />
            Doctor
          </TabsTrigger>
        </TabsList>

        {/* Patient Check-In Tab */}
        <TabsContent value="patient">
          <div className="space-y-4">
            <div className="text-center space-y-2 mb-6">
              <h2 className="text-2xl font-bold">Step 1: Patient Check-In</h2>
              <p className="text-muted-foreground">
                Patient enters the hospital and describes their health problem
              </p>
            </div>
            <PatientCheckIn onCheckInComplete={handleCheckInComplete} />
          </div>
        </TabsContent>

        {/* AI Processing Tab */}
        <TabsContent value="ai">
          <div className="space-y-4">
            <div className="text-center space-y-2 mb-6">
              <h2 className="text-2xl font-bold">Step 2: AI Agent Processing</h2>
              <p className="text-muted-foreground">
                AI agents analyze symptoms and assign patient to the right doctor
              </p>
            </div>
            {patientId && visitId ? (
              <AIProcessing patientId={patientId} visitId={visitId} />
            ) : (
              <Card>
                <CardContent className="pt-6 text-center">
                  <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">
                    No active patient check-in. Please complete check-in first.
                  </p>
                  <Button onClick={() => setActiveTab('patient')}>
                    Go to Check-In
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Doctor Prescription Tab */}
        <TabsContent value="doctor">
          <div className="space-y-4">
            <div className="text-center space-y-2 mb-6">
              <h2 className="text-2xl font-bold">Step 3: Doctor Consultation</h2>
              <p className="text-muted-foreground">
                Doctor reviews patient and uploads prescription to their profile
              </p>
            </div>
            {patientData && visitData ? (
              <DoctorPrescriptionForm
                patient={patientData}
                visit={visitData}
                onComplete={handlePrescriptionComplete}
              />
            ) : (
              <Card>
                <CardContent className="pt-6 text-center">
                  <Stethoscope className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">
                    No patient assigned yet. Complete check-in and AI processing first.
                  </p>
                  <Button onClick={() => setActiveTab('patient')}>
                    Start with Check-In
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Demo Controls */}
      <Card className="max-w-2xl mx-auto bg-secondary/50">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <h3 className="font-semibold">Quick Demo Actions</h3>
            <div className="flex gap-2 justify-center flex-wrap">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setPatientId('PAT_DEMO_' + Date.now());
                  setVisitId('VIS_DEMO_' + Date.now());
                  setPatientData(demoPatient);
                  setVisitData(demoVisit);
                  setActiveTab('ai');
                }}
              >
                Simulate Check-In Complete
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setPatientId(null);
                  setVisitId(null);
                  setPatientData(null);
                  setVisitData(null);
                  setActiveTab('patient');
                }}
              >
                Reset Workflow
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              These controls are for demo purposes to quickly test the workflow
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
