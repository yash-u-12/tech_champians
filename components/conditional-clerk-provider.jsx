'use client';

import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { usePathname } from "next/navigation";

export default function ConditionalClerkProvider({ children }) {
  const pathname = usePathname();
  
  // Check if we're on a hospital route
  const isHospitalRoute = pathname?.startsWith('/hospital-workflow') || 
                         pathname?.startsWith('/hospital-portal') || 
                         pathname?.startsWith('/hospital-automation');

  // If hospital route, skip ClerkProvider entirely
  if (isHospitalRoute) {
    return <>{children}</>;
  }

  // For other routes, use ClerkProvider
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
