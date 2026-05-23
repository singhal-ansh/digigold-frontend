import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { goldPriceApi } from '@/lib/api';
import { Link } from 'wouter';

export default function HeroBanner() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [priceData, setPriceData] = useState<{ buyPriceWithGst: number; gstPercentage: number; validitySeconds: number } | null>(null);
  const [priceLoading, setPriceLoading] = useState(true);
  const [priceTimer, setPriceTimer] = useState(300);
  const [buyAmount, setBuyAmount] = useState('');
  const [buyMode, setBuyMode] = useState<'rupee' | 'grams'>('rupee');

  const banners = [
    { id: 1, title: 'Invest in Pure Gold', subtitle: '999.9 purity guaranteed by MMTC-PAMP', color: 'from-amber-50 to-amber-100' },
    { id: 2, title: 'Safe & Secure', subtitle: 'Your gold stored in certified vaults', color: 'from-amber-100 to-amber-50' },
    { id: 3, title: 'Transparent Pricing', subtitle: 'Live market rates, 24/7 availability', color: 'from-amber-50 to-yellow-100' },
  ];

  const fetchPrice = async () => {
    setPriceLoading(true);
    try {
      const p = await goldPriceApi.getLivePrice();
      setPriceData(p);
      setPriceTimer(p.validitySeconds || 300);
    } catch {
      // Backend not running — show placeholder
      setPriceData(null);
    } finally {
      setPriceLoading(false);
    }
  };

  useEffect(() => { fetchPrice(); }, []);

  useEffect(() => {
    const t = setInterval(() => setCurrentSlide(p => (p + 1) % banners.length), 5000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setPriceTimer(prev => {
        if (prev <= 1) { fetchPrice(); return 300; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const formatTimer = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const calcGold = () => {
    if (!priceData || !buyAmount) return '0.0000';
    const v = parseFloat(buyAmount);
    return buyMode === 'rupee' ? (v / priceData.buyPriceWithGst).toFixed(4) : buyAmount;
  };

  const calcTotal = () => {
    if (!priceData || !buyAmount) return '0.00';
    const v = parseFloat(buyAmount);
    return buyMode === 'rupee' ? v.toFixed(2) : (v * priceData.buyPriceWithGst).toFixed(2);
  };

  const calcTax = () => {
    if (!priceData || !buyAmount) return '0.00';
    const v = parseFloat(buyAmount);
    const base = buyMode === 'rupee'
      ? v / (1 + priceData.gstPercentage / 100)
      : v * (priceData.buyPriceWithGst / (1 + priceData.gstPercentage / 100));
    return (base * priceData.gstPercentage / 100).toFixed(2);
  };

  return (
    <section className="relative bg-gradient-to-r from-amber-50 to-amber-100 overflow-hidden">
      <div className="container py-12 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Left: Carousel */}
          <div className="relative h-96 lg:h-full rounded-lg overflow-hidden">
            <div className="relative w-full h-full">
              {banners.map((banner, index) => (
                <div key={banner.id} className={`absolute inset-0 transition-opacity duration-500 ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}>
                  <div className={`w-full h-full bg-gradient-to-br ${banner.color} flex items-center justify-center`}>
                    <div className="text-center px-8">
                      <h2 className="text-4xl font-serif font-bold text-primary mb-4">{banner.title}</h2>
                      <p className="text-lg text-foreground">{banner.subtitle}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => setCurrentSlide(p => (p - 1 + banners.length) % banners.length)}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white text-primary p-2 rounded-full transition-all">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button onClick={() => setCurrentSlide(p => (p + 1) % banners.length)}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white text-primary p-2 rounded-full transition-all">
              <ChevronRight className="w-6 h-6" />
            </button>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {banners.map((_, i) => (
                <button key={i} onClick={() => setCurrentSlide(i)}
                  className={`h-2 rounded-full transition-all ${i === currentSlide ? 'bg-primary w-8' : 'bg-white/60 w-2 hover:bg-white/80'}`} />
              ))}
            </div>
          </div>

          {/* Right: Live Price & Buy Box */}
          <div className="bg-white rounded-lg shadow-lg p-8 border-l-4 border-accent">
            <div className="mb-8">
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-sm font-medium text-muted-foreground">Live Price</span>
                <span className="text-xs text-muted-foreground">valid for {formatTimer(priceTimer)}</span>
              </div>
              {priceLoading ? (
                <div className="flex items-center gap-2 text-primary">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm">Fetching live price...</span>
                </div>
              ) : priceData ? (
                <div className="text-5xl font-serif font-bold text-primary mb-4">
                  ₹{Number(priceData.buyPriceWithGst).toFixed(2)}
                  <span className="text-2xl text-muted-foreground">/gm</span>
                </div>
              ) : (
                <div className="text-3xl font-serif font-bold text-amber-700 mb-4">
                  Price unavailable
                  <div className="text-sm font-normal text-gray-400 mt-1">Backend server not running</div>
                </div>
              )}
              <p className="text-sm text-muted-foreground">Amount inclusive of {priceData?.gstPercentage || 3}% GST</p>
            </div>

            <div className="border-t border-border pt-6">
              <h3 className="text-2xl font-serif font-bold text-primary mb-6">Buy Digital Gold</h3>
              <div className="space-y-4 mb-6">
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="buyType" checked={buyMode === 'rupee'} onChange={() => setBuyMode('rupee')} className="w-4 h-4" />
                    <span className="text-sm font-medium">Buy in rupee</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="buyType" checked={buyMode === 'grams'} onChange={() => setBuyMode('grams')} className="w-4 h-4" />
                    <span className="text-sm font-medium">Buy in grams</span>
                  </label>
                </div>
                <input
                  type="number"
                  value={buyAmount}
                  onChange={(e) => setBuyAmount(e.target.value)}
                  placeholder={buyMode === 'rupee' ? 'Enter amount in ₹' : 'Enter weight in grams'}
                  className="w-full px-4 py-3 border border-border rounded-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <div className="grid grid-cols-5 gap-2">
                  {(buyMode === 'rupee' ? ['100','500','1000','5000','10000'] : ['0.1','0.5','1','5','10']).map((v) => (
                    <button key={v} onClick={() => setBuyAmount(v)}
                      className="px-2 py-2 border border-border rounded-sm hover:bg-secondary transition-colors text-sm font-medium">
                      {buyMode === 'rupee' ? `₹${Number(v).toLocaleString()}` : `${v}g`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-secondary rounded-sm p-4 mb-6 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Gold you'll get:</span>
                  <span className="font-semibold">{calcGold()}g</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax:</span>
                  <span className="font-semibold">₹{calcTax()}</span>
                </div>
                <div className="border-t border-border pt-2 flex justify-between">
                  <span className="font-semibold">Total Amount:</span>
                  <span className="text-lg font-bold text-primary">₹{calcTotal()}</span>
                </div>
              </div>

              <Link href="/login">
                <button className="w-full bg-primary text-primary-foreground px-8 py-3 rounded-sm font-semibold hover:bg-primary/90 transition-all duration-150 active:scale-95 mb-4">
                  Buy Now — Login to Continue
                </button>
              </Link>
              <p className="text-xs text-center text-muted-foreground">24k, 999.9 purity guaranteed by MMTC-PAMP</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
