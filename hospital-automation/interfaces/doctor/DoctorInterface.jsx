'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  User, 
  FileText, 
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  Upload,
  Download,
  Pill,
  TestTube,
  Activity
} from 'lucide-react';

export default function DoctorInterface({ doctorId = 'doc-general-1' }) {
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [prescription, setPrescription] = useState({
    medications: [],
    instructions: '',
    followUp: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyPatients();
    const interval = setInterval(fetchMyPatients, 10000);
    return () => clearInterval(interval);
  }, [doctorId]);

  const fetchMyPatients = async () => {
    try {
      const response = await fetch(`/api/hospital-automation/doctor?doctorId=${doctorId}`);
      if (response.ok) {
        const data = await response.json();
        setPatients(data.patients || []);
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const addMedication = () => {
    setPrescription({
      ...prescription,
      medications: [
        ...prescription.medications,
        { name: '', dosage: '', frequency: '', duration: '', instructions: '' }
      ]
    });
  };

  const updateMedication = (index, field, value) => {
    const newMeds = [...prescription.medications];
    newMeds[index][field] = value;
    setPrescription({ ...prescription, medications: newMeds });
  };

  const removeMedication = (index) => {
    setPrescription({
      ...prescription,
      medications: prescription.medications.filter((_, i) => i !== index)
    });
  };

  const submitPrescription = async () => {
    if (!selectedPatient) return;

    try {
      const response = await fetch('/api/hospital-automation/doctor/prescription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: selectedPatient.patientId,
          appointmentId: selectedPatient.appointmentId,
          doctorId,
          prescription: prescription.medications,
          instructions: prescription.instructions,
          followUp: prescription.followUp
        })
      });

      if (response.ok) {
        alert('Prescription submitted successfully! Forwarded to Pharmacy.');
        setPrescription({ medications: [], instructions: '', followUp: '' });
        setSelectedPatient(null);
        fetchMyPatients();
      }
    } catch (error) {
      console.error('Error submitting prescription:', error);
      alert('Failed to submit prescription');
    }
  };

  const completeConsultation = async () => {
    if (!selectedPatient) return;

    try {
      const response = await fetch('/api/hospital-automation/doctor/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: selectedPatient.patientId,
          appointmentId: selectedPatient.appointmentId,
          doctorId,
          diagnosis: prescription.instructions,
          hasPrescription: prescription.medications.length > 0
        })
      });

      if (response.ok) {
        alert('Consultation completed!');
        setSelectedPatient(null);
        setPrescription({ medications: [], instructions: '', followUp: '' });
        fetchMyPatients();
      }
    } catch (error) {
      console.error('Error completing consultation:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Activity className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Doctor Portal</h1>
          <p className="text-muted-foreground">
            Manage your patients and consultations
          </p>
        </div>
        <Badge variant="default" className="text-lg px-4 py-2">
          <User className="h-4 w-4 mr-2" />
          {doctorId}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patient Queue */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>My Patients Queue</CardTitle>
            <CardDescription>{patients.length} patients waiting</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {patients.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                No patients in queue
              </p>
            ) : (
              patients.map((patient) => (
                <div
                  key={patient.patientId}
                  onClick={() => setSelectedPatient(patient)}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedPatient?.patientId === patient.patientId
                      ? 'border-primary bg-primary/5'
                      : 'hover:bg-muted'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold">{patient.name}</h3>
                    <Badge variant={patient.priority === 'critical' ? 'destructive' : 'default'}>
                      {patient.priority}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {patient.reason}
                  </p>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Clock className="h-3 w-3 mr-1" />
                    {patient.roomId} • Appointment: {patient.appointmentId?.slice(-4)}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Patient Details & Prescription */}
        <Card className="lg:col-span-2">
          {!selectedPatient ? (
            <CardContent className="py-20">
              <div className="text-center text-muted-foreground">
                <User className="h-16 w-16 mx-auto mb-4 opacity-20" />
                <p>Select a patient from the queue to view details</p>
              </div>
            </CardContent>
          ) : (
            <>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-2xl">{selectedPatient.name}</CardTitle>
                    <CardDescription>
                      Patient ID: {selectedPatient.patientId}
                    </CardDescription>
                  </div>
                  <Badge variant={selectedPatient.priority === 'critical' ? 'destructive' : 'default'}>
                    {selectedPatient.priority} Priority
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="details" className="space-y-4">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="details">Patient Details</TabsTrigger>
                    <TabsTrigger value="tests">Lab Results</TabsTrigger>
                    <TabsTrigger value="prescription">Prescription</TabsTrigger>
                  </TabsList>

                  {/* Patient Details Tab */}
                  <TabsContent value="details" className="space-y-4">
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Chief Complaint:</strong> {selectedPatient.reason}
                      </AlertDescription>
                    </Alert>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Triage Assessment</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <Label>Symptoms</Label>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {selectedPatient.symptoms?.map((symptom, idx) => (
                              <Badge key={idx} variant="outline">{symptom}</Badge>
                            )) || <p className="text-sm text-muted-foreground">No symptoms recorded</p>}
                          </div>
                        </div>
                        <div>
                          <Label>Possible Conditions</Label>
                          <ul className="list-disc list-inside text-sm mt-1">
                            {selectedPatient.possibleConditions?.map((condition, idx) => (
                              <li key={idx}>{condition}</li>
                            )) || <li className="text-muted-foreground">No conditions listed</li>}
                          </ul>
                        </div>
                        <div>
                          <Label>Vital Signs</Label>
                          {selectedPatient.vitals ? (
                            <div className="grid grid-cols-2 gap-2 mt-1 text-sm">
                              <div>Temp: {selectedPatient.vitals.temperature}°C</div>
                              <div>BP: {selectedPatient.vitals.blood_pressure}</div>
                              <div>HR: {selectedPatient.vitals.heart_rate} bpm</div>
                              <div>SpO2: {selectedPatient.vitals.oxygen_saturation}%</div>
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground mt-1">No vitals recorded</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Lab Results Tab */}
                  <TabsContent value="tests" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center">
                          <TestTube className="h-5 w-5 mr-2" />
                          Laboratory Results
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {selectedPatient.labResults && selectedPatient.labResults.length > 0 ? (
                          <div className="space-y-4">
                            {selectedPatient.labResults.map((test, idx) => (
                              <div key={idx} className="p-4 border rounded-lg">
                                <div className="flex justify-between items-center mb-2">
                                  <h4 className="font-semibold capitalize">
                                    {test.testType.replace(/_/g, ' ')}
                                  </h4>
                                  {test.abnormal && (
                                    <Badge variant="destructive">Abnormal</Badge>
                                  )}
                                </div>
                                <pre className="text-sm whitespace-pre-wrap bg-muted p-3 rounded">
                                  {JSON.stringify(test.result, null, 2)}
                                </pre>
                                <p className="text-xs text-muted-foreground mt-2">
                                  {test.normalRange}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-center text-muted-foreground py-8">
                            No lab results available yet
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Prescription Tab */}
                  <TabsContent value="prescription" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-lg flex items-center">
                            <Pill className="h-5 w-5 mr-2" />
                            Write Prescription
                          </CardTitle>
                          <Button onClick={addMedication} size="sm">
                            Add Medication
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {prescription.medications.map((med, index) => (
                          <div key={index} className="p-4 border rounded-lg space-y-3">
                            <div className="flex justify-between items-center">
                              <h4 className="font-semibold">Medication {index + 1}</h4>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => removeMedication(index)}
                              >
                                Remove
                              </Button>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <Label>Medicine Name</Label>
                                <Input
                                  value={med.name}
                                  onChange={(e) => updateMedication(index, 'name', e.target.value)}
                                  placeholder="e.g., Paracetamol"
                                />
                              </div>
                              <div>
                                <Label>Dosage</Label>
                                <Input
                                  value={med.dosage}
                                  onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                                  placeholder="e.g., 500mg"
                                />
                              </div>
                              <div>
                                <Label>Frequency</Label>
                                <Input
                                  value={med.frequency}
                                  onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                                  placeholder="e.g., 3x daily"
                                />
                              </div>
                              <div>
                                <Label>Duration</Label>
                                <Input
                                  value={med.duration}
                                  onChange={(e) => updateMedication(index, 'duration', e.target.value)}
                                  placeholder="e.g., 7 days"
                                />
                              </div>
                            </div>
                            <div>
                              <Label>Instructions</Label>
                              <Textarea
                                value={med.instructions}
                                onChange={(e) => updateMedication(index, 'instructions', e.target.value)}
                                placeholder="Special instructions..."
                                rows={2}
                              />
                            </div>
                          </div>
                        ))}

                        <div>
                          <Label>Diagnosis & Notes</Label>
                          <Textarea
                            value={prescription.instructions}
                            onChange={(e) => setPrescription({ ...prescription, instructions: e.target.value })}
                            placeholder="Enter diagnosis, recommendations, and general instructions..."
                            rows={4}
                          />
                        </div>

                        <div>
                          <Label>Follow-up</Label>
                          <Input
                            value={prescription.followUp}
                            onChange={(e) => setPrescription({ ...prescription, followUp: e.target.value })}
                            placeholder="e.g., Follow-up in 1 week"
                          />
                        </div>

                        <div className="flex gap-3 pt-4">
                          <Button
                            onClick={submitPrescription}
                            className="flex-1"
                            disabled={prescription.medications.length === 0}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Submit Prescription to Pharmacy
                          </Button>
                          <Button
                            onClick={completeConsultation}
                            variant="outline"
                            className="flex-1"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Complete Consultation
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
