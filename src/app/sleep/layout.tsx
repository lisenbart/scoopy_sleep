"use client";

import SleepPageErrorBoundary from "@/components/sleep/SleepPageErrorBoundary";

export default function SleepLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SleepPageErrorBoundary>{children}</SleepPageErrorBoundary>;
}
