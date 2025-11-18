'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Activity, 
  Users, 
  DollarSign, 
  Package, 
  TestTube, 
  Calendar,
  ArrowUpRight,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

export default function HospitalAutomationDashboard() {
  const [systemStatus, setSystemStatus] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [statusRes, metricsRes] = await Promise.all([
        fetch('/api/hospital-automation?type=status'),
        fetch('/api/hospital-automation?type=metrics')
      ]);

      if (statusRes.ok && metricsRes.ok) {
        setSystemStatus(await statusRes.json());
        setMetrics(await metricsRes.json());
        setError(null);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePatientCheckIn = async () => {
    try {
      const response = await fetch('/api/hospital-automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'patient-checkin',
          data: {
            patientId: `P${Date.now()}`,
            name: 'Test Patient',
            reason: 'Test checkup',
            isEmergency: false
          }
        })
      });

      if (response.ok) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Activity className="h-12 w-12 animate-spin mx-auto mb-4" />
          <p>Loading Hospital Automation System...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="m-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Error: {error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Hospital Automation Dashboard</h1>
          <p className="text-muted-foreground">
            AI-Powered Multi-Agent Hospital Management System
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <Badge variant={systemStatus?.isRunning ? 'default' : 'destructive'}>
            {systemStatus?.isRunning ? 'Online' : 'Offline'}
          </Badge>
          <Button onClick={handlePatientCheckIn}>
            Simulate Patient Check-In
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Patients Waiting</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.patients?.waiting || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics?.patients?.inConsultation || 0} in consultation
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue Today</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${metrics?.financial?.totalBilled || '0.00'}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics?.financial?.invoiceCount?.paid || 0} invoices paid
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lab Tests</CardTitle>
            <TestTube className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.laboratory?.completedToday || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics?.laboratory?.pendingOrders || 0} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {systemStatus?.activeAgents || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              All systems operational
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Information Tabs */}
      <Tabs defaultValue="agents" className="space-y-4">
        <TabsList>
          <TabsTrigger value="agents">Agents</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="pharmacy">Pharmacy</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
        </TabsList>

        <TabsContent value="agents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Agent Status</CardTitle>
              <CardDescription>Real-time status of all AI agents</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {systemStatus?.agents && Object.entries(systemStatus.agents).map(([name, status]) => (
                  <div key={name} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="font-medium">{name}</p>
                        <p className="text-sm text-muted-foreground">
                          Queue: {status.queueLength} messages
                        </p>
                      </div>
                    </div>
                    <Badge>{status.state}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resources" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Doctors Availability</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {metrics?.resources?.doctors && Object.entries(metrics.resources.doctors).map(([specialty, stats]) => (
                    <div key={specialty} className="flex justify-between items-center">
                      <span className="capitalize">{specialty}</span>
                      <span className="text-sm">
                        {stats.available}/{stats.total} available
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Rooms Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>Total Rooms</span>
                    <span className="font-bold">{metrics?.resources?.rooms?.total || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-green-600">Available</span>
                    <span className="font-bold">{metrics?.resources?.rooms?.available || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-orange-600">Occupied</span>
                    <span className="font-bold">{metrics?.resources?.rooms?.occupied || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="pharmacy" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pharmacy Inventory</CardTitle>
              <CardDescription>Medication stock status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <Package className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                    <p className="text-2xl font-bold">{metrics?.pharmacy?.totalItems || 0}</p>
                    <p className="text-sm text-muted-foreground">Total Items</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2 text-orange-500" />
                    <p className="text-2xl font-bold">{metrics?.pharmacy?.lowStock?.length || 0}</p>
                    <p className="text-sm text-muted-foreground">Low Stock</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2 text-red-500" />
                    <p className="text-2xl font-bold">{metrics?.pharmacy?.outOfStock?.length || 0}</p>
                    <p className="text-sm text-muted-foreground">Out of Stock</p>
                  </div>
                </div>

                {metrics?.pharmacy?.lowStock?.length > 0 && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Low Stock Alert:</strong> {metrics.pharmacy.lowStock.length} items need reordering
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financial" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Financial Summary</CardTitle>
              <CardDescription>Today's financial overview</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 border rounded-lg">
                  <span>Total Billed</span>
                  <span className="text-lg font-bold">${metrics?.financial?.totalBilled || '0.00'}</span>
                </div>
                <div className="flex justify-between items-center p-3 border rounded-lg">
                  <span>Total Paid</span>
                  <span className="text-lg font-bold text-green-600">${metrics?.financial?.totalPaid || '0.00'}</span>
                </div>
                <div className="flex justify-between items-center p-3 border rounded-lg">
                  <span>Outstanding</span>
                  <span className="text-lg font-bold text-orange-600">${metrics?.financial?.outstanding || '0.00'}</span>
                </div>
                <div className="flex justify-between items-center p-3 border rounded-lg">
                  <span>Average Invoice</span>
                  <span className="text-lg font-bold">${metrics?.financial?.averageInvoiceAmount || '0.00'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
