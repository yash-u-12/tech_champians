'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TestTube, Clock, CheckCircle, AlertCircle, Beaker } from 'lucide-react';

export default function LabInterface({ labTechId }) {
  const [testOrders, setTestOrders] = useState([]);
  const [completedTests, setCompletedTests] = useState([]);
  const [stats, setStats] = useState({
    pending: 0,
    completed: 0,
    urgent: 0
  });

  useEffect(() => {
    fetchLabData();
    const interval = setInterval(fetchLabData, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchLabData = async () => {
    try {
      const response = await fetch('/api/hospital-automation/lab');
      if (response.ok) {
        const data = await response.json();
        setTestOrders(data.pending || []);
        setCompletedTests(data.completed || []);
        setStats(data.stats || stats);
      }
    } catch (error) {
      console.error('Error fetching lab data:', error);
    }
  };

  const processTest = async (patientId) => {
    try {
      const response = await fetch('/api/hospital-automation/lab/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId, labTechId })
      });
      if (response.ok) {
        fetchLabData();
      }
    } catch (error) {
      console.error('Error processing test:', error);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Laboratory Dashboard</h1>
          <p className="text-muted-foreground">Test orders and results management</p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          <Beaker className="h-4 w-4 mr-2" />
          {labTechId}
        </Badge>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pending Tests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">{stats.pending}</div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">{stats.completed}</div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Urgent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-red-600">{stats.urgent}</div>
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Test Orders */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Test Orders</CardTitle>
          <CardDescription>Tests waiting to be processed</CardDescription>
        </CardHeader>
        <CardContent>
          {testOrders.length > 0 ? (
            <div className="space-y-4">
              {testOrders.map((order) => (
                <div key={order.patientId} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold">{order.patientName}</h4>
                      <p className="text-sm text-muted-foreground">Patient ID: {order.patientId}</p>
                    </div>
                    <Badge variant={order.urgency === 'urgent' ? 'destructive' : 'secondary'}>
                      {order.urgency}
                    </Badge>
                  </div>
                  <div className="mb-3">
                    <p className="text-sm font-medium mb-2">Tests Ordered:</p>
                    <div className="flex flex-wrap gap-2">
                      {order.tests?.map((test, idx) => (
                        <Badge key={idx} variant="outline">
                          <TestTube className="h-3 w-3 mr-1" />
                          {test.replace('_', ' ')}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Button onClick={() => processTest(order.patientId)} className="w-full">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Process Tests
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No pending test orders</p>
          )}
        </CardContent>
      </Card>

      {/* Completed Tests */}
      <Card>
        <CardHeader>
          <CardTitle>Completed Tests</CardTitle>
          <CardDescription>Recently processed test results</CardDescription>
        </CardHeader>
        <CardContent>
          {completedTests.length > 0 ? (
            <div className="space-y-3">
              {completedTests.map((result) => (
                <div key={result.patientId + result.timestamp} className="p-4 border rounded-lg bg-green-50">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold">{result.patientName}</h4>
                      <p className="text-sm text-muted-foreground">
                        {new Date(result.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <Badge variant="default">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Completed
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {result.tests?.map((test, idx) => (
                      <Badge key={idx} variant="outline" className="bg-white">
                        {test.testType?.replace('_', ' ')}
                        {test.abnormal && <AlertCircle className="h-3 w-3 ml-1 text-yellow-600" />}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No completed tests yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
