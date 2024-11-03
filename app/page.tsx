import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Target, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted">
      <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-screen text-center">
        <div className="space-y-6 max-w-3xl">
          <div className="flex justify-center">
            <Target className="h-16 w-16 text-primary animate-pulse" />
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight">
            Track Your Goals,{" "}
            <span className="text-primary">Achieve Your Dreams</span>
          </h1>
          <p className="text-xl text-muted-foreground">
            Set meaningful goals, break them down into actionable tasks, and track
            your progress with our intuitive goal management system.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link href="/login">
              <Button size="lg" className="w-full sm:w-auto">
                Get Started <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/demo">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                View Demo
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24">
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <h3 className="text-lg font-semibold mb-2">Track Progress</h3>
            <p className="text-muted-foreground">
              Visualize your journey with beautiful progress indicators and metrics.
            </p>
          </Card>
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <h3 className="text-lg font-semibold mb-2">Stay Organized</h3>
            <p className="text-muted-foreground">
              Break down goals into manageable tasks and track completion.
            </p>
          </Card>
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <h3 className="text-lg font-semibold mb-2">Achieve More</h3>
            <p className="text-muted-foreground">
              Get insights and motivation to reach your goals faster.
            </p>
          </Card>
        </div>
      </div>
    </main>
  );
}