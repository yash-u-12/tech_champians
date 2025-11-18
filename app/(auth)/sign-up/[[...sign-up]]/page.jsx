"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { SignUp } from "@clerk/nextjs";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Page() {
  const searchParams = useSearchParams();
  const initialRole = (searchParams?.get("role") || "patient").toLowerCase();
  const [role, setRole] = useState(initialRole);
  const [envDiagnostics, setEnvDiagnostics] = useState({ publishable: false });
  const afterUrl = `/onboarding?selectedRole=${encodeURIComponent(role)}`;

  useEffect(() => {
    // Detect presence of publishable key client-side (debug aid)
    const hasPub = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
    setEnvDiagnostics({ publishable: hasPub });
  }, []);

  return (
    <div className="w-full max-w-3xl flex flex-col gap-6">
      <Card className="border-emerald-900/20">
        <CardContent className="pt-6">
          <CardTitle className="text-xl text-white mb-2">Choose Your Role</CardTitle>
          <CardDescription className="mb-4">
            This helps us personalize onboarding right after sign up
          </CardDescription>
          <div className="flex gap-2 flex-wrap">
            {[
              ["patient", "Patient"],
              ["doctor", "Doctor"],
              ["pharmacy", "Pharmacy"],
            ].map(([value, label]) => (
              <Button
                key={value}
                type="button"
                variant={role === value ? "default" : "outline"}
                className={role === value ? "bg-emerald-600 hover:bg-emerald-700" : "border-emerald-900/30"}
                onClick={() => setRole(value)}
              >
                {label}
              </Button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            After sign-up you will be redirected to role-specific onboarding.
          </p>
          {!envDiagnostics.publishable && (
            <p className="text-xs text-red-400 mt-2">
              Publishable key missing (NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY). Sign-up may fail.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="border border-emerald-900/30 rounded-md p-4 bg-background/40">
        <SignUp afterSignUpUrl={afterUrl} redirectUrl={afterUrl} />
      </div>
    </div>
  );
}
