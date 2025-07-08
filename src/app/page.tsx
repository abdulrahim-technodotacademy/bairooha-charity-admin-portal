"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { projects as initialProjects, Project, payments as initialPayments } from "@/lib/data";
import { HandCoins, LogIn } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const PublicHeader = () => (
    <header className="sticky top-0 z-40 w-full border-b bg-background">
        <div className="container flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
            <img src="/assets/logo.png" className="h-16 w-14 " alt="logo" />
                {/* <HandCoins className="h-6 w-6 text-primary" /> */}
                <span className="font-bold text-lg">Bairooha Foundation</span>
            </Link>
            <Button asChild variant="outline">
                <Link href="/login">
                    <LogIn className="mr-2 h-4 w-4" />
                    Admin Login
                </Link>
            </Button>
        </div>
    </header>
);

export default function PublicProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const storedProjects = sessionStorage.getItem("projects");
      const loadedProjects = storedProjects ? JSON.parse(storedProjects) : initialProjects;
      
      const storedPaymentsJSON = sessionStorage.getItem('payments');
      const payments = storedPaymentsJSON ? JSON.parse(storedPaymentsJSON) : initialPayments;
      
      const projectsWithLatestData = loadedProjects.map((proj: Project) => {
        const projectPayments = payments.filter((p: any) => p.projectId === proj.id && p.mode !== 'Refund');
        const raised = projectPayments.reduce((acc: number, p: any) => acc + p.amount, 0);
        return { ...proj, raised };
      });
      setProjects(projectsWithLatestData);

    } catch (error) {
      console.error("Failed to parse projects from sessionStorage, using initial data.", error);
      setProjects(initialProjects);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  return (
    <div className="min-h-screen bg-muted/40">
        <PublicHeader />
        <main className="container py-8 md:py-12">
            <div className="text-center mb-12">
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Our Projects</h1>
                <p className="text-lg text-muted-foreground mt-4 max-w-2xl mx-auto">
                    Your donations make a real difference. Explore our ongoing projects and find a cause to support.
                </p>
            </div>

            {isLoading ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {[...Array(3)].map((_, i) => (
                        <Card key={i} className="flex flex-col">
                        <CardHeader className="flex-grow">
                            <Skeleton className="h-6 w-3/4" />
                            <Skeleton className="h-10 w-full mt-1.5" />
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                            <Skeleton className="h-4 w-full" />
                            <div className="flex justify-between text-sm text-muted-foreground">
                                <Skeleton className="h-4 w-2/5" />
                                <Skeleton className="h-4 w-2/5" />
                            </div>
                            </div>
                        </CardContent>
                        <CardFooter>
                           <Skeleton className="h-10 w-full" />
                        </CardFooter>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {projects.map((project: Project) => {
                    const progress = project.goal > 0 ? Math.min((project.raised / project.goal) * 100, 100) : 0;
                    const isFunded = project.raised >= project.goal;

                    return (
                        <Card key={project.id} className="flex flex-col hover:shadow-lg transition-shadow">
                            <CardHeader className="flex-grow">
                                {isFunded && (
                                    <Badge variant="success" className="w-fit mb-2">Funded</Badge>
                                )}
                                <CardTitle>{project.name}</CardTitle>
                                <CardDescription className="line-clamp-2 h-10 pt-1.5">{project.description}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                <Progress value={progress} />
                                <div className="flex justify-between text-sm text-muted-foreground">
                                    <span>Raised: ₹{project.raised.toLocaleString()}</span>
                                    <span>Goal: ₹{project.goal.toLocaleString()}</span>
                                </div>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button className="w-full" asChild>
                                    <Link href={`/projects/${project.id}`}>
                                        {isFunded ? 'View Details' : 'Donate Now'}
                                    </Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    );
                    })}
                </div>
            )}
        </main>
    </div>
  );
}
