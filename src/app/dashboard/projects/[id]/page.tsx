"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { projects as initialProjects, Project, ProjectMedia } from '@/lib/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ArrowLeft, PlusCircle, Image as ImageIcon, Video, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

type NewUpdateData = Omit<ProjectMedia, 'id'> & {
    beforeFile?: File;
    afterFile?: File;
};

const initialUpdateData: NewUpdateData = {
    type: 'image',
    before: '',
    after: '',
    description: '',
};

export default function ProjectDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const projectId = params.id as string;

    const [projects, setProjects] = useState<Project[]>(initialProjects);
    const [project, setProject] = useState<Project | null>(null);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [newUpdateData, setNewUpdateData] = useState<NewUpdateData>(initialUpdateData);

    useEffect(() => {
        const storedProjectsJSON = sessionStorage.getItem("projects");
        const loadedProjects = storedProjectsJSON ? JSON.parse(storedProjectsJSON) : initialProjects;
        setProjects(loadedProjects);
        const currentProject = loadedProjects.find((p: Project) => p.id === projectId);
        if (currentProject) {
            setProject(currentProject);
        } else {
          router.push('/dashboard/projects');
        }
    }, [projectId, router]);

    const handleUpdateProjects = (updatedProjects: Project[]) => {
        setProjects(updatedProjects);
        sessionStorage.setItem("projects", JSON.stringify(updatedProjects));
        const currentProject = updatedProjects.find((p: Project) => p.id === projectId);
        if (currentProject) {
            setProject(currentProject);
        }
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setNewUpdateData({ ...newUpdateData, [e.target.id]: e.target.value });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'before' | 'after') => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setNewUpdateData(prev => ({
                    ...prev,
                    [field]: reader.result as string,
                    [`${field}File`]: file
                }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAddUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!project) return;

        const newMedia: ProjectMedia = {
            id: `media-${Date.now()}`,
            type: newUpdateData.type,
            before: newUpdateData.before,
            after: newUpdateData.after,
            description: newUpdateData.description,
        };
        
        const updatedMedia = [...(project.media || []), newMedia];
        const updatedProject = { ...project, media: updatedMedia };

        const updatedProjects = projects.map(p => p.id === projectId ? updatedProject : p);
        handleUpdateProjects(updatedProjects);
        
        setIsAddDialogOpen(false);
        setNewUpdateData(initialUpdateData);
    };

    if (!project) {
        return <div className="flex items-center justify-center h-full"><p className="text-muted-foreground">Loading project details...</p></div>;
    }

    const progress = Math.min((project.raised / project.goal) * 100, 100);

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                    <span className="sr-only">Back</span>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
                    <p className="text-muted-foreground">{project.description}</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Funding Progress</CardTitle>
                </CardHeader>
                <CardContent>
                    <Progress value={progress} className="mb-2" />
                    <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Raised: ₹{project.raised.toLocaleString()}</span>
                        <span>Goal: ₹{project.goal.toLocaleString()}</span>
                    </div>
                </CardContent>
            </Card>

            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight">Project Updates</h2>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add Update
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Add New Project Update</DialogTitle>
                            <DialogDescription>
                                Share the latest progress with a before/after update.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleAddUpdate} className="space-y-4 pt-4">
                            <div>
                                <Label>Update Type</Label>
                                <RadioGroup value={newUpdateData.type} onValueChange={(value: 'image' | 'video' | 'story') => setNewUpdateData({...newUpdateData, type: value, before: '', after: ''})} className="flex items-center gap-4 pt-2">
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="image" id="type-image" />
                                        <Label htmlFor="type-image">Image</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="video" id="type-video" />
                                        <Label htmlFor="type-video">Video</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="story" id="type-story" />
                                        <Label htmlFor="type-story">Story</Label>
                                    </div>
                                </RadioGroup>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {newUpdateData.type === 'image' && (
                                    <>
                                        <div className="space-y-2">
                                            <Label htmlFor="beforeFile">Before Image</Label>
                                            <Input id="beforeFile" type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'before')} required />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="afterFile">After Image</Label>
                                            <Input id="afterFile" type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'after')} required />
                                        </div>
                                    </>
                                )}
                                {newUpdateData.type === 'video' && (
                                    <>
                                        <div className="space-y-2">
                                            <Label htmlFor="beforeFile">Before Video</Label>
                                            <Input id="beforeFile" type="file" accept="video/*" onChange={(e) => handleFileChange(e, 'before')} required />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="afterFile">After Video</Label>
                                            <Input id="afterFile" type="file" accept="video/*" onChange={(e) => handleFileChange(e, 'after')} required />
                                        </div>
                                    </>
                                )}
                                {newUpdateData.type === 'story' && (
                                    <>
                                        <div className="space-y-2">
                                            <Label htmlFor="before">Before Story</Label>
                                            <Textarea id="before" placeholder="Describe the situation before..." value={newUpdateData.before} onChange={handleInputChange} required />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="after">After Story</Label>
                                            <Textarea id="after" placeholder="Describe the impact after..." value={newUpdateData.after} onChange={handleInputChange} required />
                                        </div>
                                    </>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="description">Description</Label>
                                <Textarea id="description" placeholder="Briefly describe this update." value={newUpdateData.description} onChange={handleInputChange} required />
                            </div>

                            <DialogFooter>
                                <Button type="button" variant="ghost" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                                <Button type="submit">Save Update</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
            
            <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
                {project.media && project.media.length > 0 ? (
                    project.media.slice().reverse().map(item => (
                        <Card key={item.id}>
                            <CardHeader>
                                <CardTitle>{item.description}</CardTitle>
                                <Badge variant="outline" className="w-fit mt-1 capitalize">{item.type === 'image' ? <ImageIcon className="mr-2 h-4 w-4" /> : item.type === 'video' ? <Video className="mr-2 h-4 w-4" /> : <FileText className="mr-2 h-4 w-4" />}{item.type}</Badge>
                            </CardHeader>
                            <CardContent className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <h4 className="font-semibold">Before</h4>
                                    {item.type === 'image' ? (
                                        <Image src={item.before} alt="Before" width={600} height={400} className="rounded-md object-cover aspect-video bg-muted" data-ai-hint="construction site" />
                                    ) : item.type === 'video' ? (
                                        <video src={item.before} controls className="rounded-md object-cover aspect-video bg-muted w-full" />
                                    ) : (
                                        <p className="text-sm text-muted-foreground p-4 bg-muted rounded-md h-full">{item.before}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <h4 className="font-semibold">After</h4>
                                    {item.type === 'image' ? (
                                        <Image src={item.after} alt="After" width={600} height={400} className="rounded-md object-cover aspect-video bg-muted" data-ai-hint="well water" />
                                    ) : item.type === 'video' ? (
                                        <video src={item.after} controls className="rounded-md object-cover aspect-video bg-muted w-full" />
                                    ) : (
                                        <p className="text-sm text-muted-foreground p-4 bg-muted rounded-md h-full">{item.after}</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                  <Card className="lg:col-span-2 flex items-center justify-center p-8">
                    <p className="text-muted-foreground">No updates have been added for this project yet.</p>
                  </Card>
                )}
            </div>
        </div>
    );
}
