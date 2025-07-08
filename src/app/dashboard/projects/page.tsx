"use client";

import React, { useState, useEffect, useRef } from "react";
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
import { PlusCircle, CheckCircle2, Trash2, QrCode, ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { projects as initialProjects, Project } from "@/lib/data";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { QRCodeCanvas } from "qrcode.react";

const initialFormData = {
  name: "",
  description: "",
  goal: "",
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newProjectData, setNewProjectData] = useState(initialFormData);
  const [selectedProjectForQR, setSelectedProjectForQR] = useState<Project | null>(null);
  const qrCodeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const storedProjects = sessionStorage.getItem("projects");
      setProjects(storedProjects ? JSON.parse(storedProjects) : initialProjects);
    } catch (error) {
      console.error("Failed to parse projects from sessionStorage, using initial data.", error);
      setProjects(initialProjects);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoading) {
      sessionStorage.setItem("projects", JSON.stringify(projects));
    }
  }, [projects, isLoading]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setNewProjectData(prev => ({ ...prev, [id]: value }));
  };

  const handleAddProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectData.name || !newProjectData.goal) return;

    const newProject: Project = {
      id: `proj-${Date.now()}`,
      name: newProjectData.name,
      description: newProjectData.description,
      goal: parseFloat(newProjectData.goal) || 0,
      raised: 0,
      media: [],
    };

    setProjects(prev => [newProject, ...prev]);
    setIsAddDialogOpen(false);
    setNewProjectData(initialFormData);
  };

  const handleRemoveProject = (id: string) => {
    setProjects((prevProjects) => prevProjects.filter((p) => p.id !== id));
  };

  const handleDownloadQR = () => {
    if (!qrCodeRef.current || !selectedProjectForQR) return;

    const canvas = qrCodeRef.current.querySelector('canvas');
    if (canvas) {
      const pngUrl = canvas
        .toDataURL("image/png")
        .replace("image/png", "image/octet-stream");
      const downloadLink = document.createElement("a");
      downloadLink.href = pngUrl;
      downloadLink.download = `${selectedProjectForQR.name}-qrcode.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
            <p className="text-muted-foreground">
              Manage your charity's ongoing projects.
            </p>
          </div>
          <Button disabled>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add New Project
          </Button>
        </div>
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
                <div className="flex w-full items-center gap-2">
                  <Skeleton className="h-10 flex-grow" />
                  <Skeleton className="h-10 w-10" />
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">
            Manage your charity's ongoing projects.
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={(isOpen) => {
          setIsAddDialogOpen(isOpen);
          if (!isOpen) setNewProjectData(initialFormData);
        }}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add New Project
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleAddProject}>
              <DialogHeader>
                <DialogTitle>Add New Project</DialogTitle>
                <DialogDescription>
                  Fill in the details for the new charity project.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Name
                  </Label>
                  <Input id="name" value={newProjectData.name} onChange={handleInputChange} className="col-span-3" placeholder="e.g., Clean Water Initiative" required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">
                    Description
                  </Label>
                  <Textarea id="description" value={newProjectData.description} onChange={handleInputChange} className="col-span-3" placeholder="Project details..."/>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="goal" className="text-right">
                    Goal (₹)
                  </Label>
                  <Input id="goal" type="number" value={newProjectData.goal} onChange={handleInputChange} className="col-span-3" placeholder="50000" required />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                <Button type="submit">Save Project</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project: Project) => {
          const isFunded = project.raised >= project.goal;
          const progress = Math.min((project.raised / project.goal) * 100, 100);

          return (
            <Card key={project.id} className="flex flex-col">
              <CardHeader className="flex-grow">
                <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                        <CardTitle>{project.name}</CardTitle>
                        <CardDescription className="line-clamp-2 h-10 pt-1.5">{project.description}</CardDescription>
                    </div>
                  {isFunded && (
                    <Badge variant="success" className="whitespace-nowrap h-fit">
                      <CheckCircle2 className="mr-1 h-4 w-4" />
                      Funded
                    </Badge>
                  )}
                </div>
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
                <div className="flex w-full items-center gap-2">
                  <Button variant="secondary" className="flex-grow" asChild>
                    <Link href={`/dashboard/projects/${project.id}`}>
                      View Details
                    </Link>
                  </Button>
                  <Button variant="outline" size="icon" asChild>
                    <Link href={`/projects/${project.id}`} target="_blank">
                      <ExternalLink className="h-4 w-4" />
                      <span className="sr-only">View Public Page</span>
                    </Link>
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => setSelectedProjectForQR(project)}>
                    <QrCode className="h-4 w-4" />
                    <span className="sr-only">Generate QR Code</span>
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="icon">
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Remove Project</span>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete this project.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleRemoveProject(project.id)}>
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      <Dialog open={!!selectedProjectForQR} onOpenChange={(isOpen) => !isOpen && setSelectedProjectForQR(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>QR Code for {selectedProjectForQR?.name}</DialogTitle>
            <DialogDescription>
              Scan this code to view the project details page.
            </DialogDescription>
          </DialogHeader>
          {selectedProjectForQR && (
            <div className="flex justify-center py-4" ref={qrCodeRef}>
              <QRCodeCanvas
                value={`${window.location.origin}/projects/${selectedProjectForQR.id}`}
                size={256}
                bgColor={"#ffffff"}
                fgColor={"#000000"}
                level={"Q"}
              />
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setSelectedProjectForQR(null)}>Close</Button>
            <Button type="button" onClick={handleDownloadQR}>Download</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
