
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { FHE } from '@/lib/fhe';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Lock, AlertTriangle, ShieldCheck, Loader2, Save, BrainCircuit } from 'lucide-react';
import { AnimatedLoader } from '@/components/icons/AnimatedLoader';
import { Separator } from '@/components/ui/separator';
import { getSalaryManagementAdvice, type SalaryManagementOutput } from '@/ai/flows/salary-management-flow';

function FhePrivacyPageContent() {
  const searchParams = useSearchParams();
  const { toast } = useToast();

  // PIN Lock State
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string | null>(null);
  const CORRECT_PIN = '1234';


  // State for the transaction form
  const [amount, setAmount] = useState<number>(0);
  const [category, setCategory] = useState<string>('');
  
  // State for the budget setting form
  const [budgetInput, setBudgetInput] = useState<number>(12000);
  const [budgetLimit, setBudgetLimit] = useState<number>(12000);
  
  // State for FHE results
  const [encryptedTotal, setEncryptedTotal] = useState<string | null>(null);
  const [encryptedAlert, setEncryptedAlert] = useState<string | null>(null);
  
  // State for loading and errors
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isSettingBudget, setIsSettingBudget] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Salary Advice State
  const [selectedSalaryRange, setSelectedSalaryRange] = useState<string>('');
  const [isFetchingAdvice, setIsFetchingAdvice] = useState<boolean>(false);
  const [adviceResult, setAdviceResult] = useState<SalaryManagementOutput | null>(null);
  const [adviceError, setAdviceError] = useState<string | null>(null);

  useEffect(() => {
    const cartAmount = searchParams.get('fromCart');
    if (cartAmount) {
      const parsedAmount = parseFloat(cartAmount);
      if (!isNaN(parsedAmount) && parsedAmount > 0) {
        setAmount(parsedAmount);
        setCategory('amazon-cart');
        toast({
          title: 'Details from Cart',
          description: `Transaction amount of ₹${parsedAmount.toLocaleString()} and category 'Amazon Cart' have been pre-filled.`,
        });
      }
    }
  }, [searchParams, toast]);

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === CORRECT_PIN) {
        setIsUnlocked(true);
        setPinError(null);
        toast({ title: "Unlocked", description: "FHE features are now accessible.", className: 'bg-green-500 text-white' });
    } else {
        setPinError("Incorrect PIN. Please try again.");
        setPinInput('');
        toast({ variant: "destructive", title: "Incorrect PIN", description: "Access denied." });
    }
  };


  const handleSetBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (budgetInput <= 0) {
      toast({
        variant: 'destructive',
        title: 'Invalid Budget',
        description: 'Please enter a positive number for your budget limit.',
      });
      return;
    }
    
    setIsSettingBudget(true);
    setError(null);
    setEncryptedTotal(null); // Reset results when budget changes
    setEncryptedAlert(null);

    try {
      const encryptedBudget = FHE.encrypt(budgetInput);

      const response = await fetch('/api/compute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ctBudget: encryptedBudget }),
      });
      
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Server responded with an error while setting budget.');
      }
      
      setBudgetLimit(budgetInput);
      toast({
        title: 'Private Budget Set',
        description: `Your new encrypted budget of ₹${budgetInput.toLocaleString()} has been set on the server. Total spend has been reset.`,
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(errorMessage);
      toast({
        variant: 'destructive',
        title: 'Setting Budget Failed',
        description: errorMessage,
      });
    } finally {
      setIsSettingBudget(false);
    }
  };


  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0 || !category) {
      toast({
        variant: 'destructive',
        title: 'Invalid Input',
        description: 'Please enter a positive amount and select a category.',
      });
      return;
    }
    
    setIsProcessing(true);
    setError(null);

    try {
      // 1. Encrypt the amount client-side. The category is for UI purposes only in this demo.
      const encryptedAmount = FHE.encrypt(amount);
      
      // 2. Send only the encrypted data to the server.
      const response = await fetch('/api/compute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ctAmount: encryptedAmount }),
      });

      if (!response.ok) {
        throw new Error('Server responded with an error.');
      }

      const data = await response.json();
      
      // 3. Receive encrypted results from the server.
      setEncryptedTotal(data.ctTotal);
      setEncryptedAlert(data.ctAlert);
      
      toast({
        title: 'Computation Successful',
        description: 'Received encrypted budget data from the server.',
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(errorMessage);
      toast({
        variant: 'destructive',
        title: 'Computation Failed',
        description: errorMessage,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGetAdvice = async () => {
    if (!selectedSalaryRange) {
      toast({
        variant: 'destructive',
        title: 'No Salary Range Selected',
        description: 'Please choose a salary range to get advice.',
      });
      return;
    }
    setIsFetchingAdvice(true);
    setAdviceError(null);
    setAdviceResult(null);

    try {
      const result = await getSalaryManagementAdvice({ salaryRange: selectedSalaryRange });
      setAdviceResult(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setAdviceError(errorMessage);
      toast({
        variant: 'destructive',
        title: 'Failed to get advice',
        description: errorMessage,
      });
    } finally {
      setIsFetchingAdvice(false);
    }
  };

  const totalSpent = encryptedTotal ? FHE.decrypt(encryptedTotal) : 0;
  const isOverBudget = encryptedAlert ? FHE.decrypt(encryptedAlert) === 1 : false;

  if (!isUnlocked) {
    return (
        <div className="container mx-auto flex min-h-[calc(100vh-200px)] items-center justify-center px-4 py-8">
            <Card className="w-full max-w-sm shadow-xl">
                <CardHeader className="text-center">
                    <Lock size={48} className="mx-auto text-primary mb-4" />
                    <CardTitle className="text-2xl">Enter Security PIN</CardTitle>
                    <CardDescription>
                        Access to these privacy features is protected.
                        <br />
                        (Hint: the PIN is 1234)
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handlePinSubmit}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="pin-input" className="sr-only">4-Digit PIN</Label>
                            <Input
                                id="pin-input"
                                type="password"
                                value={pinInput}
                                onChange={(e) => {
                                    if (/^\d{0,4}$/.test(e.target.value)) {
                                        setPinInput(e.target.value);
                                    }
                                }}
                                maxLength={4}
                                placeholder="••••"
                                className="h-14 text-center text-4xl tracking-[1rem]"
                                required
                                autoFocus
                            />
                        </div>
                        {pinError && <p className="text-sm text-destructive text-center">{pinError}</p>}
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" className="w-full" disabled={pinInput.length !== 4}>
                            Unlock
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
  }


  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      <Card className="max-w-2xl mx-auto shadow-xl">
        <CardHeader className="bg-primary/10 p-6 text-center">
          <Lock size={48} className="mx-auto text-primary mb-4" />
          <CardTitle className="font-headline text-3xl font-bold text-primary">
            FHE-Powered Budget Tracker
          </CardTitle>
          <CardDescription className="text-lg text-muted-foreground mt-2">
            Your transaction data is encrypted on your device and remains encrypted on our servers.
          </CardDescription>
        </CardHeader>
        
        {/* Set Budget Form */}
        <form onSubmit={handleSetBudget}>
          <CardContent className="p-6 space-y-4">
             <h3 className="text-xl font-semibold">1. Set Your Private Budget</h3>
             <p className="text-sm text-muted-foreground">
                Set your total budget limit. This value will be encrypted before being sent. Changing this will reset your total spend.
             </p>
              <div className="space-y-2">
                <Label htmlFor="budget">Budget Limit (₹)</Label>
                <div className="flex items-center gap-2">
                    <Input
                      id="budget"
                      type="number"
                      placeholder="e.g., 12000"
                      value={budgetInput}
                      onChange={(e) => setBudgetInput(Number(e.target.value))}
                      min="1"
                      required
                      disabled={isSettingBudget || isProcessing}
                    />
                     <Button type="submit" disabled={isSettingBudget || isProcessing} size="lg">
                        {isSettingBudget ? (
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        ) : (
                           <Save className="mr-2 h-5 w-5"/>
                        )}
                        Set Budget
                    </Button>
                </div>
              </div>
          </CardContent>
        </form>

        <Separator />

        {/* Add Transaction Form */}
        <form onSubmit={handleAddTransaction}>
          <CardContent className="p-6 space-y-6">
             <h3 className="text-xl font-semibold">2. Add a Secure Transaction</h3>
              <div className="space-y-2">
                <Label htmlFor="amount">Transaction Amount (₹)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="e.g., 500"
                  value={amount <= 0 ? '' : amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  min="1"
                  required
                  disabled={isProcessing || isSettingBudget}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={category}
                  onValueChange={setCategory}
                  required
                  disabled={isProcessing || isSettingBudget}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="amazon-cart">Amazon Cart</SelectItem>
                    <SelectItem value="grocery">Grocery</SelectItem>
                    <SelectItem value="fashion">Fashion</SelectItem>
                    <SelectItem value="electronics">Electronics</SelectItem>
                  </SelectContent>
                </Select>
              </div>
               <Button type="submit" disabled={isProcessing || isSettingBudget} size="lg" className="w-full">
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Computing Encrypted Budget...
                  </>
                ) : (
                  'Add Transaction Securely'
                )}
              </Button>
          </CardContent>
        </form>

        {error && <p className="text-destructive text-sm mt-2 text-center pb-6 px-6">{error}</p>}

        {encryptedTotal !== null && (
          <div className="p-6 border-t">
            <h3 className="text-xl font-semibold text-center mb-4">Your Private Budget Status</h3>
            <div className="text-center p-6 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Total Encrypted Spend / Budget Limit</p>
                <p className="text-3xl font-bold mt-1">₹{totalSpent.toLocaleString()} / ₹{budgetLimit.toLocaleString()}</p>
                
                {isOverBudget ? (
                   <div className="mt-4 flex items-center justify-center gap-2 p-3 bg-destructive/10 text-destructive border border-destructive/20 rounded-md">
                     <AlertTriangle size={20} />
                     <span className="font-semibold">Alert: You are over budget!</span>
                   </div>
                ) : (
                   <div className="mt-4 flex items-center justify-center gap-2 p-3 bg-green-500/10 text-green-700 border border-green-500/20 rounded-md">
                    <ShieldCheck size={20} />
                    <span className="font-semibold">You are within your budget.</span>
                  </div>
                )}
            </div>
             <p className="text-xs text-muted-foreground mt-4 text-center">
                Note: The total spend and budget alert were calculated on the server using encrypted data. The result was decrypted only here in your browser.
             </p>
          </div>
        )}
      </Card>

      <Card className="max-w-2xl mx-auto shadow-xl">
        <CardHeader className="bg-primary/10 p-6">
          <div className="flex items-center gap-3">
            <BrainCircuit size={48} className="text-primary" />
            <div>
              <CardTitle className="font-headline text-3xl font-bold text-primary">
                Private Salary Management
              </CardTitle>
              <CardDescription className="text-lg text-muted-foreground mt-1">
                Get financial advice without revealing your exact salary.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="salary-range">Select Your Monthly Salary Range (INR)</Label>
            <Select onValueChange={setSelectedSalaryRange} value={selectedSalaryRange} disabled={isFetchingAdvice}>
              <SelectTrigger id="salary-range">
                <SelectValue placeholder="Choose a range..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30000-50000">₹30,000 - ₹50,000</SelectItem>
                <SelectItem value="50001-80000">₹50,001 - ₹80,000</SelectItem>
                <SelectItem value="80001-120000">₹80,001 - ₹1,20,000</SelectItem>
                <SelectItem value="120001-200000">₹1,20,001 - ₹2,00,000</SelectItem>
                <SelectItem value="200001+">₹2,00,001+</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleGetAdvice} disabled={isFetchingAdvice || !selectedSalaryRange} className="w-full">
            {isFetchingAdvice ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Getting Your Private Advice...</>
            ) : (
              'Get AI Financial Plan'
            )}
          </Button>
        </CardContent>

        {(isFetchingAdvice || adviceResult || adviceError) && (
          <CardFooter className="p-6 pt-0 flex-col items-start">
            <Separator className="mb-6"/>
            {isFetchingAdvice && (
                <div className="flex items-center justify-center w-full gap-2 text-muted-foreground">
                    <AnimatedLoader size={30} />
                    <span>Generating your secure financial plan...</span>
                </div>
            )}
            {adviceError && (
                <div className="text-destructive text-sm p-4 bg-destructive/10 w-full rounded-md">
                    <strong>Error:</strong> {adviceError}
                </div>
            )}
            {adviceResult && (
                <div className="space-y-4 w-full">
                    <h3 className="text-xl font-semibold">Your Private Financial Plan</h3>
                    <div className="p-4 bg-muted rounded-md text-sm space-y-6">
                        <p className="text-foreground/90">{adviceResult.greeting}</p>
                        
                        {adviceResult.plan.map((section, sectionIndex) => (
                            <div key={sectionIndex} className="space-y-2">
                                <h4 className="text-base font-bold text-foreground">{section.heading}</h4>
                                <ul className="pl-5 space-y-1.5">
                                    {section.items.map((item, itemIndex) => (
                                        <li key={itemIndex} className="text-muted-foreground">
                                            <span className="font-semibold text-foreground">{item.title}:</span> {item.details}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}

                        <p className="pt-2 text-foreground/90">{adviceResult.closing}</p>
                    </div>
                </div>
            )}
          </CardFooter>
        )}
      </Card>

    </div>
  );
}


export default function FhePrivacyPage() {
    return (
        <Suspense fallback={
            <div className="flex h-screen items-center justify-center">
                <AnimatedLoader size={48} />
            </div>
        }>
            <FhePrivacyPageContent />
        </Suspense>
    )
}
