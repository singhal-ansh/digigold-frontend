import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const [, navigate] = useLocation();

  const navItems = [
    { id: 'buy', label: 'Buy' },
    { id: 'sell', label: 'Sell' },
    { id: 'wallet', label: 'Wallet' },
    { id: 'transactions', label: 'Transactions' },
    { id: 'conversion', label: 'Jewellery Conversion' },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <>
      <div className="bg-primary text-primary-foreground py-2 px-4">
        <div className="container flex justify-between items-center text-sm">
          <span>Swiss Excellence Made in India</span>
          <span>MMTC-PAMP Certified</span>
        </div>
      </div>

      <header className="bg-white border-b border-border sticky top-0 z-50">
        <div className="container py-4">
          <div className="flex justify-between items-center">
            <Link href="/">
              <div className="flex items-center cursor-pointer">
                <span className="text-2xl font-serif font-bold text-primary">Fin</span>
                <span className="text-2xl font-serif font-bold text-accent">Gold</span>
              </div>
            </Link>

            <nav className="hidden lg:flex gap-8 items-center">
              {navItems.map((item) => (
                isAuthenticated ? (
                  <Link key={item.id} href="/dashboard">
                    <span className="text-sm font-medium text-foreground hover:text-primary transition-colors cursor-pointer">
                      {item.label}
                    </span>
                  </Link>
                ) : (
                  <Link key={item.id} href="/login">
                    <span className="text-sm font-medium text-foreground hover:text-primary transition-colors cursor-pointer">
                      {item.label}
                    </span>
                  </Link>
                )
              ))}
            </nav>

            <div className="hidden lg:flex gap-4 items-center">
              {isAuthenticated ? (
                <>
                  <span className="text-sm text-gray-600 font-medium">{user?.fullName}</span>
                  <Link href="/dashboard">
                    <button className="bg-primary text-primary-foreground px-5 py-2 rounded-sm font-medium hover:bg-primary/90 transition-colors text-sm">
                      Dashboard
                    </button>
                  </Link>
                  <button onClick={handleLogout} className="text-red-600 font-medium text-sm hover:text-red-700 transition-colors">
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link href="/register">
                    <button className="text-primary font-medium text-sm hover:text-accent transition-colors">Register</button>
                  </Link>
                  <Link href="/login">
                    <button className="bg-primary text-primary-foreground px-6 py-2 rounded-sm font-medium hover:bg-primary/90 transition-colors">
                      Login
                    </button>
                  </Link>
                </>
              )}
            </div>

            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden p-2">
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {mobileMenuOpen && (
            <nav className="lg:hidden mt-4 space-y-3 pb-4">
              {navItems.map((item) => (
                <Link key={item.id} href={isAuthenticated ? "/dashboard" : "/login"}>
                  <button onClick={() => setMobileMenuOpen(false)}
                    className="block w-full text-left px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary rounded-sm transition-colors">
                    {item.label}
                  </button>
                </Link>
              ))}
              <div className="pt-4 border-t border-border space-y-2">
                {isAuthenticated ? (
                  <>
                    <Link href="/dashboard">
                      <button onClick={() => setMobileMenuOpen(false)} className="w-full bg-primary text-primary-foreground py-2 rounded-sm font-medium hover:bg-primary/90 transition-colors">
                        Dashboard
                      </button>
                    </Link>
                    <button onClick={handleLogout} className="w-full text-red-600 font-medium text-sm py-2 hover:bg-secondary rounded-sm transition-colors">
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/register">
                      <button onClick={() => setMobileMenuOpen(false)} className="w-full text-primary font-medium text-sm py-2 hover:bg-secondary rounded-sm transition-colors">Register</button>
                    </Link>
                    <Link href="/login">
                      <button onClick={() => setMobileMenuOpen(false)} className="w-full bg-primary text-primary-foreground py-2 rounded-sm font-medium hover:bg-primary/90 transition-colors">Login</button>
                    </Link>
                  </>
                )}
              </div>
            </nav>
          )}
        </div>
      </header>
    </>
  );
}
