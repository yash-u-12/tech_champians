'use client';

import React from "react";
import { usePathname } from "next/navigation";
import HeaderClient from "./header-client";

// Client Component that conditionally renders based on route
export default function Header() {
  const pathname = usePathname();
  
  // Don't render header for hospital automation routes
  if (pathname?.startsWith("/hospital-portal") || 
      pathname?.startsWith("/hospital-automation") || 
      pathname?.startsWith("/hospital-workflow")) {
    return null;
  }

  // For other routes, render header without user data to avoid auth errors
  return <HeaderClient userData={null} />;
}
