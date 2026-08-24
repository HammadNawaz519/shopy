import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/security/session";
import AdminLayoutClient from "@/components/admin/AdminLayoutClient";

export const metadata = {
  title: "Admin",
  description: "SHOPY Admin",
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Strict Server-Side Role Enforcement
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?redirect=/admin");
  }

  if (user.role !== "admin") {
    // Normal customer attempting to access admin dashboard -> Deny and redirect to customer account
    redirect("/account");
  }

  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
