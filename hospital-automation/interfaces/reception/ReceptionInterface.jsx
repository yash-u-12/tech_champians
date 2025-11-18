'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Clock, 
  AlertTriangle, 
  Activity,
  UserCheck,
  MapPin
} from 'lucide-react';

export default function ReceptionInterface({ receptionistId }) {
  const [patients, setPatients] = useState([]);
  const [queue, setQueue] = useState([]);
  const [stats, setStats] = useState({
    totalRegistered: 0,
    inQueue: 0,
    emergencies: 0,
    averageWaitTime: 0
  });

  useEffect(() => {
    fetchReceptionData();
    const interval = setInterval(fetchReceptionData, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchReceptionData = async () => {
    try {
      const response = await fetch('/api/hospital-automation/reception');
      if (response.ok) {
        const data = await response.json();
        setPatients(data.patients || []);
        setQueue(data.queue || []);
        setStats(data.stats || stats);
      }
    } catch (error) {
      console.error('Error fetching reception data:', error);
    }
  };

  const getUrgencyBadge = (urgency) => {
    const variants = {
      critical: 'destructive',
      urgent: 'secondary',
      high: 'default',
      normal: 'outline'
    };
    return <Badge variant={variants[urgency] || 'outline'}>{urgency}</Badge>;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Reception Dashboard</h1>
          <p className="text-muted-foreground">Patient registration and queue management</p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          <UserCheck className="h-4 w-4 mr-2" />
          {receptionistId}
        </Badge>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Registered</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">{stats.totalRegistered}</div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">In Queue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">{stats.inQueue}</div>
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Emergencies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-red-600">{stats.emergencies}</div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Avg Wait Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">{stats.averageWaitTime}m</div>
              <Activity className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Patient Queue */}
      <Card>
        <CardHeader>
          <CardTitle>Patient Queue</CardTitle>
          <CardDescription>Patients waiting for triage and consultation</CardDescription>
        </CardHeader>
        <CardContent>
          {queue.length > 0 ? (
            <div className="space-y-4">
              {queue.map((patientId, idx) => {
                const patient = patients.find(p => p.patientId === patientId);
                if (!patient) return null;
                
                return (
                  <div key={patientId} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="text-2xl font-bold text-muted-foreground">#{idx + 1}</div>
                      <div>
                        <h4 className="font-semibold">{patient.name}</h4>
                        <p className="text-sm text-muted-foreground">{patient.reason}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Wait Time</p>
                        <p className="font-semibold">{patient.waitTime || 0} min</p>
                      </div>
                      {getUrgencyBadge(patient.urgency)}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No patients in queue</p>
          )}
        </CardContent>
      </Card>

      {/* All Registered Patients */}
      <Card>
        <CardHeader>
          <CardTitle>All Registered Patients Today</CardTitle>
          <CardDescription>Complete list of checked-in patients</CardDescription>
        </CardHeader>
        <CardContent>
          {patients.length > 0 ? (
            <div className="space-y-3">
              {patients.map((patient, index) => (
                <div key={`${patient.patientId}-${index}-${patient.arrivalTime}`} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold">{patient.name}</h4>
                      <p className="text-sm text-muted-foreground">{patient.reason}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getUrgencyBadge(patient.urgency)}
                      <Badge variant="outline">{patient.status}</Badge>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm mt-3">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{new Date(patient.arrivalTime).toLocaleTimeString()}</span>
                    </div>
                    {patient.roomId && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{patient.roomId}</span>
                      </div>
                    )}
                    {patient.doctorName && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Doctor: </span>
                        <span className="font-medium">{patient.doctorName}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No patients registered yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
