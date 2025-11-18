'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { 
  Pill, 
  Package,
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  TrendingDown,
  Search,
  User,
  FileText
} from 'lucide-react';

export default function PharmacyInterface({ pharmacistId }) {
  const [orders, setOrders] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchOrders();
    fetchInventory();
    const interval = setInterval(() => {
      fetchOrders();
      fetchInventory();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/hospital-automation/pharmacy/orders');
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const fetchInventory = async () => {
    try {
      const response = await fetch('/api/hospital-automation/pharmacy/inventory');
      if (response.ok) {
        const data = await response.json();
        setInventory(data.inventory || []);
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
    }
  };

  const handleDispenseMedication = async (orderId) => {
    try {
      const response = await fetch('/api/hospital-automation/pharmacy/dispense', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          orderId,
          pharmacistId 
        })
      });

      if (response.ok) {
        alert('Medication dispensed successfully!');
        fetchOrders();
        fetchInventory();
        setSelectedOrder(null);
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error dispensing medication:', error);
      alert('Failed to dispense medication');
    }
  };

  const handleGenerateBill = async (orderId) => {
    try {
      const response = await fetch('/api/hospital-automation/pharmacy/generate-bill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId })
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Bill generated: $${data.total.toFixed(2)}`);
        fetchOrders();
      }
    } catch (error) {
      console.error('Error generating bill:', error);
      alert('Failed to generate bill');
    }
  };

  const getOrderStatusBadge = (status) => {
    const variants = {
      pending: 'secondary',
      processing: 'default',
      ready: 'default',
      dispensed: 'default',
      completed: 'outline'
    };

    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  const filteredOrders = orders.filter(order => 
    order.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.appointmentId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingOrders = filteredOrders.filter(o => o.status === 'pending' || o.status === 'processing');
  const completedOrders = filteredOrders.filter(o => o.status === 'dispensed' || o.status === 'completed');

  const lowStockItems = inventory.filter(item => item.quantity <= item.reorderThreshold);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Pharmacy Portal</h1>
          <p className="text-muted-foreground">Manage prescriptions and inventory</p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          <User className="h-4 w-4 mr-2" />
          {pharmacistId}
        </Badge>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingOrders.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Today's Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedOrders.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <TrendingDown className="h-4 w-4 text-orange-500 mr-2" />
              <div className="text-2xl font-bold">{lowStockItems.length}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Revenue Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <DollarSign className="h-4 w-4 text-green-500 mr-2" />
              <div className="text-2xl font-bold">
                ${completedOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0).toFixed(2)}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="orders" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="orders">Prescription Orders</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        {/* Orders Tab */}
        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Prescription Orders</CardTitle>
                  <CardDescription>Process and dispense medications</CardDescription>
                </div>
                <div className="relative w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by patient or appointment..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Pending Orders */}
                {pendingOrders.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center">
                      <Clock className="h-4 w-4 mr-2" />
                      Pending Orders ({pendingOrders.length})
                    </h3>
                    <div className="space-y-2">
                      {pendingOrders.map((order) => (
                        <div key={order.orderId} className="p-4 border rounded-lg">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="font-semibold">{order.patientName}</h4>
                              <p className="text-sm text-muted-foreground">
                                Appointment: {order.appointmentId}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(order.timestamp).toLocaleString()}
                              </p>
                            </div>
                            {getOrderStatusBadge(order.status)}
                          </div>

                          {/* Medications List */}
                          <div className="space-y-2 mb-3">
                            {order.medications?.map((med, idx) => (
                              <div key={idx} className="flex items-center justify-between bg-secondary/20 p-2 rounded">
                                <div className="flex-1">
                                  <p className="font-medium">{med.name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {med.dosage} - {med.frequency} - {med.duration}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="font-medium">${med.price?.toFixed(2) || '0.00'}</p>
                                  <p className="text-xs text-muted-foreground">Qty: {med.quantity || 1}</p>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Interactions/Warnings */}
                          {order.interactions && order.interactions.length > 0 && (
                            <Alert variant="warning" className="mb-3">
                              <AlertCircle className="h-4 w-4" />
                              <AlertDescription>
                                <strong>Drug Interactions Detected:</strong>
                                <ul className="list-disc ml-4 mt-1">
                                  {order.interactions.map((interaction, idx) => (
                                    <li key={idx} className="text-sm">{interaction}</li>
                                  ))}
                                </ul>
                              </AlertDescription>
                            </Alert>
                          )}

                          {/* Total Amount */}
                          {order.totalAmount && (
                            <div className="flex justify-between items-center border-t pt-3">
                              <span className="font-semibold">Total Amount:</span>
                              <span className="text-xl font-bold">${order.totalAmount.toFixed(2)}</span>
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex gap-2 mt-3">
                            {!order.billGenerated && (
                              <Button 
                                variant="outline"
                                onClick={() => handleGenerateBill(order.orderId)}
                              >
                                <FileText className="h-4 w-4 mr-2" />
                                Generate Bill
                              </Button>
                            )}
                            <Button 
                              onClick={() => setSelectedOrder(order)}
                              variant="default"
                            >
                              <Package className="h-4 w-4 mr-2" />
                              Review & Dispense
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Completed Orders */}
                {completedOrders.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Completed Orders ({completedOrders.length})
                    </h3>
                    <div className="space-y-2">
                      {completedOrders.slice(0, 5).map((order) => (
                        <div key={order.orderId} className="p-3 border rounded-lg bg-secondary/10">
                          <div className="flex justify-between items-center">
                            <div>
                              <h4 className="font-medium">{order.patientName}</h4>
                              <p className="text-xs text-muted-foreground">{order.appointmentId}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">${order.totalAmount?.toFixed(2)}</p>
                              {getOrderStatusBadge(order.status)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {filteredOrders.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No prescription orders found
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Inventory Tab */}
        <TabsContent value="inventory">
          <Card>
            <CardHeader>
              <CardTitle>Medication Inventory</CardTitle>
              <CardDescription>Track stock levels and manage supplies</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {inventory.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{item.name}</h4>
                      <p className="text-sm text-muted-foreground capitalize">{item.category}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">In Stock</p>
                        <p className={`text-lg font-bold ${
                          item.quantity <= item.reorderThreshold ? 'text-orange-500' : ''
                        }`}>
                          {item.quantity}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Price</p>
                        <p className="text-lg font-bold">${item.price.toFixed(2)}</p>
                      </div>
                      {item.quantity <= item.reorderThreshold && (
                        <Badge variant="destructive">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Low Stock
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
                {inventory.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No inventory data available
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <CardTitle>Alerts & Notifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {lowStockItems.length > 0 && (
                  <Alert variant="warning">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>{lowStockItems.length} medications are running low:</strong>
                      <ul className="list-disc ml-4 mt-2">
                        {lowStockItems.map((item, idx) => (
                          <li key={idx}>
                            {item.name} - Only {item.quantity} units remaining
                          </li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {pendingOrders.length > 5 && (
                  <Alert>
                    <Clock className="h-4 w-4" />
                    <AlertDescription>
                      <strong>High order volume:</strong> {pendingOrders.length} prescriptions waiting to be processed
                    </AlertDescription>
                  </Alert>
                )}

                {lowStockItems.length === 0 && pendingOrders.length <= 5 && (
                  <p className="text-center text-muted-foreground py-8">
                    No alerts at this time
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dispense Modal/Dialog */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Dispense Medication</CardTitle>
              <CardDescription>Review and confirm dispensing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Patient Information</h3>
                <p><strong>Name:</strong> {selectedOrder.patientName}</p>
                <p><strong>Appointment:</strong> {selectedOrder.appointmentId}</p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Medications to Dispense</h3>
                <div className="space-y-2">
                  {selectedOrder.medications?.map((med, idx) => (
                    <div key={idx} className="p-3 bg-secondary/20 rounded">
                      <p className="font-medium">{med.name}</p>
                      <p className="text-sm">{med.dosage} - {med.frequency} - {med.duration}</p>
                      {med.instructions && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Instructions: {med.instructions}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {selectedOrder.interactions && selectedOrder.interactions.length > 0 && (
                <Alert variant="warning">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Drug Interactions:</strong>
                    <ul className="list-disc ml-4 mt-1">
                      {selectedOrder.interactions.map((interaction, idx) => (
                        <li key={idx} className="text-sm">{interaction}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setSelectedOrder(null)}>
                  Cancel
                </Button>
                <Button onClick={() => handleDispenseMedication(selectedOrder.orderId)}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirm Dispense
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
