
'use client';

import {
  Plane,
  Bus,
  Train,
  Smartphone,
  AppWindow,
  Satellite,
  Play,
  Lightbulb,
  CreditCard,
  Percent,
  Fuel,
  Shield,
  Flame,
  PlusCircle,
  Gift,
  Settings,
  Car,
  HeartPulse,
  Landmark,
  GraduationCap,
  ArrowRight,
  BarChart as BarChartIcon,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useWallet } from '@/contexts/WalletContext';


interface ServiceItemProps {
  icon: React.ReactNode;
  label: string;
  href?: string;
}

const ServiceItem = ({ icon, label, href = '#' }: ServiceItemProps) => (
  <Link href={href} className="flex flex-col items-center justify-center gap-2 p-3 text-center transition-colors rounded-lg hover:bg-primary/5">
    <div className="flex items-center justify-center w-16 h-16 rounded-full bg-secondary/10 text-secondary">
       {icon}
    </div>
    <span className="text-sm font-medium text-foreground">{label}</span>
  </Link>
);

// Mock data for the budget chart
const budgetData = [
  { name: 'Jan', spending: 4000 },
  { name: 'Feb', spending: 3000 },
  { name: 'Mar', spending: 5000 },
  { name: 'Apr', spending: 4500 },
  { name: 'May', spending: 6000 },
  { name: 'Jun', spending: 5500 },
];


export default function AmazonPayPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { balance, addBalance } = useWallet();

  const [amountToAdd, setAmountToAdd] = useState('');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);
  
  const handleAddMoney = () => {
    const amount = parseFloat(amountToAdd);
    if (!isNaN(amount) && amount > 0) {
      addBalance(amount);
      toast({
        title: 'Success',
        description: `₹${amount.toFixed(2)} added to your Amazon Pay balance.`,
        className: 'bg-green-500 text-white',
      });
      setAmountToAdd('');
    } else {
      toast({
        variant: 'destructive',
        title: 'Invalid Amount',
        description: 'Please enter a valid positive number.',
      });
    }
  };


  const travelServices = [
    { icon: <Plane size={32} />, label: 'Flights' },
    { icon: <Bus size={32} />, label: 'Bus Tickets' },
    { icon: <Train size={32} />, label: 'Trains' },
  ];

  const rechargeServices = [
    { icon: <Smartphone size={32} />, label: 'Mobile Recharge' },
    { icon: <AppWindow size={32} />, label: 'App Store Code' },
    { icon: <Satellite size={32} />, label: 'DTH Recharge' },
    { icon: <Play size={32} />, label: 'Google Play Recharge' },
  ];

  const billServices = [
    { icon: <Lightbulb size={32} />, label: 'Electricity' },
    { icon: <Smartphone size={32} />, label: 'Mobile Postpaid' },
    { icon: <CreditCard size={32} />, label: 'Credit Card Bill' },
    { icon: <Percent size={32} />, label: 'Loan Repayment' },
    { icon: <Fuel size={32} />, label: 'LPG' },
    { icon: <Shield size={32} />, label: 'Insurance Premium' },
    { icon: <Flame size={32} />, label: 'Piped Gas' },
    { icon: <Car size={32} />, label: 'FASTag Recharge' },
    { icon: <HeartPulse size={32} />, label: 'Health Insurance' },
    { icon: <Landmark size={32} />, label: 'Municipal Tax' },
    { icon: <GraduationCap size={32} />, label: 'Education Fee' }
  ];
  
  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex h-[calc(100vh-200px)] w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="bg-muted/30 min-h-screen">
      <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6">
            <h1 className="text-2xl font-semibold text-gray-500">Q-Pay</h1>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-3">
            <Card className="shadow-md">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base font-semibold">Q-Pay Balance</CardTitle>
                <span className="text-base font-bold text-primary">₹{balance.toFixed(2)}</span>
              </CardHeader>
              <CardContent>
                 <Separator className="my-4" />
                 <nav className="flex flex-col space-y-1">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" className="justify-start gap-2 text-blue-600 hover:text-blue-700">
                          <PlusCircle size={20}/> Add Money
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>Add Money to Balance</DialogTitle>
                          <DialogDescription>
                            Enter the amount you want to add. This is for demonstration purposes.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="amount" className="text-right">
                              Amount
                            </Label>
                            <Input
                              id="amount"
                              type="number"
                              value={amountToAdd}
                              onChange={(e) => setAmountToAdd(e.target.value)}
                              placeholder="e.g., 500"
                              className="col-span-3"
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <DialogClose asChild>
                            <Button type="button" onClick={handleAddMoney}>Add to Balance</Button>
                          </DialogClose>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                     <Button variant="ghost" className="justify-start gap-2 text-blue-600 hover:text-blue-700">
                        <Gift size={20}/> Add Gift Card
                    </Button>
                     <Button variant="ghost" className="justify-start gap-2 text-blue-600 hover:text-blue-700">
                        <Settings size={20}/> Account Settings
                    </Button>
                 </nav>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-9 space-y-6">
            {/* BUDGET INSIGHTS CARD */}
            <Card className="shadow-md">
                <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2">
                        <BarChartIcon size={24} /> Budget Insights
                    </CardTitle>
                    <CardDescription>A quick look at your recent spending patterns.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={budgetData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <XAxis dataKey="name" stroke="hsl(var(--foreground))" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="hsl(var(--foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value / 1000}k`} />
                                <Tooltip
                                    cursor={{fill: 'hsl(var(--muted))'}}
                                    contentStyle={{
                                        background: "hsl(var(--background))",
                                        border: "1px solid hsl(var(--border))",
                                        borderRadius: "0.5rem",
                                    }}
                                />
                                <Bar dataKey="spending" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button asChild className="w-full">
                        <Link href="/budget">
                            Go to Full Budget Analysis <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </CardFooter>
            </Card>
            
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-xl">Travel</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                {travelServices.map(service => <ServiceItem key={service.label} {...service} />)}
              </CardContent>
            </Card>

            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-xl">Recharges</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                {rechargeServices.map(service => <ServiceItem key={service.label} {...service} />)}
              </CardContent>
            </Card>

            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-xl">Bill Payments</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                {billServices.map(service => <ServiceItem key={service.label} {...service} />)}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
