/**
 * Features Component - Key Benefits Grid
 * Design: 3-column grid with icon, title, and description
 * Features: Luxury card styling with subtle borders and shadows
 */
export default function Features() {
  const features = [
    {
      id: 1,
      title: 'Highest Purity',
      description: 'Buy 999.9 / 24K purest gold anytime, at your convenience. NIL-negative tolerance standards ensure the purity and weights of our products are always greater than or equal to what you purchase.',
      icon: '🏆',
    },
    {
      id: 2,
      title: 'Transparent Pricing',
      description: 'As an LBMA-accredited gold and silver refinery, our gold prices are linked to international market rates available 24-hours a day, 365-days a year.',
      icon: '💰',
    },
    {
      id: 3,
      title: '100% Secure',
      description: 'The gold you buy online is allocated as physical gold under your direct ownership and stored within fully insured, certified vaults located on our highly secure premises.',
      icon: '🔒',
    },
    {
      id: 4,
      title: 'Doorstep Delivery',
      description: 'Doorstep Delivery Available for Conversions: Select from our extensive range of jewelry, pure gold bars, and coins in various weights for secure, convenient home delivery.',
      icon: '📦',
    },
    {
      id: 5,
      title: 'Easy Buyback',
      description: 'You can sell your stored Digital Gold to MMTC-PAMP at the current live market price and receive the amount via Direct Bank Transfer.',
      icon: '↩️',
    },
    {
      id: 6,
      title: 'Global Quality Excellence',
      description: 'The only Digital Gold Provider to offer 999.9 (24K) pure gold. Our Assay Laboratory is NABL-accredited and operations are certified by ISO standards.',
      icon: '🌍',
    },
  ];

  return (
    <section className="py-16 lg:py-24 bg-white">
      <div className="container">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl lg:text-5xl font-serif font-bold text-primary mb-4">
            What makes FinGold-MMTC PAMP digi gold special?
          </h2>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature) => (
            <div
              key={feature.id}
              className="card-luxury hover:shadow-md transition-shadow duration-300 group"
            >
              {/* Icon */}
              <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">
                {feature.icon}
              </div>

              {/* Title */}
              <h3 className="text-xl font-serif font-bold text-primary mb-3">
                {feature.title}
              </h3>

              {/* Description */}
              <p className="text-foreground text-sm leading-relaxed">
                {feature.description}
              </p>

              {/* Gold Accent Line */}
              <div className="mt-4 h-1 w-12 bg-accent" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
