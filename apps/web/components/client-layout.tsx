"use client";

import NavHeader from "./nav-header";

export default function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <NavHeader />
      <main className="min-h-screen">
        {children}
      </main>
    </>
  );
}