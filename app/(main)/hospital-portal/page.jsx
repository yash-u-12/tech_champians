'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import DoctorInterface from '../../../hospital-automation/interfaces/doctor/DoctorInterface';
import PatientInterface from '../../../hospital-automation/interfaces/patient/PatientInterface';
import PharmacyInterface from '../../../hospital-automation/interfaces/pharmacy/PharmacyInterface';
import ReceptionInterface from '../../../hospital-automation/interfaces/reception/ReceptionInterface';
import LabInterface from '../../../hospital-automation/interfaces/lab/LabInterface';
import BillingInterface from '../../../hospital-automation/interfaces/billing/BillingInterface';
import { User, Stethoscope, Pill, Activity, UserCheck, TestTube, CreditCard } from 'lucide-react';

export default function HospitalPortalPage() {
  const [userRole, setUserRole] = useState(null);
  const [userId, setUserId] = useState(null);
  const searchParams = useSearchParams();
  const [prefill, setPrefill] = useState({ name: '', reason: '' });
  const { user } = useUser();

  // Generate a demo user ID if not set
  useEffect(() => {
    if (!userId) {
      setUserId(`USER${Date.now()}`);
    }
  }, []);

  // Preselect role from query string (e.g., ?role=patient)
  useEffect(() => {
    const role = (searchParams?.get('role') || '').toLowerCase();
    if (['doctor', 'patient', 'pharmacy', 'reception', 'lab', 'billing'].includes(role)) {
      setUserRole(role);
    }
    const name = searchParams?.get('name') || '';
    const reason = searchParams?.get('reason') || '';
    if (name || reason) setPrefill({ name, reason });
  }, [searchParams]);

  // Force role based on Clerk public metadata if present
  useEffect(() => {
    const metaRole = (user?.publicMetadata?.role || '').toString().toLowerCase();
    if (['patient', 'doctor', 'pharmacy', 'reception', 'lab', 'billing'].includes(metaRole)) {
      setUserRole(metaRole);
    }
  }, [user]);

  // Role selector for demo/testing purposes
  const selectRole = (role) => {
    setUserRole(role);
  };

  // If no role is set, show role selector
  if (!userRole) {
    return (
      <div className="container mx-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold">Hospital Automation Portal</h1>
            <p className="text-muted-foreground">
              Select your role to access the appropriate interface
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-3">
            {/* Doctor Card */}
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => selectRole('doctor')}>
              <CardHeader>
                <div className="flex justify-center mb-4">
                  <div className="p-4 bg-blue-100 rounded-full">
                    <Stethoscope className="h-12 w-12 text-blue-600" />
                  </div>
                </div>
                <CardTitle className="text-center">Doctor</CardTitle>
                <CardDescription className="text-center">
                  View patients, write prescriptions, manage consultations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">
                  Access Doctor Portal
                </Button>
              </CardContent>
            </Card>

            {/* Patient Card */}
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => selectRole('patient')}>
              <CardHeader>
                <div className="flex justify-center mb-4">
                  <div className="p-4 bg-green-100 rounded-full">
                    <User className="h-12 w-12 text-green-600" />
                  </div>
                </div>
                <CardTitle className="text-center">Patient</CardTitle>
                <CardDescription className="text-center">
                  Check-in, track consultation, view lab results and prescriptions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">
                  Access Patient Portal
                </Button>
              </CardContent>
            </Card>

            {/* Pharmacy Card */}
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => selectRole('pharmacy')}>
              <CardHeader>
                <div className="flex justify-center mb-4">
                  <div className="p-4 bg-purple-100 rounded-full">
                    <Pill className="h-12 w-12 text-purple-600" />
                  </div>
                </div>
                <CardTitle className="text-center">Pharmacy</CardTitle>
                <CardDescription className="text-center">
                  Process prescriptions, manage inventory, dispense medications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">
                  Access Pharmacy Portal
                </Button>
              </CardContent>
            </Card>

            {/* Reception Card */}
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => selectRole('reception')}>
              <CardHeader>
                <div className="flex justify-center mb-4">
                  <div className="p-4 bg-orange-100 rounded-full">
                    <UserCheck className="h-12 w-12 text-orange-600" />
                  </div>
                </div>
                <CardTitle className="text-center">Reception</CardTitle>
                <CardDescription className="text-center">
                  Monitor patient queue, registrations, and wait times
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">
                  Access Reception Portal
                </Button>
              </CardContent>
            </Card>

            {/* Lab Card */}
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => selectRole('lab')}>
              <CardHeader>
                <div className="flex justify-center mb-4">
                  <div className="p-4 bg-cyan-100 rounded-full">
                    <TestTube className="h-12 w-12 text-cyan-600" />
                  </div>
                </div>
                <CardTitle className="text-center">Laboratory</CardTitle>
                <CardDescription className="text-center">
                  Process test orders, generate results, manage specimens
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">
                  Access Lab Portal
                </Button>
              </CardContent>
            </Card>

            {/* Billing Card */}
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => selectRole('billing')}>
              <CardHeader>
                <div className="flex justify-center mb-4">
                  <div className="p-4 bg-yellow-100 rounded-full">
                    <CreditCard className="h-12 w-12 text-yellow-600" />
                  </div>
                </div>
                <CardTitle className="text-center">Billing</CardTitle>
                <CardDescription className="text-center">
                  Manage invoices, payments, and financial records
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">
                  Access Billing Portal
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-secondary/20">
            <CardHeader>
              <CardTitle className="text-lg">How It Works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                <strong>🏥 Integrated Hospital Automation:</strong> All roles work together seamlessly
              </p>
              <p>
                <strong>🤖 AI-Powered Agents:</strong> 6 AI agents coordinate patient care automatically
              </p>
              <p>
                <strong>📋 Patient Journey:</strong> Check-in → Triage → Doctor → Lab Tests → Pharmacy → Billing
              </p>
              <p>
                <strong>💊 Smart Prescriptions:</strong> Doctor prescriptions automatically forwarded to pharmacy with billing
              </p>
              <p>
                <strong>📊 Real-time Updates:</strong> All interfaces update in real-time as patient progresses
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Render appropriate interface based on role
  return (
    <div>
      {/* Role Badge */}
      <div className="fixed top-4 right-4 z-50">
        <Badge 
          variant="outline" 
          className="bg-background text-lg px-4 py-2 cursor-pointer"
          onClick={() => setUserRole(null)}
        >
          {userRole === 'doctor' && <Stethoscope className="h-4 w-4 mr-2" />}
          {userRole === 'patient' && <User className="h-4 w-4 mr-2" />}
          {userRole === 'pharmacy' && <Pill className="h-4 w-4 mr-2" />}
          {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
          <span className="ml-2 text-xs">(Click to change)</span>
        </Badge>
      </div>

      {/* Render Interface */}
      {userRole === 'doctor' && <DoctorInterface userId={userId} />}
      {userRole === 'patient' && (
        <PatientInterface userId={userId} defaultName={prefill.name} defaultReason={prefill.reason} />
      )}
      {userRole === 'pharmacy' && <PharmacyInterface pharmacistId={userId} />}
      {userRole === 'reception' && <ReceptionInterface receptionistId={userId} />}
      {userRole === 'lab' && <LabInterface labTechId={userId} />}
      {userRole === 'billing' && <BillingInterface billingStaffId={userId} />}
    </div>
  );
}
