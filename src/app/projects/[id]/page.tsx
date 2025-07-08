"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { projects as initialProjects, Project, ProjectMedia, Payment, payments as initialPayments } from '@/lib/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { HandCoins, LogIn, ArrowLeft, Image as ImageIcon, Video, FileText, Gift } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from "@/hooks/use-toast";

const PublicHeader = () => (
    <header className="sticky top-0 z-40 w-full border-b bg-background">
        <div className="container flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
                <HandCoins className="h-6 w-6 text-primary" />
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

const initialDonationData = {
    name: "",
    email: "",
    phone: "",
    amount: "",
};

export default function PublicProjectDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const projectId = params.id as string;

    const [project, setProject] = useState<Project | null>(null);
    const [donationData, setDonationData] = useState(initialDonationData);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const storedProjectsJSON = sessionStorage.getItem("projects");
        const loadedProjects = storedProjectsJSON ? JSON.parse(storedProjectsJSON) : initialProjects;
        
        const currentProject = loadedProjects.find((p: Project) => p.id === projectId);
        if (currentProject) {
             const storedPaymentsJSON = sessionStorage.getItem('payments');
             const payments = storedPaymentsJSON ? JSON.parse(storedPaymentsJSON) : initialPayments;
             const projectPayments = payments.filter((p: any) => p.projectId === currentProject.id && p.mode !== 'Refund');
             const raised = projectPayments.reduce((acc: number, p: any) => acc + p.amount, 0);
             setProject({ ...currentProject, raised });
        } else {
            router.push('/');
        }
    }, [projectId, router]);
    
    const handleDonationInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setDonationData({ ...donationData, [e.target.id]: e.target.value });
    };
    
    const handleDonate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!project) return;
        setIsSubmitting(true);

        const amount = parseFloat(donationData.amount);
        if (isNaN(amount) || amount <= 0) {
            toast({
                variant: "destructive",
                title: "Invalid Amount",
                description: "Please enter a valid donation amount.",
            });
            setIsSubmitting(false);
            return;
        }

        const storedPaymentsJSON = sessionStorage.getItem('payments');
        const payments: Payment[] = storedPaymentsJSON ? JSON.parse(storedPaymentsJSON) : initialPayments;
        const newPayment: Payment = {
            id: `pay-${Date.now()}`,
            donorName: donationData.name,
            donorEmail: donationData.email,
            donorPhone: donationData.phone,
            amount,
            date: new Date().toISOString().split('T')[0],
            projectId: project.id,
            projectName: project.name,
            mode: 'Online',
        };
        const updatedPayments = [newPayment, ...payments];
        sessionStorage.setItem('payments', JSON.stringify(updatedPayments));

        const storedProjectsJSON = sessionStorage.getItem("projects");
        const projects: Project[] = storedProjectsJSON ? JSON.parse(storedProjectsJSON) : initialProjects;
        const updatedProjects = projects.map(p =>
            p.id === projectId
              ? { ...p, raised: p.raised + amount }
              : p
        );
        sessionStorage.setItem("projects", JSON.stringify(updatedProjects));
        
        setProject(prev => prev ? ({ ...prev, raised: prev.raised + amount }) : null);

        toast({
            title: "Thank You!",
            description: `Your donation of ₹${amount.toLocaleString()} has been received.`,
        });

        setDonationData(initialDonationData);
        setIsSubmitting(false);
    };

    if (!project) {
        return <div className="flex items-center justify-center h-screen"><p className="text-muted-foreground">Loading project details...</p></div>;
    }

    const progress = project.goal > 0 ? Math.min((project.raised / project.goal) * 100, 100) : 0;
    const isFunded = project.raised >= project.goal;

    return (
        <div className="min-h-screen bg-muted/40">
            <PublicHeader />
            <main className="container py-8 md:py-12">
                <div className="mb-8">
                    <Button variant="ghost" onClick={() => router.push('/')} className="mb-4">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to All Projects
                    </Button>
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight">{project.name}</h1>
                    <p className="text-lg text-muted-foreground mt-2">{project.description}</p>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        <Card>
                            <CardHeader>
                                <CardTitle>Funding Progress</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Progress value={progress} className="mb-2 h-3" />
                                <div className="flex justify-between text-sm font-medium">
                                    <span>Raised: ₹{project.raised.toLocaleString()}</span>
                                    <span>Goal: ₹{project.goal.toLocaleString()}</span>
                                </div>
                                {isFunded && (
                                     <div className="mt-4 text-center p-4 bg-accent/20 rounded-md">
                                        <p className="font-semibold text-accent-foreground">🎉 This project has been fully funded! Thank you for your incredible support.</p>
                                     </div>
                                )}
                            </CardContent>
                        </Card>

                        <div>
                             <h2 className="text-2xl font-bold tracking-tight mb-4">Project Updates</h2>
                             <div className="grid gap-6 md:grid-cols-1">
                                {project.media && project.media.length > 0 ? (
                                    project.media.slice().reverse().map(item => (
                                        <Card key={item.id}>
                                            <CardHeader>
                                                <CardTitle>{item.description}</CardTitle>
                                                <Badge variant="outline" className="w-fit mt-1 capitalize">{item.type === 'image' ? <ImageIcon className="mr-2 h-4 w-4" /> : item.type === 'video' ? <Video className="mr-2 h-4 w-4" /> : <FileText className="mr-2 h-4 w-4" />}{item.type}</Badge>
                                            </CardHeader>
                                            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                    </div>
                    <div className="lg:col-span-1">
                        <Card className="sticky top-24">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Gift className="h-6 w-6" />
                                    Make a Donation
                                </CardTitle>
                                <CardDescription>
                                    Every contribution helps.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleDonate} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Full Name</Label>
                                        <Input id="name" placeholder="Your Name" value={donationData.name} onChange={handleDonationInputChange} required disabled={isFunded} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input id="email" type="email" placeholder="your@email.com" value={donationData.email} onChange={handleDonationInputChange} required disabled={isFunded} />
                                    </div>
                                     <div className="space-y-2">
                                        <Label htmlFor="phone">Phone Number (Optional)</Label>
                                        <Input id="phone" type="tel" placeholder="Your Phone Number" value={donationData.phone} onChange={handleDonationInputChange} disabled={isFunded} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="amount">Amount (₹)</Label>
                                        <Input id="amount" type="number" placeholder="500" value={donationData.amount} onChange={handleDonationInputChange} required disabled={isFunded} />
                                    </div>
                                    <Button type="submit" className="w-full" disabled={isFunded || isSubmitting}>
                                        {isFunded ? 'Project Funded' : (isSubmitting ? 'Processing...' : 'Donate Securely')}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
}
