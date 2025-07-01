
'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { AnimatedLoader } from '@/components/icons/AnimatedLoader';
import { Lightbulb, CreditCard, AlertTriangle, CheckCircle, ShoppingCart, Wifi, WifiOff, ListChecks, Info, Search, Package, PackageCheck, Truck, Award, ExternalLink, Wallet, ScanSearch, Loader2, Send, Clock, Gem } from 'lucide-react';
import type { SuggestPaymentMethodInput, SuggestPaymentMethodOutput } from '@/ai/flows/suggest-payment-method-flow';
import { suggestPaymentMethod } from '@/ai/flows/suggest-payment-method-flow';
import { useNetworkStatus } from '@/contexts/NetworkStatusContext';
import { cn } from '@/lib/utils';
import type { PaymentMethodDetail, QueuedPayment, PaymentHistoryItem, PaymentDetails } from '@/types';
import { generateSha256Hash } from '@/lib/cryptoUtils';
import { format, addDays } from 'date-fns';
import { useWallet } from '@/contexts/WalletContext';
import { Input } from '@/components/ui/input';
import { useQsp } from '@/contexts/QspContext';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';


// Mocked available methods
const mockAvailablePaymentMethods: PaymentMethodDetail[] = [
  { id: 'amazon-pay-icici', name: 'Amazon Pay ICICI Card', type: 'card' },
  { id: 'upi', name: 'UPI', type: 'upi' },
  { id: 'hdfc-millennia', name: 'HDFC Millennia Card', type: 'card' },
  { id: 'amazon-pay-wallet', name: 'Amazon Pay Wallet', type: 'wallet' },
];

const OFFLINE_QUEUE_KEY = 'offlinePaymentQueue';
const OFFLINE_HISTORY_KEY = 'offlinePaymentHistory';
const GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';


function CheckoutPageContent() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { isOnline, toggleSimulatedStatus, isSimulatedOffline } = useNetworkStatus();
  const { balance, deductBalance } = useWallet();
  const { qspBalance, addQsp, deductQsp } = useQsp();
  
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails>({ // Used to store amount and merchant for success screen
    userId: 'user-checkout-dynamic',
    merchantName: 'Selected Merchant', // This will be generic for now
    merchantId: 'merchant-dynamic',
    amount: 0,
    currency: '₹',
    paymentMethod: '', // Will be filled by selected method
    deviceId: 'device-checkout-web',
    ipAddress: '127.0.0.1', // Mock IP
    timestamp: new Date().toISOString(),
  });
  const [amount, setAmount] = useState<number>(0); // Legacy amount, primarily from URL
  const [merchantType, setMerchantType] = useState<'fashion' | 'electronics' | 'groceries' | 'general' | 'travel'>('general');
  const [paymentSuggestion, setPaymentSuggestion] = useState<SuggestPaymentMethodOutput | null>(null);
  const [isLoadingSuggestion, setIsLoadingSuggestion] = useState<boolean>(false);
  const [errorSuggestion, setErrorSuggestion] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');
  const [selectedMethodId, setSelectedMethodId] = useState<string | null>(null);
  const [displayedMethods, setDisplayedMethods] = useState<PaymentMethodDetail[]>(mockAvailablePaymentMethods);
  
  const [confirmedOfflineOrderDetails, setConfirmedOfflineOrderDetails] = useState<QueuedPayment | null>(null);
  const [offlineOrderStatus, setOfflineOrderStatus] = useState<'pending' | 'synced' | 'unknown'>('unknown');

  // UPI State
  const [upiId, setUpiId] = useState('');
  const [isUpiVerified, setIsUpiVerified] = useState(false);
  const [upiVerificationResult, setUpiVerificationResult] = useState<{ message: string; isWarning: boolean } | null>(null);

  // QSP State
  const [applyQsp, setApplyQsp] = useState(false);
  const qspDiscount = applyQsp ? Math.min(amount, Math.floor(qspBalance / 10)) : 0;
  const qspToUse = qspDiscount * 10;
  const finalAmount = amount - qspDiscount;

  // Reset UPI state when payment method changes
  useEffect(() => {
    setUpiId('');
    setIsUpiVerified(false);
    setUpiVerificationResult(null);
  }, [selectedMethodId]);

  // Filter payment methods based on network status
  useEffect(() => {
    const newMethods = isOnline
      ? mockAvailablePaymentMethods
      : mockAvailablePaymentMethods.filter(
          method => method.type === 'upi' || method.type === 'wallet'
        );
    setDisplayedMethods(newMethods);
    
    // Reset selection if the current one disappears
    setSelectedMethodId(prev => {
        const isSelectedMethodVisible = newMethods.some(m => m.id === prev);
        if (!isSelectedMethodVisible) {
            return null;
        }
        return prev;
    });
  }, [isOnline]);

  useEffect(() => {
    const amountParam = searchParams.get('amount');
    if (amountParam) {
      const parsedAmount = parseFloat(amountParam);
      setAmount(parsedAmount);
      setPaymentDetails(prev => ({...prev, amount: parsedAmount, timestamp: new Date().toISOString() }));
    }
  }, [searchParams]);

  // Check status of confirmed offline order if it exists
  useEffect(() => {
    if (confirmedOfflineOrderDetails && confirmedOfflineOrderDetails.id) {
      if (typeof window !== 'undefined') {
        const historyString = localStorage.getItem(OFFLINE_HISTORY_KEY);
        if (historyString) {
          const history: PaymentHistoryItem[] = JSON.parse(historyString);
          const syncedItem = history.find(item => item.id === confirmedOfflineOrderDetails.id && (item.status === 'Synced' || item.status === 'Completed'));
          if (syncedItem) {
            setOfflineOrderStatus('synced');
            setConfirmedOfflineOrderDetails(prev => syncedItem ? {...prev, ...syncedItem} as QueuedPayment : prev);
          } else {
            setOfflineOrderStatus('pending');
          }
        } else {
          setOfflineOrderStatus('pending'); 
        }
      }
    }
  }, [confirmedOfflineOrderDetails, isOnline]); 

  const fetchPaymentSuggestion = async () => {
    if (amount <= 0) {
        toast({ variant: 'destructive', title: "Error", description: "Cannot fetch suggestions for zero amount." });
        return;
    }
    setIsLoadingSuggestion(true);
    setErrorSuggestion(null);
    setPaymentSuggestion(null); 
    setSelectedMethodId(null); 
    try {
      const input: SuggestPaymentMethodInput = {
        cartValue: amount,
        merchantType: merchantType,
        availablePaymentMethods: displayedMethods
      };
      const suggestion = await suggestPaymentMethod(input);
      setPaymentSuggestion(suggestion);
    } catch (error) {
      console.error("Failed to fetch payment suggestion:", error);
      setErrorSuggestion("Could not load payment suggestion. Please try again.");
      toast({ variant: 'destructive', title: "Error", description: "Failed to fetch payment suggestion." });
    } finally {
      setIsLoadingSuggestion(false);
    }
  };
  
  const getSelectedMethodName = () => {
    if (!selectedMethodId) return null;
    let name = displayedMethods.find(m => m.id === selectedMethodId)?.name;
    if (selectedMethodId === 'upi' && upiId) {
      name = `UPI (${upiId})`;
    }
    return name;
  };
  
  const handleVerifyUpi = () => {
    // A simple regex for basic UPI format validation (e.g., xxx@yyy)
    const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;

    if (upiRegex.test(upiId)) {
        setUpiVerificationResult({ message: 'Verified. You can proceed to pay or add to the offline queue.', isWarning: false });
        setIsUpiVerified(true);
        toast({ title: 'UPI ID Verified', description: 'The UPI ID format is correct.', className: 'bg-green-500 text-white' });
    } else {
        setUpiVerificationResult({ message: 'Incorrect UPI ID format. Please use a format like "name@bank".', isWarning: true });
        setIsUpiVerified(false);
        toast({ variant: 'destructive', title: 'Invalid Format', description: 'The UPI ID format is incorrect.' });
    }
  };


  const handleOnlinePayNow = async () => {
    if (!isOnline) {
        toast({ variant: 'destructive', title: 'Offline', description: 'Cannot process online payment while offline.' });
        return;
    }
     const currentSelectedMethodName = getSelectedMethodName();
     if (!currentSelectedMethodName) {
        toast({ variant: 'destructive', title: "Payment Method", description: "Please select a payment method first." });
        return;
    }
    
    if (selectedMethodId === 'amazon-pay-wallet' && balance < finalAmount) {
        toast({
            variant: 'destructive',
            title: 'Insufficient Balance',
            description: 'Your Amazon Pay Wallet balance is too low for this transaction.',
        });
        return;
    }

    if (selectedMethodId === 'upi' && !isUpiVerified) {
        toast({
            variant: 'destructive',
            title: 'UPI Not Verified',
            description: 'Please enter and verify your UPI ID before proceeding.',
        });
        return;
    }

    if (applyQsp && qspToUse > 0) {
      deductQsp(qspToUse);
    }

    const qspEarned = Math.floor(finalAmount / 10); // 1 QSP per 10 rupees

    setPaymentDetails(prev => ({
      ...prev,
      paymentMethod: currentSelectedMethodName,
      merchantId: selectedMethodId === 'upi' ? upiId : prev.merchantId,
      timestamp: new Date().toISOString(),
      amount: finalAmount, // Use final amount for payment details
      qspApplied: qspToUse,
      discountAmount: qspDiscount,
      qspEarned: qspEarned,
    }));
    setPaymentStatus('processing');
    await new Promise(resolve => setTimeout(resolve, 2000));

    const isHighRisk = Math.random() > 0.8; 

    if (isHighRisk) {
      setPaymentStatus('failed');
      toast({
        variant: 'destructive',
        title: 'Payment Blocked',
        description: 'High fraud risk detected. Payment cannot be processed.',
        duration: 8000,
      });
    } else {
      if (selectedMethodId === 'amazon-pay-wallet') {
        deductBalance(finalAmount);
      }
      
      if (qspEarned > 0) {
        addQsp(qspEarned);
      }
      
      setPaymentStatus('success');
      toast({
        title: 'Payment Successful!',
        description: `₹${finalAmount.toLocaleString()} paid. You earned ${qspEarned.toLocaleString()} QSP!`,
        className: 'bg-green-500 text-white',
      });
    }
  };

  const handleOfflinePay = async () => {
    if (isOnline) {
        toast({ title: 'Online', description: 'You are online. Use the regular payment button.' });
        return;
    }
    const currentSelectedMethodName = getSelectedMethodName();
    if (!currentSelectedMethodName || !selectedMethodId) {
        toast({ variant: 'destructive', title: "Payment Method", description: "Please select a payment method first." });
        return;
    }
     if (selectedMethodId === 'upi' && !upiId) {
        toast({
            variant: 'destructive',
            title: 'UPI ID Missing',
            description: 'Please enter a UPI ID to queue an offline payment.',
        });
        return;
    }
    setPaymentStatus('processing');
    
    try {
      if (applyQsp && qspToUse > 0) {
        deductQsp(qspToUse);
      }
      
      const qspEarned = Math.floor(finalAmount / 10);
      if (qspEarned > 0) {
        addQsp(qspEarned);
      }

      let previousHash = GENESIS_HASH;
      let queue: QueuedPayment[] = [];
      let history: PaymentHistoryItem[] = [];

      if (typeof window !== 'undefined') {
        const storedQueue = localStorage.getItem(OFFLINE_QUEUE_KEY);
        if (storedQueue) queue = JSON.parse(storedQueue);
        const storedHistory = localStorage.getItem(OFFLINE_HISTORY_KEY);
        if (storedHistory) history = JSON.parse(storedHistory);
      }

      if (queue.length > 0) {
        previousHash = queue[queue.length - 1].hash;
      } else if (history.length > 0) {
        const sortedHistory = [...history].sort((a,b) => b.numericTimestamp - a.numericTimestamp);
        if (sortedHistory.length > 0) previousHash = sortedHistory[0].hash;
      }
      
      const currentNumericTimestamp = Date.now();
      const newPaymentDataForHash: Omit<QueuedPayment, 'hash'> = {
        id: `tx_chk_${currentNumericTimestamp}_${Math.random().toString(36).substring(2, 9)}`,
        recipient: 'Offline Purchase',
        paymentMethod: {
          id: selectedMethodId,
          name: currentSelectedMethodName,
        },
        amount: finalAmount,
        currency: '₹',
        timestamp: new Date(currentNumericTimestamp).toISOString(),
        numericTimestamp: currentNumericTimestamp,
        status: 'pending',
        previousHash: previousHash,
        qspApplied: qspToUse,
        discountAmount: qspDiscount,
        qspEarned: qspEarned,
      };
      
      const currentHash = await generateSha256Hash({...newPaymentDataForHash, hash: undefined}); // Exclude hash itself from hashing

      const newPaymentWithHash: QueuedPayment = {
        ...newPaymentDataForHash,
        hash: currentHash,
      };

      queue.push(newPaymentWithHash);
      if (typeof window !== 'undefined') {
        localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
      }

      setConfirmedOfflineOrderDetails(newPaymentWithHash);
      setOfflineOrderStatus('pending');
      setPaymentStatus('idle'); 
      toast({
        title: 'Payment Queued!',
        description: `Order of ₹${finalAmount.toLocaleString()} queued. You earned ${qspEarned.toLocaleString()} QSP!`,
        className: 'bg-blue-500 text-white'
      });

    } catch (error) {
        console.error("Error queueing offline payment:", error);
        toast({variant: 'destructive', title: "Queueing Error", description: "Could not add payment to offline queue."});
        setPaymentStatus('idle');
    }
  };
  
  const resetCheckoutFlow = () => {
    setAmount(0); 
    setPaymentDetails(prev => ({
        ...prev,
        amount: 0,
        merchantName: 'Selected Merchant', // Reset merchant if needed
        paymentMethod: '',
        timestamp: new Date().toISOString()
    }));
    setPaymentSuggestion(null);
    setSelectedMethodId(null);
    setPaymentStatus('idle');
    setErrorSuggestion(null);
    setConfirmedOfflineOrderDetails(null);
    setOfflineOrderStatus('unknown');
    setApplyQsp(false);
    if (searchParams.get('amount')) {
        if (typeof window !== 'undefined') {
            window.history.replaceState({}, '', window.location.pathname);
        }
    }
  };

  if (confirmedOfflineOrderDetails) {
    const orderDisplayAmount = confirmedOfflineOrderDetails.amount.toLocaleString();
    const paymentMethodName = confirmedOfflineOrderDetails.paymentMethod.name;
    const isUpiPayment = confirmedOfflineOrderDetails.paymentMethod.id === 'upi';

    // Screen for UPI Intent Sent
    if (isUpiPayment && offlineOrderStatus === 'pending') {
      return (
        <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <Card className="max-w-2xl mx-auto shadow-xl">
            <CardHeader className="bg-blue-500/10 p-6 rounded-t-xl">
              <CardTitle className="font-headline text-3xl font-bold text-blue-700 flex items-center gap-3">
                <Send size={32} /> UPI Intent Sent
              </CardTitle>
              <CardDescription>A payment request for ₹{orderDisplayAmount} has been sent to your UPI app ({paymentMethodName}).</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <p className="text-lg">Please open your UPI application to approve and complete the payment.</p>
              <div className="p-4 bg-amber-50 border-l-4 border-amber-500 text-amber-700 rounded-md">
                <div className="flex items-start gap-3">
                  <Clock size={24} className="mt-0.5 text-amber-600 flex-shrink-0" />
                  <div>
                    <p className="font-bold">Action Required</p>
                    <p>This payment request is now pending your approval in your UPI app. The payment will be automatically cancelled if not completed within 48 hours.</p>
                  </div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">This transaction has been added to your offline queue and will be synced once you're back online.</p>
            </CardContent>
            <CardFooter className="p-6 border-t flex flex-col sm:flex-row justify-between gap-3">
              <Button asChild className="w-full sm:w-auto" variant="secondary">
                <Link href="/offline-manager">
                  <ListChecks size={18} className="mr-2" /> Go to Offline Manager
                </Link>
              </Button>
              <Button onClick={resetCheckoutFlow} className="w-full sm:w-auto">
                Place Another Order
              </Button>
            </CardFooter>
          </Card>
        </div>
      );
    }
    
    // Screen for Synced Offline Payments (works for both UPI and Wallet)
    if (offlineOrderStatus === 'synced' && confirmedOfflineOrderDetails.syncedAt) {
      return (
        <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <Card className="max-w-2xl mx-auto shadow-xl">
            <CardHeader className="bg-green-500/10 p-6 rounded-t-xl">
              <CardTitle className="font-headline text-3xl font-bold text-green-700 flex items-center gap-3">
                <PackageCheck size={32} /> Payment Completed! (Offline Sync)
              </CardTitle>
              <CardDescription>Your offline queued order of ₹{orderDisplayAmount} has been successfully processed via {paymentMethodName}.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <p className="text-lg">Your payment for the order to <span className="font-semibold">{confirmedOfflineOrderDetails.recipient}</span> has been completed.</p>
              
              <div className="p-4 bg-primary/10 border-l-4 border-primary rounded-md">
                  <div className="flex items-start gap-3">
                      <Award size={24} className="mt-0.5 text-primary flex-shrink-0"/>
                      <div>
                      <p className="font-bold text-primary">You've Earned a Reward!</p>
                      <p className="text-sm text-muted-foreground">Your synced offline transaction is eligible for cashback.</p>
                      <Button asChild size="sm" className="mt-2">
                          <Link href="/smart-rewards">
                              Go to Rewards Center <ExternalLink size={16} className="ml-2" />
                          </Link>
                      </Button>
                      </div>
                  </div>
              </div>

              <div className="p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded-md">
                <div className="flex items-start gap-3">
                  <Truck size={24} className="mt-0.5 text-green-600 flex-shrink-0"/>
                  <div>
                    <p className="font-bold">Shipment Information</p>
                    <p>Your items will be shipped soon. Expected delivery by: <strong>{format(addDays(new Date(confirmedOfflineOrderDetails.syncedAt), 5), 'PPP')}</strong>.</p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="p-6 border-t flex flex-col sm:flex-row justify-between gap-3">
              <Button asChild className="w-full sm:w-auto" variant="outline">
                  <Link href="/smart-rewards">
                      <Award size={18} className="mr-2" /> Check Rewards
                  </Link>
              </Button>
              <Button onClick={resetCheckoutFlow} className="w-full sm:w-auto">
                Place Another Order
              </Button>
            </CardFooter>
          </Card>
        </div>
      );
    } 
    
    // Screen for non-UPI (Wallet) payments that are still queued
    return (
      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <Card className="max-w-2xl mx-auto shadow-xl">
          <CardHeader className="bg-blue-500/10 p-6 rounded-t-xl">
            <CardTitle className="font-headline text-3xl font-bold text-blue-700 flex items-center gap-3">
              <CheckCircle size={32} /> Order Queued (Offline)
            </CardTitle>
            <CardDescription>Your payment for ₹{orderDisplayAmount} via {paymentMethodName} will be processed once you're back online and sync the queue.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
              <div>
                <p className="text-md text-muted-foreground">Payment to</p>
                <p className="text-lg font-semibold ">{confirmedOfflineOrderDetails.recipient}</p>
            </div>
            {confirmedOfflineOrderDetails.discountAmount && confirmedOfflineOrderDetails.discountAmount > 0 && (
                 <div className="text-sm text-green-600 font-semibold p-3 bg-green-500/10 rounded-md">
                    Successfully applied {confirmedOfflineOrderDetails.qspApplied?.toLocaleString()} QSP for a discount of ₹{confirmedOfflineOrderDetails.discountAmount.toLocaleString()}.
                 </div>
            )}
            <div className="p-4 bg-blue-50 border-l-4 border-blue-500 text-blue-700 rounded-md">
                <div className="flex items-start gap-3">
                    <Package size={24} className="mt-0.5 text-blue-600 flex-shrink-0"/>
                    <div>
                        <p className="font-bold">Shipment Information</p>
                        <p>Shipment of your items will proceed as soon as this payment is successfully synced from the Offline Payment Manager when you're back online.</p>
                    </div>
                </div>
            </div>
          </CardContent>
          <CardFooter className="p-6 border-t flex flex-col sm:flex-row justify-between gap-3">
            <Button asChild className="w-full sm:w-auto" variant="secondary">
              <Link href="/offline-manager">
                <ListChecks size={18} className="mr-2" /> Go to Offline Manager
              </Link>
            </Button>
            <Button onClick={resetCheckoutFlow} className="w-full sm:w-auto">
              Place Another Order
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (paymentStatus === 'success') {
    const expectedDeliveryDate = format(addDays(new Date(), 5), 'PPP');
    return (
      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <Card className="max-w-2xl mx-auto shadow-xl">
          <CardHeader className="bg-green-500/10 p-6 rounded-t-xl">
            <CardTitle className="font-headline text-3xl font-bold text-green-700 flex items-center gap-3">
              <PackageCheck size={32} /> Payment Successful!
            </CardTitle>
            <CardDescription>Your order of ₹{paymentDetails.amount.toLocaleString()} to {paymentDetails.merchantName} has been confirmed.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <p className="text-lg">Thank you for shopping with us!</p>
            
            {paymentDetails.discountAmount && paymentDetails.discountAmount > 0 && (
                 <div className="text-sm text-green-600 font-semibold p-3 bg-green-500/10 rounded-md">
                    Successfully applied {paymentDetails.qspApplied?.toLocaleString()} QSP and saved ₹{paymentDetails.discountAmount.toLocaleString()}!
                 </div>
            )}

            <div className="p-4 bg-primary/10 border-l-4 border-primary rounded-md">
                <div className="flex items-start gap-3">
                    <Award size={24} className="mt-0.5 text-primary flex-shrink-0"/>
                    <div>
                        <p className="font-bold text-primary">You've Earned a Reward!</p>
                        <p className="text-sm text-muted-foreground">Your transaction is eligible for Q-SmartPay cashback.</p>
                        <Button asChild size="sm" className="mt-2">
                            <Link href="/smart-rewards">
                                Go to Rewards Center <ExternalLink size={16} className="ml-2" />
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>

            <div className="p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded-md">
              <div className="flex items-start gap-3">
                <Truck size={24} className="mt-0.5 text-green-600 flex-shrink-0"/>
                <div>
                  <p className="font-bold">Shipment Information</p>
                  <p>Your items will be shipped soon. Expected delivery by: <strong>{expectedDeliveryDate}</strong>.</p>
                </div>
              </div>
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
                <p>Order ID: <span className="font-mono">tx_online_{new Date(paymentDetails.timestamp).getTime()}_{Math.random().toString(36).substring(2,9)}</span> (Simulated)</p>
                <p>Payment Method: <span className="font-semibold">{paymentDetails.paymentMethod}</span></p>
             </div>
          </CardContent>
          <CardFooter className="p-6 border-t flex flex-col sm:flex-row justify-between gap-3">
            <Button asChild variant="outline" className="w-full sm:w-auto">
                <Link href="/smart-rewards">
                    <Award size={18} className="mr-2"/> Check Rewards
                </Link>
            </Button>
            <Button onClick={resetCheckoutFlow} className="w-full sm:w-auto">
              Place Another Order
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }


  if (amount === 0 && !searchParams.get('amount') && paymentStatus !== 'processing' && !confirmedOfflineOrderDetails) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center px-4">
            <ShoppingCart size={64} className="text-muted-foreground mb-6" />
            <h2 className="text-2xl font-semibold mb-4">Your cart seems to be empty or amount is missing.</h2>
            <p className="text-muted-foreground mb-6">Please add items to your cart before proceeding to checkout.</p>
            <Button asChild>
                <Link href="/cart">Go to Cart</Link>
            </Button>
        </div>
    );
  }

  const isWalletInsufficient = selectedMethodId === 'amazon-pay-wallet' && balance < finalAmount;
  const isPayButtonDisabled = isLoadingSuggestion 
    || !selectedMethodId 
    || isWalletInsufficient 
    || (selectedMethodId === 'upi' && !isUpiVerified);


  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <Card className="max-w-2xl mx-auto shadow-xl">
        <CardHeader className="bg-primary/10 p-6 rounded-t-xl">
          <CardTitle className="font-headline text-3xl font-bold text-primary flex items-center justify-between">
            <span className="flex items-center gap-3"><CreditCard size={32} /> Checkout</span>
             <Button onClick={toggleSimulatedStatus} variant="outline" size="sm" className="text-xs">
              {isOnline ? <Wifi size={16} className="mr-1.5 text-green-600" /> : <WifiOff size={16} className="mr-1.5 text-amber-600" />}
              Simulate: Go {isOnline ? 'Offline' : 'Online'}
            </Button>
          </CardTitle>
          <CardDescription>Review your order. Current status: {isOnline ? "Online" : isSimulatedOffline ? "Simulated Offline" : "Offline"}</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="text-center">
            <p className="text-lg text-muted-foreground">Total Amount Due</p>
            <p className="text-4xl font-bold text-primary">₹{finalAmount.toLocaleString()}</p>
            {applyQsp && qspDiscount > 0 && (
              <p className="text-sm text-muted-foreground line-through">
                Original: ₹{amount.toLocaleString()}
              </p>
            )}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2 text-green-600">
                <Gem size={24} /> Q-SmartPay Rewards
              </CardTitle>
              <CardDescription>
                You have <span className="font-bold">{qspBalance.toLocaleString()} QSP</span> available. (10 QSP = ₹1)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-3 border rounded-md">
                <Label htmlFor="apply-qsp" className="flex flex-col cursor-pointer">
                  <span className="font-semibold">Apply Rewards</span>
                  <span className="text-xs text-muted-foreground">Get ₹{Math.floor(qspBalance / 10).toLocaleString()} off using {Math.floor(qspBalance / 10) * 10} QSP</span>
                </Label>
                <Switch
                  id="apply-qsp"
                  checked={applyQsp}
                  onCheckedChange={setApplyQsp}
                  disabled={qspBalance < 10 || amount === 0}
                />
              </div>
            </CardContent>
            {applyQsp && qspDiscount > 0 && (
              <CardFooter className="flex-col items-start gap-2 p-4 pt-0 text-sm">
                <Separator className="mb-2" />
                <div className="w-full flex justify-between">
                  <span>Original Total:</span>
                  <span>₹{amount.toLocaleString()}</span>
                </div>
                <div className="w-full flex justify-between font-semibold text-green-600">
                  <span>QSP Discount:</span>
                  <span>- ₹{qspDiscount.toLocaleString()}</span>
                </div>
                <Separator className="my-2" />
                <div className="w-full flex justify-between font-bold text-lg text-primary">
                  <span>New Total:</span>
                  <span>₹{finalAmount.toLocaleString()}</span>
                </div>
              </CardFooter>
            )}
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2 text-primary">
                <Lightbulb size={24} /> AI Payment Suggestion
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!paymentSuggestion && !isLoadingSuggestion && (
                <Button onClick={fetchPaymentSuggestion} className="w-full" disabled={amount <=0}>
                  <Search size={18} className="mr-2"/> Get AI Suggestion & Offers
                </Button>
              )}
              {isLoadingSuggestion && <div className="flex items-center gap-2 text-muted-foreground"><AnimatedLoader size={20} /><span>Fetching best offers...</span></div>}
              {errorSuggestion && <p className="text-destructive flex items-center gap-2"><AlertTriangle size={18}/> {errorSuggestion}</p>}
              
              {paymentSuggestion && !isLoadingSuggestion && (
                <div className="bg-accent/50 p-4 rounded-md border border-accent">
                  <p className="font-semibold text-accent-foreground text-lg">{paymentSuggestion.suggestedMethodName}</p>
                  <p className="text-sm text-muted-foreground mt-1">{paymentSuggestion.reason}</p>
                  {paymentSuggestion.confidence && <p className="text-xs text-muted-foreground mt-1">Confidence: {(paymentSuggestion.confidence * 100).toFixed(0)}%</p>}
                   <Button onClick={fetchPaymentSuggestion} variant="link" size="sm" className="mt-2 p-0 h-auto">
                     Refresh Suggestion
                   </Button>
                </div>
              )}
            </CardContent>
          </Card>

           <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <ListChecks size={24}/> Your Payment Methods
              </CardTitle>
              {!isOnline && <CardDescription className="text-sm text-amber-600">You are offline. Only offline-compatible payment methods are shown.</CardDescription>}
            </CardHeader>
            <CardContent className="space-y-2">
                {displayedMethods.map(method => {
                    const isSelected = selectedMethodId === method.id;
                    const isWallet = method.id === 'amazon-pay-wallet';
                    const isUpi = method.id === 'upi';
                    const isInsufficientOnThisMethod = isWallet && balance < finalAmount;

                    return (
                        <div key={method.id} >
                            <div 
                              className={cn(
                                "p-3 border rounded-md flex justify-between items-center text-sm transition-all cursor-pointer hover:bg-muted/50",
                                isSelected && "border-primary ring-2 ring-primary bg-primary/5",
                                isSelected && isInsufficientOnThisMethod && "border-destructive ring-destructive bg-destructive/5"
                              )}
                              onClick={() => setSelectedMethodId(method.id)}
                            >
                                <div className="flex flex-col">
                                  <div className="flex items-center">
                                    <span className="font-medium">{method.name}</span>
                                    <span className="text-xs capitalize text-muted-foreground ml-1">({method.type})</span>
                                  </div>
                                  {isWallet && (
                                    <div className={cn(
                                        "flex items-center text-xs font-semibold mt-1",
                                        isInsufficientOnThisMethod ? "text-destructive" : "text-green-700 dark:text-green-400"
                                    )}>
                                      <Wallet size={14} className="mr-1.5" />
                                      <span>Balance: ₹{balance.toFixed(2)}</span>
                                    </div>
                                  )}
                                  {isSelected && isInsufficientOnThisMethod && (
                                      <div className="text-xs text-destructive font-semibold mt-1 flex items-center gap-1.5">
                                          <span>Insufficient balance.</span>
                                          <Button asChild variant="link" size="sm" className="p-0 h-auto text-destructive">
                                              <Link href="/amazon-pay">Add Money</Link>
                                          </Button>
                                      </div>
                                  )}
                                </div>
                                <Button 
                                  variant={isSelected ? "default" : "outline"} 
                                  size="sm" 
                                  onClick={(e) => { e.stopPropagation(); setSelectedMethodId(method.id);}}
                                  disabled={paymentStatus === 'processing' || isSelected}
                                  className="pointer-events-auto"
                                >
                                  {isSelected ? 'Selected' : 'Select'}
                                </Button>
                            </div>

                            {isSelected && isUpi && (
                                <div className="p-4 mt-2 border-t space-y-3">
                                    <div className="flex flex-col sm:flex-row items-end gap-2">
                                        <div className="w-full sm:flex-grow">
                                            <label htmlFor="upi-id" className="text-xs font-medium text-muted-foreground">Enter UPI ID (e.g., name@bank)</label>
                                            <Input 
                                                id="upi-id"
                                                value={upiId}
                                                onChange={(e) => {
                                                    setUpiId(e.target.value);
                                                    setIsUpiVerified(false);
                                                    setUpiVerificationResult(null);
                                                }}
                                                placeholder="your-name@bank"
                                            />
                                        </div>
                                        <Button onClick={handleVerifyUpi} disabled={!upiId} className="w-full sm:w-auto">
                                            <ScanSearch className="mr-2 h-4 w-4"/>
                                            Verify
                                        </Button>
                                    </div>
                                    {upiVerificationResult && (
                                        <div className={cn("text-xs p-2 rounded-md flex items-center gap-2", 
                                            upiVerificationResult.isWarning ? 'bg-destructive/10 text-destructive' : 'bg-green-500/10 text-green-700'
                                        )}>
                                            {upiVerificationResult.isWarning ? <AlertTriangle size={14}/> : <CheckCircle size={14}/>}
                                            <span>{upiVerificationResult.message}</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )
                })}
            </CardContent>
            <CardFooter className="pt-2 pb-4 px-6">
              <div className="p-3 bg-blue-50 border border-blue-200 text-blue-700 rounded-md text-xs w-full">
                <div className="flex items-start gap-2">
                  <Info size={18} className="mt-0.5 text-blue-600" />
                  <div>
                    {!selectedMethodId && paymentSuggestion && (
                      <p>The AI suggestion above guides your choice. Selecting it or another method will enable payment.</p>
                    )}
                     {selectedMethodId && paymentSuggestion && displayedMethods.find(m => m.name === paymentSuggestion.suggestedMethodName)?.id === selectedMethodId && (
                      <p><strong>You've selected the AI's recommendation!</strong> {paymentSuggestion.reason}</p>
                    )}
                    {selectedMethodId && paymentSuggestion && displayedMethods.find(m => m.name === paymentSuggestion.suggestedMethodName)?.id !== selectedMethodId && (
                      <p>You've selected <strong>{getSelectedMethodName()}</strong>. The AI recommended <strong>{paymentSuggestion.suggestedMethodName}</strong> because: "{paymentSuggestion.reason}". Consider if the AI's pick offers better savings!</p>
                    )}
                     {selectedMethodId && !paymentSuggestion && (
                       <p>You've selected <strong>{getSelectedMethodName()}</strong>. You can get an AI suggestion for offers.</p>
                     )}
                     {!selectedMethodId && !paymentSuggestion && (
                       <p>Choose a payment method or get an AI suggestion to proceed.</p>
                     )}
                  </div>
                </div>
              </div>
            </CardFooter>
          </Card>

        </CardContent>
        <CardFooter className="p-6 border-t flex flex-col gap-3">
          {paymentStatus === 'idle' && (
            <>
              {isOnline ? (
                <Button size="lg" className="w-full" onClick={handleOnlinePayNow} disabled={isPayButtonDisabled}>
                  Pay ₹{finalAmount.toLocaleString()} Now
                </Button>
              ) : (
                <Button size="lg" className="w-full" onClick={handleOfflinePay} variant="secondary" disabled={!selectedMethodId || (selectedMethodId === 'upi' && !isUpiVerified && !upiId) || (selectedMethodId === 'upi' && upiId && !isUpiVerified)}>
                  Pay ₹{finalAmount.toLocaleString()} Offline (Add to Queue)
                </Button>
              )}
               {!isOnline && <p className="text-xs text-center text-amber-600">You are offline. Payment will be queued.</p>}
            </>
          )}
          {paymentStatus === 'processing' && (
            <Button size="lg" className="w-full" disabled>
              <AnimatedLoader size={20} className="mr-2"/> Processing Payment...
            </Button>
          )}
          {paymentStatus === 'failed' && (
             <div className="w-full text-center p-4 bg-red-100 text-red-700 rounded-md flex flex-col sm:flex-row items-center justify-center gap-2">
              <AlertTriangle size={24} /> 
              <div>
                <p className="font-semibold">Payment Blocked due to High Risk!</p>
                <p className="text-sm">This transaction was flagged by our security systems.</p>
              </div>
              <Button onClick={resetCheckoutFlow} variant="outline" size="sm" className="mt-2 sm:mt-0 sm:ml-4">Try another payment</Button>
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-screen"><AnimatedLoader size={48} /></div>}>
      <CheckoutPageContent />
    </Suspense>
  );
}
