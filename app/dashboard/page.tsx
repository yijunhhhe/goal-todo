"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Link href="/goals">
          <Button>View Goals</Button>
        </Link>
      </header>
      
      <div className="grid gap-6">
        {/* Add other dashboard widgets or content here */}
        <div className="p-6 border rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Welcome to Your Dashboard</h2>
          <p className="text-gray-600">
            This is your personal dashboard. You can view and manage your goals by clicking the button above.
          </p>
        </div>
      </div>
    </div>
  );
}