import React, { useState } from 'react';
import ClientSetupWizard from './ClientSetupWizard';
import { useClientSetup } from '@/hooks/useClientSetup';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface OnboardingManagerProps {
  onComplete: () => void;
}

export const OnboardingManager: React.FC<OnboardingManagerProps> = ({ onComplete }) => {
  const { setupStatus, loading, needsOnboarding, refetch } = useClientSetup();
  const [isCompleting, setIsCompleting] = useState(false);

  const handleSetupComplete = async () => {
    setIsCompleting(true);
    
    // Refresh setup status to ensure we have latest data
    await refetch();
    
    setIsCompleting(false);
    onComplete();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Loading Setup Status</h2>
            <p className="text-muted-foreground">Checking your account configuration...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If setup is already complete, proceed to dashboard
  if (!needsOnboarding()) {
    onComplete();
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <ClientSetupWizard onComplete={handleSetupComplete} />
    </div>
  );
};