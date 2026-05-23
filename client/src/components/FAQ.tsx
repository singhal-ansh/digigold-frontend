import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * FAQ Component - Frequently Asked Questions
 * Design: Expandable accordion with smooth transitions
 */
export default function FAQ() {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const faqs = [
    {
      id: 1,
      question: 'What is Digital Gold by FinGold?',
      answer: 'Digital Gold is a convenient way to invest in pure 999.9 gold online. Your gold is stored securely in certified vaults and you can buy or sell anytime at live market prices.',
    },
    {
      id: 2,
      question: 'What is Digi Gold Locker (Wallet)?',
      answer: 'Digi Gold Locker is your secure digital wallet where your purchased gold is stored. You can view your balance, track transactions, and manage your gold investments.',
    },
    {
      id: 3,
      question: 'What is live gold price?',
      answer: 'Live gold price is the current market rate for gold per gram. Our prices are linked to international market rates and updated in real-time, 24/7.',
    },
    {
      id: 4,
      question: 'How often does the live price change?',
      answer: 'Live gold prices change throughout the day based on international market movements. Prices are typically updated every few minutes during market hours.',
    },
    {
      id: 5,
      question: 'How long is the live price valid for completing a transaction?',
      answer: 'The live price is valid for 5 minutes. Once you initiate a transaction, the price is locked for that duration. After 5 minutes, you will need to check the updated price.',
    },
  ];

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <section className="py-16 lg:py-24 bg-white">
      <div className="container">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* FAQ List */}
          <div>
            <h2 className="text-4xl font-serif font-bold text-primary mb-8">
              Frequently Asked Questions
            </h2>

            <div className="space-y-4">
              {faqs.map((faq) => (
                <div
                  key={faq.id}
                  className="border border-border rounded-lg overflow-hidden hover:shadow-sm transition-shadow"
                >
                  <button
                    onClick={() => toggleExpand(faq.id)}
                    className="w-full px-6 py-4 flex items-center justify-between bg-white hover:bg-secondary transition-colors"
                  >
                    <span className="text-left font-semibold text-foreground">
                      {faq.id}. {faq.question}
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 text-primary flex-shrink-0 transition-transform ${
                        expandedId === faq.id ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {/* Expanded Answer */}
                  {expandedId === faq.id && (
                    <div className="px-6 py-4 bg-secondary border-t border-border">
                      <p className="text-foreground leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* View All Button */}
            <button className="mt-8 bg-transparent border-2 border-primary text-primary px-8 py-3 rounded-sm font-semibold hover:bg-primary hover:text-primary-foreground transition-all duration-150">
              View All
            </button>
          </div>

          {/* Right Side - Trust Section */}
          <div className="bg-secondary rounded-lg p-8">
            <h3 className="text-3xl font-serif font-bold text-primary mb-6">
              Why trust FinGold-MMTC PAMP digi gold?
            </h3>

            <div className="space-y-6">
              <p className="text-foreground leading-relaxed">
                MMTC-PAMP is India's only globally accredited refiner and fabricator of authentic 999.9 pure gold bars and coins. It's a joint venture between MMTC Ltd, a Government of India Undertaking, and PAMP S.A. of Switzerland.
              </p>

              <p className="text-foreground leading-relaxed">
                PAMP is the world's most accredited precious metals refinery boasting nearly a half century of global leadership. With great pride, FinGold associates with MMTC-PAMP to give customers the convenience of purchasing premium quality gold online.
              </p>

              <p className="text-foreground leading-relaxed">
                FinGold brand has always adapted to changing times and strived to give its customers the latest shopping experience. Our digital gold platform combines tradition with innovation.
              </p>

              <div className="pt-6 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  <strong>Certifications:</strong> ISO 9001, NABL Accredited, LBMA Approved
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
