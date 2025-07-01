'use client';

import { Check, Truck, Clock, Video, Award, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { cn } from '@/lib/utils';
import React from 'react';

const features = [
  { name: 'Free Delivery', icon: <Truck className="w-5 h-5 text-primary" />, plans: [true, true, true] },
  { name: 'Same Day Delivery', icon: <Clock className="w-5 h-5 text-primary" />, plans: [true, true, true] },
  { name: 'Prime Video', icon: <Video className="w-5 h-5 text-primary" />, plans: [true, true, true] },
  { name: 'QSP Rewards', icon: <Award className="w-5 h-5 text-primary" />, details: ['Now with QSP cashback!!', '01%', 'Bonus QSP'] },
  { name: 'Up to 10% as QSP', icon: <Award className="w-5 h-5 text-primary" />, details: ['Up to 10% as QSP take', 'Now vs is QSP', 'Bonus QSP for Prime users'] },
  { name: 'Wallet Requirement', icon: <Wallet className="w-5 h-5 text-primary" />, details: ['MetaMask/WalletConnect', '✓', '✓'] }
];

const plans = [
  { name: 'Prime Shoptegion', price: '₹XXX / year', highlighted: false },
  { name: 'Prime Lite', price: '₹XXX / year', highlighted: false },
  { name: 'Prime', price: '₹XXX / year', highlighted: true }
];

export default function PrimePage() {
  return (
    <div className="bg-white dark:bg-gray-900">
      {/* Hero Section */}
      <div className="bg-blue-600 text-white">
        <div className="container mx-auto px-6 py-12 md:py-20">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                One Membership, More Power — Now with QSP Smart Rewards
              </h1>
              <p className="mt-4 text-lg text-blue-200">
                Experience Amazon Prime with transparent, ownable, and blockchain-verified rewards
              </p>
              <div className="mt-8">
                <ConnectButton.Custom>
                  {({ account, chain, openAccountModal, openConnectModal, mounted }) => {
                    const ready = mounted;
                    const connected = ready && account && chain;

                    return (
                      <div
                        {...(!ready && {
                          'aria-hidden': true,
                          'style': {
                            opacity: 0,
                            pointerEvents: 'none',
                            userSelect: 'none',
                          },
                        })}
                      >
                        {(() => {
                          if (!connected) {
                            return (
                              <Button onClick={openConnectModal} size="lg">
                                Connect Wallet to Start Earning QSP
                              </Button>
                            );
                          }
                          return (
                            <div className="flex gap-4">
                                <Button onClick={openAccountModal} size="lg">
                                 {account.displayName}
                                </Button>
                            </div>
                           
                          );
                        })()}
                      </div>
                    );
                  }}
                </ConnectButton.Custom>
              </div>
            </div>
            <div className="hidden md:flex justify-center">
              <Image 
                src="https://placehold.co/350x450.png"
                alt="Happy customer with packages"
                width={350}
                height={450}
                className="rounded-lg object-cover"
                data-ai-hint="happy customer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Table Section */}
      <div className="container mx-auto px-4 sm:px-6 py-12 md:py-20">
        <div className="bg-card text-card-foreground rounded-xl shadow-2xl overflow-hidden border border-border">
          <div className="grid grid-cols-4">
            {/* --- HEADER ROW --- */}
            <div className="p-4 md:p-6 border-r border-b border-border flex items-end">
              <h3 className="text-lg md:text-xl font-bold text-primary">Features</h3>
            </div>
            {plans.map((plan, planIndex) => (
              <div
                key={plan.name}
                className={cn(
                  "p-4 md:p-6 text-center border-b border-border",
                  planIndex < plans.length - 1 && "border-r border-border",
                  plan.highlighted && "bg-blue-50 dark:bg-blue-900/20 relative"
                )}
              >
                {plan.highlighted && (
                  <div className="absolute top-0 left-0 w-full bg-primary text-primary-foreground text-xs font-bold py-1 uppercase tracking-wider">
                    Most Popular
                  </div>
                )}
                <h3 className={cn("text-base md:text-lg font-bold", plan.highlighted ? "text-primary mt-4" : "text-foreground")}>
                  {plan.name}
                </h3>
                <p className="text-sm text-muted-foreground">{plan.price}</p>
              </div>
            ))}
            {/* --- END HEADER ROW --- */}

            {/* --- FEATURE ROWS --- */}
            {features.map((feature) => (
              <React.Fragment key={feature.name}>
                {/* Feature Name Column */}
                <div className="p-4 md:p-6 border-r border-t border-border flex items-center text-sm font-medium text-muted-foreground">
                  <div className="flex items-center gap-3">
                    {feature.icon}
                    <span>{feature.name}</span>
                  </div>
                </div>
                {/* Plan Value Columns */}
                {plans.map((plan, planIndex) => (
                  <div
                    key={`${feature.name}-${plan.name}`}
                    className={cn(
                      "p-4 md:p-6 border-t border-border flex items-center justify-center text-sm",
                      planIndex < plans.length - 1 && "border-r border-border",
                      plan.highlighted && "bg-blue-50 dark:bg-blue-900/20"
                    )}
                  >
                    {feature.details && feature.details[planIndex] ? (
                      <span className="text-center">{feature.details[planIndex] === '✓' ? <Check className="w-6 h-6 text-green-500" /> : feature.details[planIndex]}</span>
                    ) : feature.plans[planIndex] ? (
                      <Check className="w-6 h-6 text-green-500" />
                    ) : (
                      <span className="text-muted-foreground text-xl">-</span>
                    )}
                  </div>
                ))}
              </React.Fragment>
            ))}
            {/* --- END FEATURE ROWS --- */}
          </div>
        </div>
      </div>

      {/* What is QSP & How It Works Section */}
       <div className="bg-gray-50 dark:bg-gray-800/50">
          <div className="container mx-auto px-6 py-16">
            <div className="grid md:grid-cols-2 gap-12">
              <div>
                <h2 className="text-3xl font-bold text-primary mb-6">What is QSP?</h2>
                <div className="space-y-4 text-muted-foreground">
                    <p>
                        QSP is a blockchain-based rewards system that instantly credits tokens to your wallet after eligible purchases. No extra logins, no confusing conditions. Just full transparency.
                    </p>
                </div>
              </div>
              <div>
                <h2 className="text-3xl font-bold text-primary mb-6">How It Works</h2>
                <ol className="space-y-3 list-decimal list-inside text-muted-foreground">
                    <li>Click Connect Wallet to get started.</li>
                    <li>Make purchases using Amazon Pay or ICICI Credit Card.</li>
                    <li>Get rewarded instantly - e.g., spend ₹10,000, earn 1000 QSP.</li>
                    <li>Redeem QSP during checkout - ₹1 = 10 QSP.</li>
                    <li>Prime users get extra QSP and early redemption benefits.</li>
                </ol>
              </div>
            </div>
          </div>
       </div>

    </div>
  );
}
