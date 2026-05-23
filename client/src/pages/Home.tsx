import Header from '@/components/Header';
import HeroBanner from '@/components/HeroBanner';
import HowItWorks from '@/components/HowItWorks';
import Features from '@/components/Features';
import ConversionSteps from '@/components/ConversionSteps';
import FAQ from '@/components/FAQ';
import Footer from '@/components/Footer';

/**
 * Home Page - FinGold
 * Luxury Digital Minimalism Design
 * Features: Header, Hero Banner, How It Works, Features Grid, Conversion Steps, FAQ, Footer
 */
export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <HeroBanner />
        <HowItWorks />
        <Features />
        <ConversionSteps />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
}
