/**
 * Conversion Steps Component - DigiGold to Jewelry Process
 * Design: 4-step vertical process with alternating layout
 */
export default function ConversionSteps() {
  const steps = [
    {
      number: '01',
      title: 'Visit FinGold Showroom',
      description: 'Visit the nearest JosAlukkas Showroom and purchase your dream jewellery from our exquisite collections.',
      image: '🏪',
    },
    {
      number: '02',
      title: 'Verify Your DigiWallet Account',
      description: 'Provide your registered DigiWallet mobile number at the store counter to receive the 6-digit OTP.',
      image: '📱',
    },
    {
      number: '03',
      title: 'Check DigiWallet Balance',
      description: 'Submit the OTP received at the store counter to fetch your live DigiWallet gold balance.',
      image: '⚖️',
    },
    {
      number: '04',
      title: 'Confirm Amount and Redeem',
      description: 'Confirm the amount you want to convert to jewellery with in the store counter. Now you can leave happily with your new jewellery in hand.',
      image: '✨',
    },
  ];

  return (
    <section className="py-16 lg:py-24 bg-secondary">
      <div className="container">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl lg:text-5xl font-serif font-bold text-primary mb-4">
            Steps to Convert Your DigiGold to Jewellery
          </h2>
        </div>

        {/* Steps Timeline */}
        <div className="max-w-4xl mx-auto">
          {steps.map((step, index) => (
            <div key={index} className="mb-12 last:mb-0">
              <div className={`grid grid-cols-1 md:grid-cols-2 gap-8 items-center ${
                index % 2 === 1 ? 'md:grid-cols-2 md:[&>*:first-child]:order-2' : ''
              }`}>
                {/* Text Content */}
                <div className={index % 2 === 1 ? 'md:order-2' : ''}>
                  <div className="flex items-start gap-4">
                    {/* Step Number */}
                    <div className="flex-shrink-0">
                      <div className="step-circle bg-white border-2 border-primary">
                        <span className="step-number">{step.number}</span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <h3 className="text-2xl font-serif font-bold text-primary mb-2">
                        {step.title}
                      </h3>
                      <p className="text-foreground leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Image/Icon */}
                <div className={`flex justify-center ${index % 2 === 1 ? 'md:order-1' : ''}`}>
                  <div className="text-8xl opacity-80">
                    {step.image}
                  </div>
                </div>

                {/* Connecting Line */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute left-1/2 -translate-x-1/2 w-1 h-12 bg-accent/30 mt-4" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
