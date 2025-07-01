'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Award, Sparkles, Percent, CheckCircle, AlertTriangle, ExternalLink, Loader2, WalletCards, Beaker, Gem, Star, PlusCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useReadContract, useBalance } from 'wagmi';
import { useReward } from '@/hooks/useReward';
import toast, { Toaster as HotToaster } from 'react-hot-toast'; // Using react-hot-toast
import ABI from "@/abi/RewardValidator.json";
import { formatEther } from 'ethers';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useQsp } from '@/contexts/QspContext';

const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDR as `0x${string}`;

interface RewardEntry {
  paymentMethod: string;
  merchant: string;
  amount: bigint;
  rewardAmount: bigint;
  timestamp: bigint;
}

interface MockPayment {
  id: string;
  merchant: string;
  amount: number;
  baseReward: number;
  status: 'pending' | 'eligible' | 'collected';
  timestamp: Date;
}

const initialMockPayments: MockPayment[] = [
  {
    id: 'ORD-A1B2C3D4',
    merchant: 'Electronics World',
    amount: 7500,
    baseReward: 750,
    status: 'pending',
    timestamp: new Date(Date.now() - 86400000 * 2), // 2 days ago
  },
  {
    id: 'ORD-E5F6G7H8',
    merchant: 'Fashion Forward',
    amount: 2499,
    baseReward: 250,
    status: 'pending',
    timestamp: new Date(Date.now() - 86400000 * 5), // 5 days ago
  },
];


export default function SmartRewardsPage() {
  const { address: accountAddress, isConnected } = useAccount();
  const { writeReward, txHash, txReceipt, isPendingWrite, isConfirming, isConfirmed, error: rewardError } = useReward();
  const { qspBalance, addQsp } = useQsp();
  
  // Demo Mode State
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [mockPayments, setMockPayments] = useState<MockPayment[]>(initialMockPayments);
  const [isMockPrimeMember, setIsMockPrimeMember] = useState(false);
  const [mockHistory, setMockHistory] = useState<any[]>([]);

  // Live Wallet State
  const { data: totalRewardsData, isLoading: isLoadingTotalRewards, error: totalRewardsError, refetch: refetchTotalRewards } = useReadContract({
    address: contractAddress,
    abi: ABI,
    functionName: 'rewards',
    args: accountAddress ? [accountAddress] : undefined,
    query: {
      enabled: !!accountAddress && !isDemoMode,
    },
    chainId: 80001, 
  });

  const { data: rewardHistoryData, isLoading: isLoadingRewardHistory, error: rewardHistoryError, refetch: refetchRewardHistory } = useReadContract({
    address: contractAddress,
    abi: ABI,
    functionName: 'getRewardHistory',
    args: accountAddress ? [accountAddress] : undefined,
    query: {
      enabled: !!accountAddress && !isDemoMode,
    },
    chainId: 80001,
  });

  const { data: maticBalance } = useBalance({
    address: accountAddress,
    chainId: 80001,
  });

  const handleCheckReward = async () => {
    if (isDemoMode) {
      toast.success('Reward check complete! Eligible payments can now be collected.');
      setMockPayments(prev => 
        prev.map(p => (p.status === 'pending' ? { ...p, status: 'eligible' } : p))
      );
      return;
    }

    if (!accountAddress) {
      toast.error("Please connect your wallet first.");
      return;
    }
    if (!contractAddress) {
        toast.error("Contract address is not configured. Please check environment variables.");
        return;
    }
    const paymentMethod = "AmazonPay";
    const merchant = "AmazonStore";
    const amount = BigInt(Math.floor(Math.random() * 10000) + 1000);

    writeReward({
      address: contractAddress,
      abi: ABI,
      functionName: 'validateAndReward',
      args: [paymentMethod, merchant, amount, accountAddress],
    });
  };
  
  const handleCollectMockReward = (paymentId: string) => {
    const payment = mockPayments.find(p => p.id === paymentId);
    if (!payment) return;

    const primeMultiplier = isMockPrimeMember ? 1.5 : 1; // 50% bonus for prime members
    const rewardToCollect = payment.baseReward * primeMultiplier;

    addQsp(rewardToCollect);
    setMockPayments(prev => 
      prev.map(p => (p.id === paymentId ? { ...p, status: 'collected' } : p))
    );
    
    const historyEntry = {
        ...payment,
        rewardAmount: rewardToCollect,
        collectedAt: new Date(),
    };
    setMockHistory(prev => [historyEntry, ...prev]);

    toast.success(`+${rewardToCollect.toLocaleString()} QSP collected! ${isMockPrimeMember ? '(Prime bonus applied)' : ''}`);
  };

  useEffect(() => {
    if (isConfirmed && txReceipt) {
      toast.success(
        (t) => (
          <span className="flex items-center">
            🎉 Reward confirmed!&nbsp;
            <a
              target="_blank"
              rel="noopener noreferrer"
              href={`https://mumbai.polygonscan.com/tx/${txReceipt.transactionHash}`}
              className="underline hover:text-blue-500 flex items-center gap-1"
              onClick={() => toast.dismiss(t.id)}
            >
              View on Polygonscan <ExternalLink size={14} />
            </a>
          </span>
        ), { duration: 8000 }
      );
      refetchTotalRewards();
      refetchRewardHistory();
    }
    if (rewardError) {
      const shortMessage = (rewardError.shortMessage || rewardError.message).split('\n')[0];
      toast.error(`Transaction failed: ${shortMessage}`, { duration: 6000 });
    }
  }, [isConfirmed, rewardError, txReceipt, refetchTotalRewards, refetchRewardHistory]);

  useEffect(() => {
    if (txHash && isPendingWrite) {
      toast.loading('Sending transaction...', { id: 'reward-tx' });
    }
    if (txHash && isConfirming && !isConfirmed) {
      toast.loading('Confirming transaction on blockchain...', { id: 'reward-tx' });
    }
    if (!isPendingWrite && !isConfirming) {
      toast.dismiss('reward-tx');
    }
  }, [txHash, isPendingWrite, isConfirming, isConfirmed]);

  const totalRewards = totalRewardsData ? formatEther(totalRewardsData as bigint) : '0';

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <HotToaster position="top-center" reverseOrder={false} />
      <Card className="shadow-xl max-w-3xl mx-auto overflow-hidden rounded-xl">
        <CardHeader className="bg-primary/10 p-6 text-center">
          <Award size={48} className="mx-auto text-primary mb-4" />
          <CardTitle className="font-headline text-3xl font-bold text-primary">
            Smart Rewards Center
          </CardTitle>
          <CardDescription className="text-lg text-muted-foreground mt-2">
            Transparent, instant cashback via Polygon smart contracts.
             {isDemoMode && <Badge className="ml-2">Demo Mode</Badge>}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-8">
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <div className={isDemoMode ? 'opacity-50 pointer-events-none' : ''}>
              <ConnectButton />
            </div>
            <Button 
                onClick={() => setIsDemoMode(!isDemoMode)} 
                variant="outline"
                className="w-full sm:w-auto"
            >
                <Beaker size={20} className="mr-2" />
                {isDemoMode ? "Show Live Data" : "Demonstrate Mock Rewards"}
            </Button>
          </div>
          
          {isDemoMode ? (
            <div className="text-center p-4 bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20 rounded-md space-y-4">
                <p>You are in demo mode. Wallet interactions are disabled.</p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <div className="flex items-center space-x-2">
                        <Switch
                            id="prime-member"
                            checked={isMockPrimeMember}
                            onCheckedChange={setIsMockPrimeMember}
                        />
                        <Label htmlFor="prime-member" className="flex items-center gap-1.5"><Gem size={16} className="text-blue-500"/> Prime Member (50% Bonus)</Label>
                    </div>
                    <div className="hidden sm:block border-l border-blue-500/20 h-6"></div>
                    <Button
                        variant="outline"
                        size="sm"
                        className="bg-transparent border-current hover:bg-current/10"
                        onClick={() => {
                            addQsp(1000);
                            toast.success("+1,000 QSP added for demonstration.");
                        }}
                    >
                        <PlusCircle size={16} className="mr-2"/> Add 1000 Mock QSP
                    </Button>
                </div>
            </div>
          ) : (
            isConnected && accountAddress && (
              <Card className="bg-secondary/30">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-secondary-foreground">
                    <WalletCards size={20} /> Your Wallet
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 text-sm">
                  <p>Address: <span className="font-mono text-xs">{accountAddress}</span></p>
                  <p>Balance: {maticBalance ? `${parseFloat(formatEther(maticBalance.value)).toFixed(4)} MATIC` : 'Loading...'}</p>
                </CardContent>
              </Card>
            )
          )}

          <div className="text-center">
            <Button 
              onClick={handleCheckReward} 
              disabled={(!isConnected && !isDemoMode) || isPendingWrite || isConfirming}
              size="lg"
              className="w-full sm:w-auto"
            >
              {(isPendingWrite || isConfirming) ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Sparkles size={20} className="mr-2" /> Check for Rewards
                </>
              )}
            </Button>
            {txHash && !isConfirming && !isConfirmed && !isDemoMode &&(
                <p className="text-xs text-muted-foreground mt-2">Transaction Sent: {txHash.substring(0,10)}...</p>
            )}
          </div>
          
          <Card>
              <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2 text-primary">
                    <Award size={24} /> Your Total Q-SmartPay Rewards
                  </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                  {isDemoMode ? (
                      <p className="text-4xl font-bold text-primary">{qspBalance.toLocaleString()} <span className="text-2xl">QSP</span></p>
                  ) : isLoadingTotalRewards ? (
                    <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                  ) : totalRewardsError ? (
                    <p className="text-destructive text-sm">Error loading rewards. Connect wallet.</p>
                  ) : isConnected ? (
                    <p className="text-4xl font-bold text-primary">{totalRewards} <span className="text-2xl">QSP</span></p>
                  ) : (
                     <p className="text-muted-foreground">Connect your wallet to see live rewards.</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                      {isDemoMode ? "Showing mock data for demonstration." : "Updated on reward check or page load."}
                  </p>
              </CardContent>
          </Card>

          {isDemoMode && (
            <Card>
                <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2 text-primary">
                        <Star size={24} /> Recent Payments
                    </CardTitle>
                    <CardDescription>Eligible payments will appear here. Click "Check for Rewards" to find them.</CardDescription>
                </CardHeader>
                <CardContent>
                    {mockPayments.length > 0 ? (
                        <ul className="space-y-3">
                            {mockPayments.map((payment) => (
                                <li key={payment.id} className="p-3 border rounded-md bg-background text-sm flex flex-col sm:flex-row justify-between items-center gap-3">
                                    <div>
                                        <p><strong>Merchant:</strong> {payment.merchant}</p>
                                        <p><strong>Order Amount:</strong> ₹{payment.amount.toLocaleString()}</p>
                                        <p className="text-xs text-muted-foreground">Date: {payment.timestamp.toLocaleDateString()}</p>
                                    </div>
                                    <div className="w-full sm:w-auto">
                                        {payment.status === 'pending' && <Badge variant="outline">Pending Check</Badge>}
                                        {payment.status === 'eligible' && (
                                            <Button onClick={() => handleCollectMockReward(payment.id)} size="sm">
                                                Collect {payment.baseReward * (isMockPrimeMember ? 1.5 : 1)} QSP
                                            </Button>
                                        )}
                                        {payment.status === 'collected' && <Badge className="bg-green-500 text-white"><CheckCircle size={14} className="mr-1.5"/> Collected</Badge>}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-muted-foreground text-center py-4">No recent payments available in this demo.</p>
                    )}
                </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2 text-primary">
                <Percent size={24} /> Reward History
              </CardTitle>
              <CardDescription>Recent rewards claimed by your connected wallet.</CardDescription>
            </CardHeader>
            <CardContent>
              {isDemoMode ? (
                 mockHistory.length > 0 ? (
                    <ul className="space-y-3 max-h-60 overflow-y-auto pr-2">
                      {mockHistory.map((entry, index) => (
                        <li key={index} className="p-3 border rounded-md bg-background text-sm">
                          <p><strong>Merchant:</strong> {entry.merchant}</p>
                          <p><strong>Payment:</strong> ₹{entry.amount.toLocaleString()}, <strong>Reward:</strong> <span className="text-green-600 font-semibold">{entry.rewardAmount.toLocaleString()} QSP</span></p>
                          <p className="text-xs text-muted-foreground">Collected: {entry.collectedAt.toLocaleString()}</p>
                        </li>
                      ))}
                    </ul>
                 ) : (
                    <p className="text-muted-foreground text-center py-4">No rewards collected in this demo session yet.</p>
                 )
              ) : isLoadingRewardHistory ? (
                 <div className="flex justify-center items-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" /> 
                    <span className="ml-2 text-muted-foreground">Loading history...</span>
                 </div>
              ) : rewardHistoryError ? (
                <p className="text-destructive text-sm text-center">Error loading reward history.</p>
              ) : rewardHistoryData && (rewardHistoryData as RewardEntry[]).length > 0 && isConnected ? (
                <ul className="space-y-3 max-h-60 overflow-y-auto pr-2">
                  {(rewardHistoryData as RewardEntry[]).slice().reverse().map((entry, index) => (
                    <li key={index} className="p-3 border rounded-md bg-background text-sm">
                      <p><strong>Merchant:</strong> {entry.merchant}, <strong>Method:</strong> {entry.paymentMethod}</p>
                      <p><strong>Payment:</strong> {formatEther(entry.amount)} Tokens, <strong>Reward:</strong> <span className="text-green-600 font-semibold">{formatEther(entry.rewardAmount)} QSP</span></p>
                      <p className="text-xs text-muted-foreground">Date: {new Date(Number(entry.timestamp) * 1000).toLocaleString()}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                    {isConnected ? "No reward history found for this wallet." : "Connect wallet to view history."}
                </p>
              )}
            </CardContent>
          </Card>


          <div className="mt-8 border-t pt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Rewards are managed by a smart contract on Polygon Mumbai. All transactions are transparent and verifiable.
            </p>
          </div>
        </CardContent>
        <CardFooter className="p-6 border-t">
             <Button variant="outline" asChild className="w-full">
                <Link href="/">Return to Home</Link>
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
