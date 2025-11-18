'use client';

import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";

export default function ConditionalClerkProvider({ children }) {
  // Always wrap with ClerkProvider so hooks like useUser work everywhere.
  // Public routes remain accessible due to middleware configuration.
  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
      }}
    >
      {children}
    </ClerkProvider>
  );
}
