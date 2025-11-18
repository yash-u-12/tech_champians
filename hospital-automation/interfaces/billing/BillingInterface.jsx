'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CreditCard, DollarSign, Clock, CheckCircle, FileText } from 'lucide-react';

export default function BillingInterface({ billingStaffId }) {
  const [invoices, setInvoices] = useState([]);
  const [stats, setStats] = useState({
    pending: 0,
    paid: 0,
    totalRevenue: 0,
    averageAmount: 0
  });

  useEffect(() => {
    fetchBillingData();
    const interval = setInterval(fetchBillingData, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchBillingData = async () => {
    try {
      const response = await fetch('/api/hospital-automation/billing');
      if (response.ok) {
        const data = await response.json();
        setInvoices(data.invoices || []);
        setStats(data.stats || stats);
      }
    } catch (error) {
      console.error('Error fetching billing data:', error);
    }
  };

  const markAsPaid = async (patientId) => {
    try {
      const response = await fetch('/api/hospital-automation/billing/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId, billingStaffId })
      });
      if (response.ok) {
        fetchBillingData();
      }
    } catch (error) {
      console.error('Error marking as paid:', error);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Billing Dashboard</h1>
          <p className="text-muted-foreground">Invoice and payment management</p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          <CreditCard className="h-4 w-4 mr-2" />
          {billingStaffId}
        </Badge>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pending Invoices</CardTitle>
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
            <CardTitle className="text-sm font-medium">Paid Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">{stats.paid}</div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">${stats.totalRevenue}</div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Average Bill</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">${stats.averageAmount}</div>
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invoices */}
      <Card>
        <CardHeader>
          <CardTitle>Patient Invoices</CardTitle>
          <CardDescription>Pending and completed invoices</CardDescription>
        </CardHeader>
        <CardContent>
          {invoices.length > 0 ? (
            <div className="space-y-4">
              {invoices.map((invoice) => (
                <div 
                  key={invoice.patientId} 
                  className={`p-4 border rounded-lg ${invoice.status === 'paid' ? 'bg-green-50' : ''}`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold">{invoice.patientName}</h4>
                      <p className="text-sm text-muted-foreground">
                        Invoice #{invoice.invoiceNumber}
                      </p>
                    </div>
                    <Badge variant={invoice.status === 'paid' ? 'default' : 'secondary'}>
                      {invoice.status}
                    </Badge>
                  </div>

                  {/* Invoice Items */}
                  <div className="space-y-2 mb-3">
                    {invoice.items?.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span>{item.description}</span>
                        <span className="font-medium">${item.amount.toFixed(2)}</span>
                      </div>
                    ))}
                    {invoice.subtotal && (
                      <>
                        <div className="border-t pt-2 mt-2" />
                        <div className="flex justify-between text-sm">
                          <span>Subtotal</span>
                          <span>${invoice.subtotal.toFixed(2)}</span>
                        </div>
                        {invoice.tax > 0 && (
                          <div className="flex justify-between text-sm text-muted-foreground">
                            <span>Tax</span>
                            <span>${invoice.tax.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between font-bold">
                          <span>Total</span>
                          <span className="text-lg">${invoice.total.toFixed(2)}</span>
                        </div>
                      </>
                    )}
                  </div>

                  {invoice.status === 'pending' && (
                    <Button 
                      onClick={() => markAsPaid(invoice.patientId)} 
                      className="w-full"
                      variant="default"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Mark as Paid
                    </Button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No invoices found</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
