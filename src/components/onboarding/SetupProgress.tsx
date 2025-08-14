import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, Clock } from 'lucide-react';
import { SetupStatus } from '@/hooks/useClientSetup';

interface SetupProgressProps {
  setupStatus: SetupStatus | null;
  loading?: boolean;
}

export const SetupProgress: React.FC<SetupProgressProps> = ({ setupStatus, loading }) => {
  if (loading || !setupStatus) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Setup Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-5/6"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const steps = [
    {
      key: 'company',
      title: 'Company Information',
      description: 'Basic company details and branding',
      completed: setupStatus.company_complete,
      required: true
    },
    {
      key: 'twilio',
      title: 'SMS Configuration',
      description: 'Twilio integration for messaging',
      completed: setupStatus.twilio_complete,
      required: true
    },
    {
      key: 'verification',
      title: 'Twilio Verification',
      description: 'Test SMS functionality',
      completed: setupStatus.twilio_verified,
      required: false
    }
  ];

  const completedSteps = steps.filter(step => step.completed).length;
  const requiredSteps = steps.filter(step => step.required).length;
  const requiredCompleted = steps.filter(step => step.required && step.completed).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Setup Progress</CardTitle>
          <Badge variant={setupStatus.setup_completed ? "default" : "secondary"}>
            {requiredCompleted}/{requiredSteps} Required Complete
          </Badge>
        </div>
        {setupStatus.setup_completed && (
          <div className="text-sm text-green-600 font-medium">
            ✅ Setup completed successfully!
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {steps.map((step) => (
          <div key={step.key} className="flex items-start gap-3">
            <div className="mt-0.5">
              {step.completed ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : step.required ? (
                <Circle className="h-5 w-5 text-muted-foreground" />
              ) : (
                <Clock className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className={`font-medium ${step.completed ? 'text-green-700' : 'text-foreground'}`}>
                  {step.title}
                </h4>
                {step.required && (
                  <Badge variant="outline" className="text-xs">Required</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {step.description}
              </p>
            </div>
          </div>
        ))}
        
        {!setupStatus.setup_completed && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
              Complete all required steps to access the full dashboard.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};