
"use client";

import React, { useMemo, useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { payments as initialPayments } from '@/lib/data';
import { HandHeart, Mail, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { sendThankYouEmail, SendThankYouEmailOutput } from '@/ai/flows/send-thank-you-email-flow';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { detectFraud } from '@/ai/flows/detect-fraud-flow';


type DonorInfo = {
  name: string;
  totalDonated: number;
  donationCount: number;
  lastDonationDate: string;
  engagementScore: number;
};

export default function DonorsPage() {
  const { toast } = useToast();
  const [payments, setPayments] = useState(initialPayments);
  const [loadingDonor, setLoadingDonor] = useState<string | null>(null);
  const [generatedEmail, setGeneratedEmail] = useState<SendThankYouEmailOutput | null>(null);
  const [fraudAnalysis, setFraudAnalysis] = useState<Record<string, { isSuspicious: boolean; reason: string } | null>>({});
  const [analysisLoading, setAnalysisLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const storedPayments = sessionStorage.getItem("payments");
    setPayments(storedPayments ? JSON.parse(storedPayments) : initialPayments);
  }, []);

  const donorData = useMemo(() => {
    const donors: Record<string, Omit<DonorInfo, 'engagementScore'>> = {};

    payments.forEach(payment => {
      if (payment.mode === 'Refund') {
        return;
      }

      if (!donors[payment.donorName]) {
        donors[payment.donorName] = {
          name: payment.donorName,
          totalDonated: 0,
          donationCount: 0,
          lastDonationDate: '1970-01-01',
        };
      }

      const donor = donors[payment.donorName];
      donor.totalDonated += payment.amount;
      donor.donationCount += 1;
      if (payment.date > donor.lastDonationDate) {
        donor.lastDonationDate = payment.date;
      }
    });

    const allDonors = Object.values(donors);
    if (allDonors.length === 0) return [];

    const maxTotalDonated = Math.max(...allDonors.map(d => d.totalDonated), 1);
    const maxDonationCount = Math.max(...allDonors.map(d => d.donationCount), 1);
    
    const calculateEngagementScore = (donor: Omit<DonorInfo, 'engagementScore'>): number => {
      const daysSinceLastDonation = (new Date().getTime() - new Date(donor.lastDonationDate + 'T00:00:00').getTime()) / (1000 * 3600 * 24);
      let recencyScore = 0;
      if (daysSinceLastDonation <= 30) recencyScore = 40;
      else if (daysSinceLastDonation <= 90) recencyScore = 30;
      else if (daysSinceLastDonation <= 180) recencyScore = 20;
      else if (daysSinceLastDonation <= 365) recencyScore = 10;
      
      const monetaryScore = (Math.log(donor.totalDonated + 1) / Math.log(maxTotalDonated + 1)) * 30;
      const frequencyScore = (donor.donationCount / maxDonationCount) * 30;

      return Math.min(100, Math.round(recencyScore + monetaryScore + frequencyScore));
    };
    
    const donorsWithScores: DonorInfo[] = allDonors.map(donor => ({
        ...donor,
        engagementScore: calculateEngagementScore(donor)
    }));

    return donorsWithScores.sort((a, b) => b.engagementScore - a.engagementScore);
  }, [payments]);

  useEffect(() => {
    const analyzeDonors = async () => {
      if (donorData.length === 0) return;

      const initialLoadingState = donorData.reduce((acc, donor) => ({ ...acc, [donor.name]: true }), {});
      setAnalysisLoading(initialLoadingState);

      const analysisPromises = donorData.map(async (donor) => {
        try {
          const donorTransactions = payments
            .filter(p => p.donorName === donor.name)
            .map(p => ({
              amount: p.amount,
              date: p.date,
              mode: p.mode,
            }));

          if (donorTransactions.length > 0) {
            const result = await detectFraud({
              donorName: donor.name,
              transactions: donorTransactions,
            });
            return { donorName: donor.name, result };
          }
        } catch (error) {
          console.error(`Fraud analysis failed for ${donor.name}:`, error);
        }
        return { donorName: donor.name, result: null };
      });

      const results = await Promise.all(analysisPromises);
      
      const newAnalysis: Record<string, { isSuspicious: boolean; reason: string } | null> = {};
      const newLoadingState: Record<string, boolean> = {};

      results.forEach(item => {
        if (item) {
          newAnalysis[item.donorName] = item.result;
          newLoadingState[item.donorName] = false;
        }
      });
      
      setFraudAnalysis(newAnalysis);
      setAnalysisLoading(newLoadingState);
    };

    analyzeDonors();
  }, [donorData, payments]);


  const handleSendEmail = async (donor: DonorInfo) => {
    setLoadingDonor(donor.name);
    try {
      const result = await sendThankYouEmail({
        donorName: donor.name,
        totalDonated: donor.totalDonated,
        donationCount: donor.donationCount,
      });
      setGeneratedEmail(result);
    } catch (error) {
      console.error("Failed to generate email:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate the thank you email.",
      });
    } finally {
      setLoadingDonor(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString + 'T00:00:00').toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("");
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Donors</h1>
        <p className="text-muted-foreground">
          A list of all individuals and organizations that have donated, with AI-powered fraud analysis.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <HandHeart className="h-6 w-6" />
                    <span>Top Supporters</span>
                </CardTitle>
                <CardDescription>
                    Our most engaged donors based on contributions, frequency, and fraud analysis.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Donor</TableHead>
                            <TableHead>Engagement Score</TableHead>
                            <TableHead className="text-right">Total Donated</TableHead>
                            <TableHead className="text-center">Donations</TableHead>
                            <TableHead>Last Donation</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {donorData.map(donor => (
                            <TableRow key={donor.name}>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-9 w-9" data-ai-hint="person">
                                            <AvatarFallback>{getInitials(donor.name)}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex items-center gap-2">
                                          <span className="font-medium">{donor.name}</span>
                                          {analysisLoading[donor.name] && (
                                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                          )}
                                          {fraudAnalysis[donor.name]?.isSuspicious && (
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger>
                                                        <AlertTriangle className="h-4 w-4 text-destructive" />
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p className="font-semibold">Suspicious Activity Detected</p>
                                                        <p className="text-sm text-muted-foreground max-w-xs">{fraudAnalysis[donor.name]?.reason}</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                          )}
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div className="w-24">
                                                    <Progress value={donor.engagementScore} className="h-2" />
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Engagement: {donor.engagementScore} / 100</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                    ₹{donor.totalDonated.toLocaleString()}
                                </TableCell>
                                <TableCell className="text-center">
                                    {donor.donationCount}
                                </TableCell>
                                <TableCell>
                                    {formatDate(donor.lastDonationDate)}
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleSendEmail(donor)}
                                      disabled={loadingDonor === donor.name}
                                    >
                                      {loadingDonor === donor.name ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      ) : (
                                        <Mail className="mr-2 h-4 w-4" />
                                      )}
                                      Send Thank You
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
      </div>

      <Dialog open={!!generatedEmail} onOpenChange={(isOpen) => !isOpen && setGeneratedEmail(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Generated Email Preview</DialogTitle>
            <DialogDescription>
              This is the email that was generated for the donor. In a real app, this would be sent automatically.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1">
              <h4 className="font-medium">Subject:</h4>
              <p className="text-sm text-muted-foreground bg-muted p-2 rounded-md">{generatedEmail?.emailSubject}</p>
            </div>
            <div className="space-y-1">
              <h4 className="font-medium">Body:</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted p-4 rounded-md">{generatedEmail?.emailBody}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGeneratedEmail(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
