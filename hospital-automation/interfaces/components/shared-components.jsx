'use client';

import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, AlertCircle, Activity } from 'lucide-react';

export function StatusBadge({ status }) {
  const statusConfig = {
    waiting: {
      label: 'Waiting',
      variant: 'secondary',
      icon: Clock
    },
    in_triage: {
      label: 'In Triage',
      variant: 'default',
      icon: Activity
    },
    in_consultation: {
      label: 'In Consultation',
      variant: 'default',
      icon: Activity
    },
    lab_tests: {
      label: 'Lab Tests',
      variant: 'secondary',
      icon: Activity
    },
    ready_for_pharmacy: {
      label: 'Ready for Pharmacy',
      variant: 'default',
      icon: CheckCircle
    },
    completed: {
      label: 'Completed',
      variant: 'outline',
      icon: CheckCircle
    },
    pending: {
      label: 'Pending',
      variant: 'secondary',
      icon: Clock
    },
    processing: {
      label: 'Processing',
      variant: 'default',
      icon: Activity
    },
    ready: {
      label: 'Ready',
      variant: 'default',
      icon: CheckCircle
    },
    dispensed: {
      label: 'Dispensed',
      variant: 'outline',
      icon: CheckCircle
    },
    critical: {
      label: 'Critical',
      variant: 'destructive',
      icon: AlertCircle
    },
    urgent: {
      label: 'Urgent',
      variant: 'destructive',
      icon: AlertCircle
    },
    normal: {
      label: 'Normal',
      variant: 'default',
      icon: CheckCircle
    }
  };

  const config = statusConfig[status?.toLowerCase()] || {
    label: status || 'Unknown',
    variant: 'outline',
    icon: Activity
  };

  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className="flex items-center gap-1">
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}

export function LoadingSpinner({ text = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center h-full space-y-4">
      <Activity className="h-8 w-8 animate-spin text-primary" />
      <p className="text-muted-foreground">{text}</p>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-4">
      {Icon && (
        <div className="p-4 bg-secondary/20 rounded-full">
          <Icon className="h-12 w-12 text-muted-foreground" />
        </div>
      )}
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground max-w-md">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
