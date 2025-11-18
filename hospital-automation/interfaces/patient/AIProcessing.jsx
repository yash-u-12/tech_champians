'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Activity, 
  CheckCircle, 
  Clock, 
  User,
  Stethoscope,
  FileText,
  AlertCircle
} from 'lucide-react';

export default function AIProcessing({ patientId, visitId }) {
  const [processing, setProcessing] = useState(true);
  const [stage, setStage] = useState(0);
  const [visitData, setVisitData] = useState(null);

  const stages = [
    {
      name: 'Reception',
      description: 'Creating patient profile...',
      icon: User,
      color: 'text-blue-500'
    },
    {
      name: 'AI Analysis',
      description: 'Analyzing symptoms and urgency...',
      icon: Activity,
      color: 'text-purple-500'
    },
    {
      name: 'Doctor Assignment',
      description: 'Finding available doctor...',
      icon: Stethoscope,
      color: 'text-green-500'
    },
    {
      name: 'Complete',
      description: 'Ready for consultation',
      icon: CheckCircle,
      color: 'text-green-600'
    }
  ];

  useEffect(() => {
    // Simulate AI processing stages
    const timers = [
      setTimeout(() => setStage(1), 1000),
      setTimeout(() => setStage(2), 2500),
      setTimeout(() => setStage(3), 4000),
      setTimeout(() => {
        setProcessing(false);
        fetchVisitData();
      }, 5500)
    ];

    return () => timers.forEach(timer => clearTimeout(timer));
  }, []);

  const fetchVisitData = async () => {
    try {
      const response = await fetch(`/api/hospital/visit/${visitId}`);
      const data = await response.json();
      setVisitData(data.visit);
    } catch (error) {
      console.error('Error fetching visit data:', error);
    }
  };

  const getUrgencyBadge = (urgency) => {
    const variants = {
      low: { variant: 'outline', label: 'Low Priority' },
      medium: { variant: 'default', label: 'Medium Priority' },
      high: { variant: 'secondary', label: 'High Priority' },
      critical: { variant: 'destructive', label: 'Critical' }
    };

    const config = variants[urgency] || variants.medium;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (processing) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 animate-spin" />
            AI Agents Processing...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {stages.map((stageInfo, index) => {
              const Icon = stageInfo.icon;
              const isActive = index === stage;
              const isComplete = index < stage;
              
              return (
                <div key={index} className="flex items-start gap-4">
                  <div className={`
                    p-3 rounded-full transition-all
                    ${isComplete ? 'bg-green-100' : isActive ? 'bg-blue-100' : 'bg-gray-100'}
                  `}>
                    <Icon className={`
                      h-6 w-6 transition-all
                      ${isComplete ? 'text-green-600' : isActive ? stageInfo.color + ' animate-pulse' : 'text-gray-400'}
                    `} />
                  </div>
                  <div className="flex-1">
                    <h4 className={`font-semibold ${isActive ? 'text-primary' : ''}`}>
                      {stageInfo.name}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {stageInfo.description}
                    </p>
                    {isActive && (
                      <div className="flex items-center gap-2 mt-2">
                        <div className="h-2 w-2 bg-blue-500 rounded-full animate-ping" />
                        <span className="text-xs text-blue-600">Processing...</span>
                      </div>
                    )}
                    {isComplete && (
                      <div className="flex items-center gap-2 mt-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-xs text-green-600">Completed</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!visitData) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="pt-6">
          <div className="text-center">
            <Activity className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading assignment details...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-6 w-6 text-green-600" />
            Assignment Complete
          </CardTitle>
          {getUrgencyBadge(visitData.urgency)}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Patient Info */}
        <div className="p-4 bg-secondary/20 rounded-lg">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <User className="h-4 w-4" />
            Patient Information
          </h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">Patient ID:</span>
              <p className="font-mono">{patientId}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Visit ID:</span>
              <p className="font-mono">{visitId}</p>
            </div>
          </div>
        </div>

        {/* Doctor Assignment */}
        <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg border-2 border-green-200 dark:border-green-800">
          <h3 className="font-semibold mb-3 flex items-center gap-2 text-green-700 dark:text-green-300">
            <Stethoscope className="h-5 w-5" />
            Assigned Doctor
          </h3>
          <div className="space-y-2">
            <div>
              <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                {visitData.assignedDoctorName || 'Finding doctor...'}
              </p>
              <p className="text-sm text-green-700 dark:text-green-300">
                {visitData.specialty || 'General Medicine'}
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4" />
              <span>Expected wait time: 5-10 minutes</span>
            </div>
          </div>
        </div>

        {/* Problem Summary */}
        <div className="p-4 bg-secondary/20 rounded-lg">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Your Problem
          </h3>
          <p className="text-sm">{visitData.problem}</p>
        </div>

        {/* AI Analysis */}
        {visitData.aiAnalysis && (
          <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <h3 className="font-semibold mb-2 flex items-center gap-2 text-blue-700 dark:text-blue-300">
              <Activity className="h-4 w-4" />
              AI Analysis
            </h3>
            <p className="text-sm text-blue-900 dark:text-blue-100">
              {visitData.aiAnalysis}
            </p>
          </div>
        )}

        {/* Next Steps */}
        <div className="p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
          <h3 className="font-semibold mb-2 flex items-center gap-2 text-yellow-700 dark:text-yellow-300">
            <AlertCircle className="h-4 w-4" />
            Next Steps
          </h3>
          <ul className="text-sm space-y-1 text-yellow-900 dark:text-yellow-100">
            <li>• Please wait in the designated area</li>
            <li>• The doctor will call you shortly</li>
            <li>• Keep your phone nearby for updates</li>
          </ul>
        </div>

        {/* Status */}
        <div className="text-center">
          <Badge variant="outline" className="text-lg px-4 py-2">
            <Clock className="h-4 w-4 mr-2" />
            Status: {visitData.status.replace('_', ' ').toUpperCase()}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
