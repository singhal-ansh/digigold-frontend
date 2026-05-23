import { useState } from 'react';
import { LogIn, DollarSign, CreditCard } from 'lucide-react';

/**
 * How It Works Component - Step-by-step process
 * Features: Numbered circles, connecting lines, tab switching (Buy/Sell)
 */
export default function HowItWorks() {
  const [activeTab, setActiveTab] = useState('buy');

  const buySteps = [
    {
      number: '01',
      title: 'Login',
      description: 'Login or register with fingold. Complete your account setup with eKYC.',
      icon: LogIn,
    },
    {
      number: '02',
      title: 'Enter Amount',
      description: 'Enter your amount in rupees or gold in grams to buy.',
      icon: DollarSign,
    },
    {
      number: '03',
      title: 'Payment',
      description: 'Choose your payment method. You will have multiple payment options to choose from such as an account, card, or wallet.',
      icon: CreditCard,
    },
  ];

  const sellSteps = [
    {
      number: '01',
      title: 'Login',
      description: 'Access your DigiWallet account with your registered credentials.',
      icon: LogIn,
    },
    {
      number: '02',
      title: 'Select Amount',
      description: 'Choose the amount of digital gold you want to sell at current market price.',
      icon: DollarSign,
    },
    {
      number: '03',
      title: 'Receive Payment',
      description: 'Get instant payment via bank transfer within 5 business days.',
      icon: CreditCard,
    },
  ];

  const steps = activeTab === 'buy' ? buySteps : sellSteps;

  return (
    <section className="py-16 lg:py-24 bg-background">
      <div className="container">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl lg:text-5xl font-serif font-bold text-primary mb-4">
            How it works
          </h2>
          <p className="text-lg text-foreground mb-8">
            Bringing convenience and safety to buying Gold!
          </p>

          {/* Tab Switcher */}
          <div className="inline-flex gap-4 bg-secondary rounded-lg p-1">
            {['buy', 'sell'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-8 py-2 rounded-md font-semibold transition-all ${
                  activeTab === tab
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground hover:text-primary'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={index} className="relative">
                {/* Connecting Line (hidden on mobile) */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-12 left-[calc(50%+48px)] right-[calc(-50%+48px)] h-1 bg-accent/30" />
                )}

                {/* Step Card */}
                <div className="text-center">
                  {/* Step Circle */}
                  <div className="flex justify-center mb-6">
                    <div className="step-circle bg-white border-2 border-primary">
                      <span className="step-number">{step.number}</span>
                    </div>
                  </div>

                  {/* Step Content */}
                  <h3 className="text-xl font-serif font-bold text-primary mb-3">
                    {step.title}
                  </h3>
                  <p className="text-foreground text-sm leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
