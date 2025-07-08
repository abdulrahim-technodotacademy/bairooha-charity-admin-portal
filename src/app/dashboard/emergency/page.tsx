"use client";

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Siren, Loader2, PartyPopper, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { emergencyCampaigns as initialCampaigns, EmergencyCampaign, projects as initialProjects, Project } from '@/lib/data';
import { broadcastEmergencyAlert, BroadcastEmergencyAlertOutput } from '@/ai/flows/broadcast-emergency-alert-flow';
import Link from 'next/link';

const initialFormData = {
  name: "",
  description: "",
  goal: "",
  broadcastMessage: "",
};

export default function EmergencyPage() {
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [campaigns, setCampaigns] = useState<EmergencyCampaign[]>([]);
  const [formData, setFormData] = useState(initialFormData);
  const [isLoading, setIsLoading] = useState(false);
  const [broadcastPreview, setBroadcastPreview] = useState<BroadcastEmergencyAlertOutput | null>(null);

  useEffect(() => {
    const storedProjects = sessionStorage.getItem("projects");
    setProjects(storedProjects ? JSON.parse(storedProjects) : initialProjects);

    const storedCampaigns = sessionStorage.getItem("emergencyCampaigns");
    setCampaigns(storedCampaigns ? JSON.parse(storedCampaigns) : initialCampaigns);
  }, []);

  useEffect(() => {
    sessionStorage.setItem("projects", JSON.stringify(projects));
  }, [projects]);
  
  useEffect(() => {
    sessionStorage.setItem("emergencyCampaigns", JSON.stringify(campaigns));
  }, [campaigns]);

  const activeCampaign = campaigns.find(c => c.isActive);
  
  const activeCampaignProject = activeCampaign ? projects.find(p => p.id === activeCampaign.projectId) : null;
  
  const progress = activeCampaign && activeCampaignProject ? Math.min((activeCampaignProject.raised / activeCampaign.goal) * 100, 100) : 0;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };
  
  const handleLaunchCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeCampaign) return;
    setIsLoading(true);

    try {
      const goalAmount = parseFloat(formData.goal) || 0;
      
      const broadcastContent = await broadcastEmergencyAlert({
        campaignName: formData.name,
        description: formData.description,
        goal: goalAmount,
        message: formData.broadcastMessage,
      });

      const newProjectId = `proj-emergency-${Date.now()}`;
      
      const newProject: Project = {
        id: newProjectId,
        name: formData.name,
        description: formData.description,
        goal: goalAmount,
        raised: 0,
        media: [],
      };

      const newCampaign: EmergencyCampaign = {
        id: `emergency-${Date.now()}`,
        name: formData.name,
        description: formData.description,
        goal: goalAmount,
        isActive: true,
        broadcastMessage: formData.broadcastMessage,
        projectId: newProjectId,
      };

      setProjects(prev => [newProject, ...prev]);
      setCampaigns(prev => prev.map(c => ({...c, isActive: false})).concat(newCampaign));
      
      setBroadcastPreview(broadcastContent);
      setFormData(initialFormData);
      
      toast({
        title: "Campaign Launched!",
        description: `${formData.name} is now live.`,
      });

    } catch (error) {
      console.error("Failed to launch campaign:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not launch the emergency campaign. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndCampaign = () => {
    setCampaigns(campaigns.map(c => c.id === activeCampaign?.id ? {...c, isActive: false} : c));
    toast({
        title: "Campaign Ended",
        description: `${activeCampaign?.name} has been concluded.`,
      });
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Emergency Response</h1>
        <p className="text-muted-foreground">
          Launch and manage urgent donation campaigns during a crisis.
        </p>
      </div>

      {activeCampaign ? (
        <Card className="border-destructive">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <Siren className="h-6 w-6" />
                  <span>Active Emergency Campaign</span>
                </CardTitle>
                <CardDescription>
                  The following campaign is currently live. All donations are being directed to this cause.
                </CardDescription>
              </div>
              <Button variant="destructive" onClick={handleEndCampaign}>End Campaign</Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <h2 className="text-2xl font-bold">{activeCampaign.name}</h2>
            <p className="text-muted-foreground">{activeCampaign.description}</p>
            <div>
              <Progress value={progress} className="mb-2 h-3" />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Raised: ₹{activeCampaignProject?.raised.toLocaleString() || 0}</span>
                <span>Goal: ₹{activeCampaign.goal.toLocaleString()}</span>
              </div>
            </div>
            <Button asChild>
                <Link href={`/dashboard/projects/${activeCampaign.projectId}`}>View Project Details</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PartyPopper className="h-6 w-6" />
              <span>Launch a New Campaign</span>
            </CardTitle>
            <CardDescription>
              Fill out the form below to start a new emergency fundraiser and broadcast alerts.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLaunchCampaign} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Campaign Name</Label>
                <Input id="name" placeholder="e.g., Hurricane Relief Fund" value={formData.name} onChange={handleInputChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Campaign Description</Label>
                <Textarea id="description" placeholder="Briefly describe the crisis and what the funds will be used for." value={formData.description} onChange={handleInputChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="goal">Funding Goal (₹)</Label>
                <Input id="goal" type="number" placeholder="50000" value={formData.goal} onChange={handleInputChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="broadcastMessage">Broadcast Message</Label>
                <Textarea id="broadcastMessage" placeholder="Enter the core message to be included in the alerts (e.g., 'Your help is urgently needed...')" value={formData.broadcastMessage} onChange={handleInputChange} required />
                <p className="text-xs text-muted-foreground">This message will be used by the AI to generate Email, SMS, and Push Notifications.</p>
              </div>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Siren className="mr-2 h-4 w-4" />}
                Launch Emergency Campaign
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {!activeCampaign && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>How It Works</AlertTitle>
          <AlertDescription>
            When you launch a campaign, an AI will generate alert messages. A new project will be created to track donations, and an alert will appear on the main dashboard. In a real app, this would also send push notifications, emails, and SMS messages to all users.
          </AlertDescription>
        </Alert>
      )}

      <Dialog open={!!broadcastPreview} onOpenChange={() => setBroadcastPreview(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>AI-Generated Broadcast Preview</DialogTitle>
            <DialogDescription>
              These are the messages generated for the campaign alerts. In a real app, these would be sent automatically.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <h4 className="font-semibold text-lg">Push Notification</h4>
              <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">{broadcastPreview?.pushNotification}</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-lg">SMS Message</h4>
              <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">{broadcastPreview?.smsMessage}</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-lg">Email</h4>
              <div className="bg-muted p-3 rounded-md space-y-2">
                <p className="text-sm"><strong>Subject:</strong> {broadcastPreview?.emailSubject}</p>
                <p className="text-sm whitespace-pre-wrap"><strong>Body:</strong><br/>{broadcastPreview?.emailBody}</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBroadcastPreview(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
