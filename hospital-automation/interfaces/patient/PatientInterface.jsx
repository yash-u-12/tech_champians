'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  User, 
  Calendar,
  Clock,
  AlertCircle,
  FileText,
  Pill,
  TestTube,
  CreditCard,
  MapPin,
  Activity,
  CheckCircle
} from 'lucide-react';
import { getPatientAppointments } from '@/actions/patient';

export default function PatientInterface({ userId, defaultName = '', defaultReason = '' }) {
  const [patientData, setPatientData] = useState(null);
  const [appointmentStatus, setAppointmentStatus] = useState(null);
  const [allAppointments, setAllAppointments] = useState([]);
  const [visitHistory, setVisitHistory] = useState([]);
  const [checkInForm, setCheckInForm] = useState({
    name: '',
    reason: '',
    isEmergency: false
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchPatientStatus();
      fetchAllAppointments();
      const interval = setInterval(fetchPatientStatus, 5000);
      return () => clearInterval(interval);
    }
  }, [userId]);

  // Prefill form from defaults on first render when not yet checked in
  useEffect(() => {
    setCheckInForm((prev) => ({
      ...prev,
      name: prev.name || defaultName || '',
      reason: prev.reason || defaultReason || '',
    }));
  }, [defaultName, defaultReason]);

  const fetchAllAppointments = async () => {
    try {
      const result = await getPatientAppointments();
      if (result.appointments) {
        setAllAppointments(result.appointments);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
    }
  };

  const fetchPatientStatus = async () => {
    try {
      const response = await fetch(`/api/hospital-automation/patient?patientId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        console.log('Patient API Response:', data);
        if (data.success) {
          console.log('Setting patient data:', data.patient);
          setPatientData(data.patient);
          setAppointmentStatus(data.status);
          if (data.history) {
            setVisitHistory(data.history);
          }
        } else if (data.noActiveAppointment) {
          // No active appointment - clear current data but keep history
          console.log('No active appointment');
          setPatientData(null);
          setAppointmentStatus(null);
          if (data.history) {
            setVisitHistory(data.history);
          }
        }
      } else {
        // Clear data on error
        console.log('API error:', response.status);
        setPatientData(null);
        setAppointmentStatus(null);
      }
    } catch (error) {
      console.error('Error fetching patient status:', error);
      setPatientData(null);
      setAppointmentStatus(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/hospital-automation/patient/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: userId,
          ...checkInForm
        })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        alert('Check-in successful! Please wait for your turn.');
        setCheckInForm({ name: '', reason: '', isEmergency: false });
        fetchPatientStatus();
      } else if (data.existingAppointment) {
        alert(data.error || 'You already have an active appointment.');
        fetchPatientStatus(); // Refresh to show existing appointment
      } else {
        alert(data.error || 'Check-in failed. Please try again.');
      }
    } catch (error) {
      console.error('Error checking in:', error);
      alert('Check-in failed. Please try again.');
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      waiting: 'default',
      in_triage: 'secondary',
      in_consultation: 'default',
      lab_tests: 'secondary',
      ready_for_pharmacy: 'default',
      completed: 'default'
    };

    const labels = {
      waiting: 'Waiting in Queue',
      in_triage: 'In Triage',
      in_consultation: 'With Doctor',
      lab_tests: 'Lab Tests Pending',
      ready_for_pharmacy: 'Ready for Pharmacy',
      completed: 'Completed'
    };

    return (
      <Badge variant={variants[status] || 'default'}>
        {labels[status] || status}
      </Badge>
    );
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
          <h1 className="text-3xl font-bold">Patient Portal</h1>
          <p className="text-muted-foreground">Track your hospital visit</p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          <User className="h-4 w-4 mr-2" />
          {userId}
        </Badge>
      </div>

      {/* Check-in Form or Status */}
      {!patientData ? (
        <Card>
          <CardHeader>
            <CardTitle>Check-In for Consultation</CardTitle>
            <CardDescription>Fill in your details to check-in</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCheckIn} className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={checkInForm.name}
                  onChange={(e) => setCheckInForm({ ...checkInForm, name: e.target.value })}
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div>
                <Label htmlFor="reason">Reason for Visit</Label>
                <Textarea
                  id="reason"
                  value={checkInForm.reason}
                  onChange={(e) => setCheckInForm({ ...checkInForm, reason: e.target.value })}
                  placeholder="Describe your symptoms or reason for visit..."
                  rows={4}
                  required
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="emergency"
                  checked={checkInForm.isEmergency}
                  onChange={(e) => setCheckInForm({ ...checkInForm, isEmergency: e.target.checked })}
                  className="h-4 w-4"
                />
                <Label htmlFor="emergency" className="text-sm font-normal">
                  This is an emergency (chest pain, severe bleeding, difficulty breathing, etc.)
                </Label>
              </div>

              <Button type="submit" className="w-full">
                <CheckCircle className="h-4 w-4 mr-2" />
                Check-In Now
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Status Overview */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Current Status</CardTitle>
              </CardHeader>
              <CardContent>
                {getStatusBadge(appointmentStatus?.status || 'waiting')}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Queue Position</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  #{appointmentStatus?.queuePosition || 'N/A'}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Wait Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {appointmentStatus?.waitTime || '0'} min
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Priority</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant={patientData.urgency === 'critical' ? 'destructive' : 'default'}>
                  {patientData.urgency || 'Normal'}
                </Badge>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Tabs */}
          <Tabs defaultValue="journey" className="space-y-4">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="journey">Journey</TabsTrigger>
              <TabsTrigger value="appointments">My Appointments</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="tests">Lab Tests</TabsTrigger>
              <TabsTrigger value="prescription">Prescription</TabsTrigger>
              <TabsTrigger value="billing">Billing</TabsTrigger>
            </TabsList>

            {/* Journey Tab */}
            <TabsContent value="journey">
              <Card>
                <CardHeader>
                  <CardTitle>Your Hospital Journey</CardTitle>
                  <CardDescription>Track your progress through the hospital</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { step: 'Registration', status: 'completed', icon: CheckCircle, time: patientData.arrivalTime },
                      { step: 'Triage Assessment', status: appointmentStatus?.triageComplete ? 'completed' : 'pending', icon: Activity },
                      { step: 'Doctor Consultation', status: appointmentStatus?.consultationStarted ? 'in_progress' : 'pending', icon: User, location: patientData.roomId },
                      { step: 'Lab Tests', status: appointmentStatus?.labTestsComplete ? 'completed' : 'pending', icon: TestTube },
                      { step: 'Pharmacy', status: appointmentStatus?.prescriptionReady ? 'ready' : 'pending', icon: Pill },
                      { step: 'Billing & Checkout', status: appointmentStatus?.billingComplete ? 'completed' : 'pending', icon: CreditCard }
                    ].map((item, idx) => {
                      const Icon = item.icon;
                      return (
                        <div key={idx} className="flex items-center gap-4 p-4 border rounded-lg">
                          <div className={`p-3 rounded-full ${
                            item.status === 'completed' ? 'bg-green-100 text-green-600' :
                            item.status === 'in_progress' ? 'bg-blue-100 text-blue-600' :
                            item.status === 'ready' ? 'bg-yellow-100 text-yellow-600' :
                            'bg-gray-100 text-gray-400'
                          }`}>
                            <Icon className="h-6 w-6" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold">{item.step}</h4>
                            {item.location && <p className="text-sm text-muted-foreground">Location: {item.location}</p>}
                            {item.time && <p className="text-xs text-muted-foreground">{new Date(item.time).toLocaleTimeString()}</p>}
                          </div>
                          <Badge variant={
                            item.status === 'completed' ? 'default' :
                            item.status === 'in_progress' ? 'default' :
                            item.status === 'ready' ? 'secondary' :
                            'outline'
                          }>
                            {item.status === 'in_progress' ? 'In Progress' : 
                             item.status === 'ready' ? 'Ready' :
                             item.status === 'completed' ? 'Completed' : 'Pending'}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* My Appointments Tab */}
            <TabsContent value="appointments">
              <Card>
                <CardHeader>
                  <CardTitle>My Appointments & Visit History</CardTitle>
                  <CardDescription>View your scheduled appointments and walk-in visit history</CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Current Active Appointment */}
                  {patientData && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold mb-3 flex items-center">
                        <Activity className="h-5 w-5 mr-2 text-green-600" />
                        Current Visit
                      </h3>
                      <Card className="border-2 border-green-500/20 bg-green-50/50">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="font-semibold text-lg">{patientData.name}</h4>
                              <p className="text-sm text-muted-foreground">{patientData.reason}</p>
                            </div>
                            <Badge variant={appointmentStatus?.status === 'completed' ? 'default' : 'secondary'} className="text-sm">
                              {appointmentStatus?.status?.replace('_', ' ').toUpperCase() || 'ACTIVE'}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <Label className="text-xs text-muted-foreground">Appointment ID</Label>
                              <p className="font-mono text-xs">{patientData.appointmentId}</p>
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Urgency</Label>
                              <p><Badge variant={patientData.urgency === 'critical' ? 'destructive' : 'outline'}>{patientData.urgency}</Badge></p>
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Doctor</Label>
                              <p>{patientData.doctorName}</p>
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Location</Label>
                              <p className="flex items-center">
                                <MapPin className="h-3 w-3 mr-1" />
                                {patientData.roomId}
                              </p>
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Arrival Time</Label>
                              <p className="flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                {new Date(patientData.arrivalTime).toLocaleTimeString()}
                              </p>
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Wait Time</Label>
                              <p>{appointmentStatus?.waitTime || 0} minutes</p>
                            </div>
                          </div>

                          {/* Progress Indicators */}
                          <div className="mt-4 pt-3 border-t">
                            <Label className="text-xs text-muted-foreground mb-2 block">Visit Progress</Label>
                            <div className="flex gap-2 flex-wrap">
                              <Badge variant={appointmentStatus?.triageComplete ? 'default' : 'outline'} className="text-xs">
                                {appointmentStatus?.triageComplete ? '✓' : '○'} Triage
                              </Badge>
                              <Badge variant={appointmentStatus?.consultationStarted ? 'default' : 'outline'} className="text-xs">
                                {appointmentStatus?.consultationStarted ? '✓' : '○'} Consultation
                              </Badge>
                              <Badge variant={appointmentStatus?.labTestsComplete ? 'default' : 'outline'} className="text-xs">
                                {appointmentStatus?.labTestsComplete ? '✓' : '○'} Lab Tests
                              </Badge>
                              <Badge variant={appointmentStatus?.prescriptionReady ? 'default' : 'outline'} className="text-xs">
                                {appointmentStatus?.prescriptionReady ? '✓' : '○'} Prescription
                              </Badge>
                              <Badge variant={appointmentStatus?.medicationsCollected ? 'default' : 'outline'} className="text-xs">
                                {appointmentStatus?.medicationsCollected ? '✓' : '○'} Pharmacy
                              </Badge>
                              <Badge variant={appointmentStatus?.billingComplete ? 'default' : 'outline'} className="text-xs">
                                {appointmentStatus?.billingComplete ? '✓' : '○'} Billing
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* Walk-in Visit History */}
                  {visitHistory.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold mb-3 flex items-center">
                        <Activity className="h-5 w-5 mr-2" />
                        Walk-in Visits
                      </h3>
                      <div className="space-y-4">
                        {visitHistory.slice().reverse().map((visit, idx) => (
                          <div key={visit.appointmentId || idx} className="p-4 border rounded-lg bg-muted/30">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h4 className="font-semibold">{visit.name}</h4>
                                <p className="text-sm text-muted-foreground">{visit.reason}</p>
                              </div>
                              <Badge variant={visit.status === 'completed' ? 'default' : visit.status === 'in_consultation' ? 'secondary' : 'outline'}>
                                {visit.status?.replace('_', ' ')}
                              </Badge>
                            </div>
                            <div className="text-sm space-y-1">
                              <p className="flex items-center">
                                <Calendar className="h-4 w-4 mr-2" />
                                {new Date(visit.arrivalTime).toLocaleDateString()}
                              </p>
                              <p className="flex items-center">
                                <Clock className="h-4 w-4 mr-2" />
                                {new Date(visit.arrivalTime).toLocaleTimeString()}
                              </p>
                              {visit.doctorName && (
                                <p className="flex items-center">
                                  <User className="h-4 w-4 mr-2" />
                                  {visit.doctorName}
                                </p>
                              )}
                              {visit.roomId && (
                                <p className="flex items-center">
                                  <MapPin className="h-4 w-4 mr-2" />
                                  {visit.roomId}
                                </p>
                              )}
                              {visit.prescription && (
                                <p className="text-xs text-green-600 mt-2 flex items-center">
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Prescription issued
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Scheduled Appointments */}
                  {allAppointments.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3 flex items-center">
                        <Calendar className="h-5 w-5 mr-2" />
                        Scheduled Appointments
                      </h3>
                      <div className="space-y-4">
                        {allAppointments.map((appointment) => (
                        <Card key={appointment.id} className="overflow-hidden">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex items-center gap-3">
                                {appointment.doctor.imageUrl && (
                                  <img 
                                    src={appointment.doctor.imageUrl} 
                                    alt={appointment.doctor.name}
                                    className="w-12 h-12 rounded-full object-cover"
                                  />
                                )}
                                <div>
                                  <h3 className="font-semibold text-lg">Dr. {appointment.doctor.name}</h3>
                                  <p className="text-sm text-muted-foreground">{appointment.doctor.specialty}</p>
                                </div>
                              </div>
                              <Badge variant={
                                appointment.status === 'COMPLETED' ? 'default' :
                                appointment.status === 'SCHEDULED' ? 'secondary' :
                                appointment.status === 'CANCELLED' ? 'destructive' : 'outline'
                              }>
                                {appointment.status}
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span>{new Date(appointment.startTime).toLocaleDateString()}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span>{new Date(appointment.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                            </div>

                            {appointment.patientDescription && (
                              <div className="mt-3 pt-3 border-t">
                                <p className="text-sm text-muted-foreground">
                                  <strong>Reason:</strong> {appointment.patientDescription}
                                </p>
                              </div>
                            )}

                            {appointment.doctorNotes && (
                              <div className="mt-2">
                                <p className="text-sm text-muted-foreground">
                                  <strong>Notes:</strong> {appointment.doctorNotes}
                                </p>
                              </div>
                            )}

                            {appointment.meetingLink && appointment.status === 'SCHEDULED' && (
                              <div className="mt-3">
                                <Button 
                                  onClick={() => window.open(appointment.meetingLink, '_blank')}
                                  className="w-full"
                                  variant="outline"
                                >
                                  Join Video Call
                                </Button>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                      </div>
                    </div>
                  )}

                  {allAppointments.length === 0 && visitHistory.length === 0 && (
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                      <p className="text-muted-foreground">No appointments or visits found</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Check in for a walk-in visit or book an appointment with a doctor
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Details Tab */}
            <TabsContent value="details">
              <Card>
                <CardHeader>
                  <CardTitle>Visit Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Patient Name</Label>
                    <p className="text-lg font-medium">{patientData?.name || 'Not available'}</p>
                  </div>
                  <div>
                    <Label>Patient ID</Label>
                    <p className="text-sm font-mono">{patientData?.patientId || userId}</p>
                  </div>
                  <div>
                    <Label>Chief Complaint</Label>
                    <p className="text-sm">{patientData?.reason || 'Not specified'}</p>
                  </div>
                  <div>
                    <Label>Assigned Doctor</Label>
                    <p className="text-sm">{patientData?.doctorName || 'Not assigned yet'}</p>
                  </div>
                  <div>
                    <Label>Room / Location</Label>
                    <p className="text-sm flex items-center">
                      <MapPin className="h-4 w-4 mr-2" />
                      {patientData?.roomId || 'Waiting area'}
                    </p>
                  </div>
                  <div>
                    <Label>Appointment ID</Label>
                    <p className="text-sm font-mono">{patientData?.appointmentId || 'Pending'}</p>
                  </div>
                  <div>
                    <Label>Urgency Level</Label>
                    <Badge variant={patientData?.urgency === 'critical' ? 'destructive' : 'default'}>
                      {patientData?.urgency || 'Normal'}
                    </Badge>
                  </div>
                  <div>
                    <Label>Arrival Time</Label>
                    <p className="text-sm">
                      {patientData?.arrivalTime 
                        ? new Date(patientData.arrivalTime).toLocaleString() 
                        : 'Not available'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Lab Tests Tab */}
            <TabsContent value="tests">
              <Card>
                <CardHeader>
                  <CardTitle>Laboratory Tests</CardTitle>
                </CardHeader>
                <CardContent>
                  {appointmentStatus?.labResults && appointmentStatus.labResults.length > 0 ? (
                    <div className="space-y-4">
                      {appointmentStatus.labResults.map((test, idx) => (
                        <div key={idx} className="p-4 border rounded-lg">
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="font-semibold capitalize">
                              {test.testType.replace(/_/g, ' ')}
                            </h4>
                            <Badge variant={test.abnormal ? 'destructive' : 'default'}>
                              {test.abnormal ? 'Abnormal' : 'Normal'}
                            </Badge>
                          </div>
                          <Alert>
                            <AlertDescription>
                              Results will be discussed with your doctor during consultation.
                            </AlertDescription>
                          </Alert>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      No lab tests ordered yet
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Prescription Tab */}
            <TabsContent value="prescription">
              <Card>
                <CardHeader>
                  <CardTitle>Prescription</CardTitle>
                </CardHeader>
                <CardContent>
                  {appointmentStatus?.prescription && appointmentStatus.prescription.length > 0 ? (
                    <div className="space-y-4">
                      {appointmentStatus.prescription.map((med, idx) => (
                        <div key={idx} className="p-4 border rounded-lg">
                          <h4 className="font-semibold text-lg mb-2">{med.name}</h4>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div><strong>Dosage:</strong> {med.dosage}</div>
                            <div><strong>Frequency:</strong> {med.frequency}</div>
                            <div><strong>Duration:</strong> {med.duration}</div>
                          </div>
                          {med.instructions && (
                            <p className="text-sm text-muted-foreground mt-2">
                              <strong>Instructions:</strong> {med.instructions}
                            </p>
                          )}
                        </div>
                      ))}
                      
                      {appointmentStatus.prescriptionReady && !appointmentStatus.medicationsCollected && (
                        <Alert>
                          <CheckCircle className="h-4 w-4" />
                          <AlertDescription>
                            Your prescription is ready! Please collect your medications from the pharmacy counter.
                          </AlertDescription>
                        </Alert>
                      )}
                      
                      {appointmentStatus.medicationsCollected && (
                        <Alert className="bg-green-50 border-green-200">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <AlertDescription className="text-green-800">
                            ✓ Medications collected from pharmacy
                            {appointmentStatus.collectionTime && (
                              <span className="block text-xs mt-1">
                                Collected at: {new Date(appointmentStatus.collectionTime).toLocaleString()}
                              </span>
                            )}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      No prescription available yet
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Billing Tab */}
            <TabsContent value="billing">
              <Card>
                <CardHeader>
                  <CardTitle>Billing Information</CardTitle>
                </CardHeader>
                <CardContent>
                  {appointmentStatus?.invoice ? (
                    <div className="space-y-4">
                      <div className="border-b pb-4">
                        {appointmentStatus.invoice.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between py-2">
                            <span>{item.description}</span>
                            <span className="font-medium">${item.amount.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Subtotal:</span>
                          <span>${appointmentStatus.invoice.subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Tax:</span>
                          <span>${appointmentStatus.invoice.tax.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold border-t pt-2">
                          <span>Total:</span>
                          <span>${appointmentStatus.invoice.total.toFixed(2)}</span>
                        </div>
                      </div>
                      
                      <Badge variant={appointmentStatus.invoice.status === 'paid' ? 'default' : 'secondary'}>
                        {appointmentStatus.invoice.status === 'paid' ? 'Paid' : 'Pending Payment'}
                      </Badge>
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      Billing information will be available after consultation
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
