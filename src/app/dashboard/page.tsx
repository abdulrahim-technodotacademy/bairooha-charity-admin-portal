"use client";

import React, { useMemo, useState, useEffect, useRef } from "react";
import Link from "next/link";
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
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent
} from "@/components/ui/chart";
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Line, LineChart } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { IndianRupee, Rocket, Users, HandCoins, Trophy, Activity, Siren } from "lucide-react";
import { projects as initialProjects, payments as initialPayments, staff, Payment, EmergencyCampaign, emergencyCampaigns as initialCampaigns } from "@/lib/data";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { subDays, eachDayOfInterval, startOfWeek, isAfter, startOfMonth, format } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";


const totalRaised = initialPayments.reduce((acc, p) => acc + p.amount, 0);
const totalProjects = initialProjects.length;
const totalStaff = staff.length;
const totalDonations = initialPayments.length;

const projectChartData = initialProjects.map(project => ({
  name: project.name.length > 15 ? `${project.name.substring(0, 12)}...` : project.name,
  raised: project.raised,
  goal: project.goal,
}));


export default function DashboardPage() {
  const [timeRange, setTimeRange] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [liveDonations, setLiveDonations] = useState<Payment[]>([]);
  const donationIndexRef = useRef(0);
  const [activeCampaign, setActiveCampaign] = useState<EmergencyCampaign | null>(null);
  const [projects, setProjects] = useState(initialProjects);
  const [payments, setPayments] = useState(initialPayments);

  useEffect(() => {
    const storedCampaigns = sessionStorage.getItem("emergencyCampaigns");
    const campaigns = storedCampaigns ? JSON.parse(storedCampaigns) : initialCampaigns;
    setActiveCampaign(campaigns.find((c: EmergencyCampaign) => c.isActive) || null);

    const storedProjects = sessionStorage.getItem("projects");
    setProjects(storedProjects ? JSON.parse(storedProjects) : initialProjects);

    const storedPayments = sessionStorage.getItem("payments");
    setPayments(storedPayments ? JSON.parse(storedPayments) : initialPayments);

  }, []);

  const activeCampaignProject = activeCampaign ? projects.find(p => p.id === activeCampaign.projectId) : null;
  const campaignProgress = activeCampaign && activeCampaignProject ? Math.min((activeCampaignProject.raised / activeCampaign.goal) * 100, 100) : 0;

  useEffect(() => {
    const sortedPayments = [...payments]
      .filter(p => p.mode !== 'Refund')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    if (sortedPayments.length === 0) return;

    const initialFeed = sortedPayments.slice(0, 5);
    setLiveDonations(initialFeed);
    
    donationIndexRef.current = 5 % sortedPayments.length;

    const interval = setInterval(() => {
      const nextDonation = sortedPayments[donationIndexRef.current];
      
      setLiveDonations(prevDonations => {
        if (!nextDonation) return prevDonations;
        const newFeed = [nextDonation, ...prevDonations].slice(0, 5);
        const uniqueFeed = Array.from(new Map(newFeed.map(item => [item.id, item])).values());
        return uniqueFeed;
      });
      
      donationIndexRef.current = (donationIndexRef.current + 1) % sortedPayments.length;
    }, 3500);

    return () => clearInterval(interval);
  }, [payments]);
  
  const topDonors = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    let targetDate = today;
    let paymentsForDate = payments.filter(p => p.date === targetDate);

    if (paymentsForDate.length === 0 && payments.length > 0) {
      targetDate = payments.reduce((max, p) => p.date > max ? p.date : max, "1970-01-01");
      paymentsForDate = payments.filter(p => p.date === targetDate);
    }
    
    if (paymentsForDate.length === 0) {
        return [];
    }

    const dailyContributions = paymentsForDate.reduce((acc, payment) => {
      const { donorName, amount } = payment;
      acc[donorName] = (acc[donorName] || 0) + amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(dailyContributions)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([name, amount]) => ({ name, amount, date: targetDate }));
  }, [payments]);

  const topDonorsDate = topDonors.length > 0 
    ? new Date(topDonors[0].date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric' }) 
    : 'today';

  const donationChartData = useMemo(() => {
    const validPayments = payments.filter(p => p.mode !== 'Refund');
    const now = new Date();

    if (timeRange === 'daily') {
        const startDate = subDays(now, 29);
        const dateRange = eachDayOfInterval({ start: startDate, end: now });
        
        const dailyData = dateRange.map(day => ({
            name: format(day, 'MMM d'),
            total: 0,
        }));
        const dataMap = new Map(dailyData.map(d => [d.name, d.total]));
        
        validPayments.forEach(p => {
            const paymentDate = new Date(p.date + 'T00:00:00');
            if (paymentDate >= startDate) {
                const dayStr = format(paymentDate, 'MMM d');
                if (dataMap.has(dayStr)) {
                    dataMap.set(dayStr, dataMap.get(dayStr)! + p.amount);
                }
            }
        });

        return Array.from(dataMap, ([name, total]) => ({ name, total }));
    }

    if (timeRange === 'weekly') {
        const data: Record<string, { name: string; total: number }> = {};
        const twelveWeeksAgo = subDays(now, 12 * 7);

        validPayments.forEach(payment => {
            const paymentDate = new Date(payment.date + 'T00:00:00');
            if (isAfter(paymentDate, twelveWeeksAgo)) {
                const weekStart = startOfWeek(paymentDate);
                const weekKey = format(weekStart, 'yyyy-MM-dd');
                if (!data[weekKey]) {
                    data[weekKey] = { name: format(weekStart, 'MMM d'), total: 0 };
                }
                data[weekKey].total += payment.amount;
            }
        });
        return Object.entries(data).sort(([keyA], [keyB]) => keyA.localeCompare(keyB)).map(([, value]) => value);
    }
    
    // monthly
    const data: Record<string, { name: string; total: number }> = {};
    const twelveMonthsAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());

    validPayments.forEach(payment => {
        const paymentDate = new Date(payment.date + 'T00:00:00');
        if (isAfter(paymentDate, twelveMonthsAgo)) {
            const monthStart = startOfMonth(paymentDate);
            const monthKey = format(monthStart, 'yyyy-MM');
            if (!data[monthKey]) {
                data[monthKey] = { name: format(monthStart, 'MMM yyyy'), total: 0 };
            }
            data[monthKey].total += payment.amount;
        }
    });
    return Object.entries(data).sort(([keyA], [keyB]) => keyA.localeCompare(keyB)).map(([, value]) => value);
  }, [timeRange, payments]);


  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          An overview of your charity's activities.
        </p>
      </div>

      {activeCampaign && activeCampaignProject && (
        <Alert variant="destructive" className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Siren className="h-6 w-6 hidden sm:block" />
            <div className="flex-grow">
                <AlertTitle className="font-bold text-lg">{activeCampaign.name}</AlertTitle>
                <AlertDescription>
                    {activeCampaign.description}
                </AlertDescription>
                <div className="mt-2">
                    <Progress value={campaignProgress} className="h-2 mb-1" />
                    <div className="text-xs text-destructive-foreground flex justify-between">
                        <span>₹{activeCampaignProject.raised.toLocaleString()} raised</span>
                        <span>₹{activeCampaign.goal.toLocaleString()} goal</span>
                    </div>
                </div>
            </div>
            <Button asChild>
                <Link href={`/dashboard/projects/${activeCampaign.projectId}`}>Donate Now</Link>
            </Button>
        </Alert>
      )}
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Raised</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalRaised.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">from {totalDonations} donations</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <Rocket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProjects}</div>
            <p className="text-xs text-muted-foreground">Across various causes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Staff Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStaff}</div>
            <p className="text-xs text-muted-foreground">Making a difference</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Donations this Month</CardTitle>
            <HandCoins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{payments.length}</div>
            <p className="text-xs text-muted-foreground">New contributions received</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <CardTitle>Donation Trends</CardTitle>
                    <CardDescription>
                      View daily, weekly, or monthly donation totals.
                    </CardDescription>
                </div>
                <Tabs defaultValue="monthly" onValueChange={(value) => setTimeRange(value as 'daily' | 'weekly' | 'monthly')}>
                    <TabsList className="grid w-full grid-cols-3 sm:w-auto">
                        <TabsTrigger value="daily">Daily</TabsTrigger>
                        <TabsTrigger value="weekly">Weekly</TabsTrigger>
                        <TabsTrigger value="monthly">Monthly</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>
        </CardHeader>
        <CardContent className="pl-2">
            <ChartContainer config={{
                total: {
                    label: "Total Donated",
                    color: "hsl(var(--chart-1))",
                }
            }} className="h-[300px] w-full">
              <LineChart data={donationChartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `₹${value.toLocaleString()}`}
                />
                <ChartTooltip
                  cursor={true}
                  content={<ChartTooltipContent
                    formatter={(value) => `₹${(value as number).toLocaleString()}`}
                    indicator="line"
                  />}
                />
                <Line
                  type="monotone"
                  dataKey="total"
                  name="Total Donated"
                  stroke="var(--color-total)"
                  strokeWidth={2}
                  dot={{
                    r: 4,
                    fill: "var(--color-total)",
                    strokeWidth: 2,
                    stroke: 'hsl(var(--background))'
                  }}
                />
              </LineChart>
            </ChartContainer>
        </CardContent>
      </Card>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              <span>Live Donation Feed</span>
            </CardTitle>
            <CardDescription>
              A real-time stream of incoming donations.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Donor</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {liveDonations.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      <div className="font-medium">{payment.donorName}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{payment.projectName}</Badge>
                    </TableCell>
                    <TableCell className="text-right">₹{payment.amount.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Donors</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground pb-4">
              {topDonors.length > 0 ? `Highest contributions for ${topDonorsDate}.` : `No donations recorded for ${topDonorsDate}.`}
            </p>
            <div className="space-y-4">
              {topDonors.map((donor, index) => (
                <div key={index} className="flex items-center">
                  <Avatar className="h-9 w-9" data-ai-hint="person">
                    <AvatarFallback>{donor.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">{donor.name}</p>
                  </div>
                  <div className="ml-auto font-medium">₹{donor.amount.toLocaleString()}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Projects Overview</CardTitle>
            <CardDescription>Funding progress for active projects.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{
              raised: { label: "Raised", color: "hsl(var(--chart-1))" },
              goal: { label: "Goal", color: "hsl(var(--chart-2))" }
            }} className="h-[250px] w-full">
              <BarChart data={projectChartData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" dataKey="goal" hide />
                <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} width={80} />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent />}
                />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey="goal" fill="var(--color-goal)" radius={4} />
                <Bar dataKey="raised" fill="var(--color-raised)" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
