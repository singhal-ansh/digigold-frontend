import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { walletApi, goldPriceApi, transactionApi, userApi, bankApi } from "@/lib/api";
import {
  Loader2, TrendingUp, TrendingDown, RefreshCw, LogOut, User, Clock,
  ShieldCheck, Building2, Settings, ChevronLeft, ChevronRight, LayoutDashboard
} from "lucide-react";
import { Link, useLocation } from "wouter";
import AdminPanel from "./AdminPanel";

interface GoldPrice {
  id: number;
  buyPricePerGram: number;
  sellPricePerGram: number;
  gstPercentage: number;
  buyPriceWithGst: number;
  validitySeconds: number;
}

interface Wallet {
  goldBalanceGrams: number;
  inrBalance: number;
  totalGoldBought: number;
  totalGoldSold: number;
  currentValueInr: number;
}

interface Transaction {
  id: number;
  orderReference: string;
  type: "BUY" | "SELL";
  status: string;
  goldGrams: number;
  totalAmount: number;
  createdAt: string;
}

interface BankAccount {
  accountNumber: string;
  ifscCode: string;
  accountHolderName: string;
  bankName: string;
}

type TabType = "buy" | "sell" | "wallet" | "transactions" | "kyc" | "settings";

export default function Dashboard() {
  const { user, logout, refreshUser } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<TabType>("buy");
  const [price, setPrice] = useState<GoldPrice | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [txPage, setTxPage] = useState(0);
  const [txTotalPages, setTxTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [priceTimer, setPriceTimer] = useState(300);
  const [showAdmin, setShowAdmin] = useState(false);

  // Buy form
  const [buyMode, setBuyMode] = useState<"rupee" | "grams">("rupee");
  const [buyAmount, setBuyAmount] = useState("");
  const [buyLoading, setBuyLoading] = useState(false);
  const [buyMsg, setBuyMsg] = useState("");

  // Sell form
  const [sellMode, setSellMode] = useState<"rupee" | "grams">("grams");
  const [sellAmount, setSellAmount] = useState("");
  const [sellLoading, setSellLoading] = useState(false);
  const [sellMsg, setSellMsg] = useState("");

  // KYC form
  const [panNumber, setPanNumber] = useState("");
  const [kycLoading, setKycLoading] = useState(false);
  const [kycMsg, setKycMsg] = useState("");

  // Bank form
  const [bankAccount, setBankAccount] = useState<BankAccount | null>(null);
  const [bankForm, setBankForm] = useState({ accountNumber: "", ifscCode: "", accountHolderName: "", bankName: "" });
  const [bankLoading, setBankLoading] = useState(false);
  const [bankMsg, setBankMsg] = useState("");
  const [showBankForm, setShowBankForm] = useState(false);

  // Settings form
  const [settingsForm, setSettingsForm] = useState({ fullName: "", phone: "" });
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState("");

  const fetchPrice = useCallback(async () => {
    try {
      const p = await goldPriceApi.getLivePrice();
      setPrice(p);
      setPriceTimer(p.validitySeconds || 300);
    } catch {}
  }, []);

  const fetchWallet = useCallback(async () => {
    try {
      const w = await walletApi.getMyWallet();
      setWallet(w);
    } catch {}
  }, []);

  const fetchTransactions = useCallback(async (page = 0) => {
    try {
      const t = await transactionApi.getMyTransactions(page, 10);
      setTransactions(t.content || []);
      setTxTotalPages(t.totalPages || 1);
      setTxPage(page);
    } catch {}
  }, []);

  const fetchBankAccount = useCallback(async () => {
    try {
      const b = await bankApi.getMyBankAccount();
      setBankAccount(b);
      setBankForm(b);
    } catch {}
  }, []);

  useEffect(() => {
    Promise.all([fetchPrice(), fetchWallet(), fetchTransactions(), fetchBankAccount()])
      .finally(() => setLoading(false));
  }, []);

  // Pre-fill settings form when user loads
  useEffect(() => {
    if (user) setSettingsForm({ fullName: user.fullName, phone: user.phone || "" });
  }, [user]);

  // Live price countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setPriceTimer((prev) => {
        if (prev <= 1) { fetchPrice(); return 300; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [fetchPrice]);

  const formatTimer = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  // Buy calculations
  const calcBuyGrams = () => {
    if (!price || !buyAmount) return 0;
    const amt = parseFloat(buyAmount);
    if (buyMode === "rupee") return amt / price.buyPriceWithGst;
    return amt;
  };
  const calcBuyTotal = () => {
    if (!price || !buyAmount) return 0;
    const amt = parseFloat(buyAmount);
    if (buyMode === "rupee") return amt;
    return amt * price.buyPriceWithGst;
  };
  const calcBuyTax = () => {
    if (!price || !buyAmount) return 0;
    const amt = parseFloat(buyAmount);
    const base = buyMode === "rupee" ? amt / (1 + price.gstPercentage / 100) : amt * price.buyPricePerGram;
    return base * (price.gstPercentage / 100);
  };

  // Sell calculations
  const calcSellGrams = () => {
    if (!price || !sellAmount) return 0;
    if (sellMode === "grams") return parseFloat(sellAmount);
    return parseFloat(sellAmount) / price.sellPricePerGram;
  };
  const calcSellReceive = () => {
    if (!price || !sellAmount) return 0;
    const grams = calcSellGrams();
    return grams * price.sellPricePerGram;
  };

  const handleBuy = async () => {
    if (!price || !buyAmount) return;
    setBuyLoading(true);
    setBuyMsg("");
    try {
      const payload =
        buyMode === "rupee"
          ? { amountInRupees: parseFloat(buyAmount), goldPriceId: price.id }
          : { goldGrams: parseFloat(buyAmount), goldPriceId: price.id };
      const order = await transactionApi.initiateBuy(payload);
      if ((window as any).Razorpay) {
        const rzp = new (window as any).Razorpay({
          key: order.razorpayKeyId,
          amount: order.amountInPaise,
          currency: order.currency || "INR",
          name: "FinGold",
          order_id: order.razorpayOrderId,
          handler: async (response: any) => {
            try {
              await transactionApi.verifyPayment({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                orderReference: order.orderReference,
              });
              setBuyMsg(`✅ Purchase successful! ${order.goldGrams?.toFixed(4)}g credited to wallet.`);
              setBuyAmount("");
              fetchWallet();
              fetchTransactions();
            } catch {
              setBuyMsg("❌ Payment verification failed. Contact support.");
            }
          },
          prefill: { name: user?.fullName, email: user?.email, contact: user?.phone },
          theme: { color: "#7B1C1C" },
        });
        rzp.open();
      } else {
        setBuyMsg(`Order created! Razorpay Order ID: ${order.razorpayOrderId}. Total: ₹${order.totalAmount}`);
      }
    } catch (err: any) {
      setBuyMsg("❌ " + (err?.response?.data?.message || "Purchase failed. Try again."));
    } finally {
      setBuyLoading(false);
    }
  };

  const handleSell = async () => {
    if (!price || !sellAmount) return;
    setSellLoading(true);
    setSellMsg("");
    try {
      const grams = calcSellGrams();
      const result = await transactionApi.sell({ goldGrams: grams, goldPriceId: price.id });
      const acct = bankAccount ? ` to account ending ****${bankAccount.accountNumber.slice(-4)}` : "";
      setSellMsg(`✅ Sold ${result.goldGrams}g for ₹${result.netAmount?.toFixed(2)}. Amount will be credited${acct} in 2–3 business days.`);
      setSellAmount("");
      fetchWallet();
      fetchTransactions();
    } catch (err: any) {
      setSellMsg("❌ " + (err?.response?.data?.message || "Sell failed. Try again."));
    } finally {
      setSellLoading(false);
    }
  };

  const handleKycSubmit = async () => {
    if (!panNumber.trim()) return;
    setKycLoading(true);
    setKycMsg("");
    try {
      await userApi.submitKyc({ panNumber: panNumber.toUpperCase() });
      setKycMsg("✅ KYC submitted successfully! Verification takes 1–2 business days.");
      await refreshUser();
    } catch (err: any) {
      setKycMsg("❌ " + (err?.response?.data?.message || "KYC submission failed. Try again."));
    } finally {
      setKycLoading(false);
    }
  };

  const handleBankSave = async () => {
    setBankLoading(true);
    setBankMsg("");
    try {
      const saved = await bankApi.saveBankAccount(bankForm);
      setBankAccount(saved);
      setBankMsg("✅ Bank account saved successfully.");
      setShowBankForm(false);
    } catch (err: any) {
      setBankMsg("❌ " + (err?.response?.data?.message || "Failed to save bank account."));
    } finally {
      setBankLoading(false);
    }
  };

  const handleProfileSave = async () => {
    setSettingsLoading(true);
    setSettingsMsg("");
    try {
      await userApi.updateMe(settingsForm);
      await refreshUser();
      setSettingsMsg("✅ Profile updated successfully.");
    } catch (err: any) {
      setSettingsMsg("❌ " + (err?.response?.data?.message || "Update failed."));
    } finally {
      setSettingsLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setSettingsMsg("❌ New passwords do not match.");
      return;
    }
    setSettingsLoading(true);
    setSettingsMsg("");
    try {
      const { authApi } = await import("@/lib/api");
      await authApi.changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      setSettingsMsg("✅ Password changed successfully.");
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err: any) {
      setSettingsMsg("❌ " + (err?.response?.data?.message || "Password change failed."));
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-amber-50">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (showAdmin && user?.role === "ADMIN") {
    return <AdminPanel onBack={() => setShowAdmin(false)} />;
  }

  const tabs: { id: TabType; label: string }[] = [
    { id: "buy", label: "Buy" },
    { id: "sell", label: "Sell" },
    { id: "wallet", label: "Wallet" },
    { id: "transactions", label: "History" },
    { id: "kyc", label: "KYC" },
    { id: "settings", label: "Settings" },
  ];

  const kycVerified = user?.kycStatus === "VERIFIED";
  const kycPending = user?.kycStatus === "UNDER_REVIEW";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-primary text-primary-foreground py-2 px-4 text-sm flex justify-between items-center">
        <span>Swiss Excellence Made in India</span>
        <span>MMTC-PAMP Certified</span>
      </div>
      <header className="bg-white border-b shadow-sm sticky top-0 z-50">
        <div className="container py-4 flex justify-between items-center">
          <Link href="/">
            <div className="flex items-center">
              <span className="text-2xl font-serif font-bold text-primary">Fin</span>
              <span className="text-xl font-serif font-bold text-amber-600">Gold</span>
            </div>
          </Link>
          <nav className="hidden md:flex gap-5">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`text-sm font-medium pb-1 border-b-2 capitalize transition-colors ${
                  activeTab === tab.id ? "border-amber-600 text-primary" : "border-transparent text-gray-600 hover:text-primary"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            {user?.role === "ADMIN" && (
              <button
                onClick={() => setShowAdmin(true)}
                className="flex items-center gap-1 text-sm text-amber-700 hover:text-amber-800 font-medium"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span className="hidden sm:inline">Admin</span>
              </button>
            )}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">{user?.fullName}</span>
            </div>
            <button onClick={handleLogout} className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700">
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
        {/* Mobile nav */}
        <div className="md:hidden border-t flex overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-shrink-0 px-3 py-2 text-xs font-medium capitalize transition-colors ${
                activeTab === tab.id ? "bg-primary text-primary-foreground" : "text-gray-600"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      <div className="container py-6">
        {/* Live Price Bar */}
        {price && (
          <div className="bg-white rounded-lg border shadow-sm p-4 mb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <div>
                <p className="text-xs text-gray-500 mb-1">Buy Price (incl. GST)</p>
                <p className="text-2xl font-serif font-bold text-primary">
                  ₹{Number(price.buyPriceWithGst).toFixed(2)}<span className="text-sm text-gray-500">/gm</span>
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Sell Price</p>
                <p className="text-2xl font-serif font-bold text-green-700">
                  ₹{Number(price.sellPricePerGram).toFixed(2)}<span className="text-sm text-gray-500">/gm</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock className="w-4 h-4" />
              <span>Price valid for {formatTimer(priceTimer)}</span>
              <button onClick={fetchPrice} className="ml-2 text-primary hover:text-amber-600">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── BUY TAB ── */}
        {activeTab === "buy" && (
          <div className="max-w-lg mx-auto bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-serif font-bold text-primary mb-6">Buy Digital Gold</h2>
            <div className="flex gap-4 mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" checked={buyMode === "rupee"} onChange={() => setBuyMode("rupee")} />
                <span className="text-sm font-medium">Buy in ₹</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" checked={buyMode === "grams"} onChange={() => setBuyMode("grams")} />
                <span className="text-sm font-medium">Buy in grams</span>
              </label>
            </div>
            <input
              type="number" min="0" value={buyAmount}
              onChange={(e) => setBuyAmount(e.target.value)}
              className="w-full px-4 py-3 border rounded-sm focus:outline-none focus:ring-2 focus:ring-amber-500 mb-3"
              placeholder={buyMode === "rupee" ? "Enter amount in ₹" : "Enter weight in grams"}
            />
            <div className="grid grid-cols-5 gap-2 mb-4">
              {(buyMode === "rupee" ? ["100", "500", "1000", "5000", "10000"] : ["0.1", "0.5", "1", "5", "10"]).map((v) => (
                <button key={v} onClick={() => setBuyAmount(v)}
                  className="text-xs py-2 border rounded-sm hover:bg-amber-50 transition-colors font-medium">
                  {buyMode === "rupee" ? `₹${Number(v).toLocaleString()}` : `${v}g`}
                </button>
              ))}
            </div>
            <div className="bg-amber-50 rounded-sm p-4 mb-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Gold you'll get:</span>
                <span className="font-semibold">{calcBuyGrams().toFixed(4)}g</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">GST ({price?.gstPercentage}%):</span>
                <span className="font-semibold">₹{calcBuyTax().toFixed(2)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-bold">
                <span>Total:</span>
                <span className="text-primary">₹{calcBuyTotal().toFixed(2)}</span>
              </div>
            </div>
            {buyMsg && (
              <div className={`mb-3 p-3 rounded-sm text-sm ${buyMsg.startsWith("✅") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                {buyMsg}
              </div>
            )}
            <button
              onClick={handleBuy}
              disabled={buyLoading || !buyAmount || !price}
              className="w-full bg-primary text-primary-foreground py-3 rounded-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {buyLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {buyLoading ? "Processing..." : "Buy Now"}
            </button>
            <p className="text-xs text-center text-gray-400 mt-3">24K, 999.9 purity guaranteed by MMTC-PAMP</p>
          </div>
        )}

        {/* ── SELL TAB ── */}
        {activeTab === "sell" && (
          <div className="max-w-lg mx-auto space-y-4">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-serif font-bold text-primary mb-4">Sell Digital Gold</h2>
              {wallet && (
                <div className="bg-amber-50 rounded-sm p-4 mb-6">
                  <p className="text-sm text-gray-500 mb-1">Available Balance</p>
                  <p className="text-2xl font-bold text-primary">{Number(wallet.goldBalanceGrams).toFixed(4)}g</p>
                  <p className="text-sm text-gray-500">≈ ₹{Number(wallet.currentValueInr).toFixed(2)}</p>
                </div>
              )}

              {/* Sell mode toggle — mirrors buy */}
              <div className="flex gap-4 mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" checked={sellMode === "grams"} onChange={() => setSellMode("grams")} />
                  <span className="text-sm font-medium">Sell in grams</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" checked={sellMode === "rupee"} onChange={() => setSellMode("rupee")} />
                  <span className="text-sm font-medium">Sell in ₹</span>
                </label>
              </div>

              <input
                type="number"
                min={sellMode === "grams" ? "0.001" : "1"}
                step={sellMode === "grams" ? "0.001" : "1"}
                value={sellAmount}
                onChange={(e) => setSellAmount(e.target.value)}
                className="w-full px-4 py-3 border rounded-sm focus:outline-none focus:ring-2 focus:ring-amber-500 mb-3"
                placeholder={sellMode === "grams" ? "e.g. 0.5 grams" : "e.g. ₹500"}
              />

              {sellAmount && price && (
                <div className="bg-amber-50 rounded-sm p-4 mb-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Gold to sell:</span>
                    <span className="font-semibold">{calcSellGrams().toFixed(4)}g</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Sell Price:</span>
                    <span>₹{Number(price.sellPricePerGram).toFixed(2)}/g</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-bold">
                    <span>You'll receive:</span>
                    <span className="text-green-700">₹{calcSellReceive().toFixed(2)}</span>
                  </div>
                </div>
              )}

              {/* Bank account preview */}
              {bankAccount ? (
                <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-sm px-4 py-3 mb-4">
                  <Building2 className="w-4 h-4 shrink-0 text-gray-400" />
                  <span>Credited to <strong>{bankAccount.bankName}</strong> ****{bankAccount.accountNumber.slice(-4)}</span>
                  <button onClick={() => setActiveTab("settings")} className="ml-auto text-xs text-primary underline">Change</button>
                </div>
              ) : (
                <div className="text-sm text-amber-700 bg-amber-50 rounded-sm px-4 py-3 mb-4">
                  No bank account linked. <button onClick={() => setActiveTab("settings")} className="underline font-medium">Add one</button> to receive sell proceeds.
                </div>
              )}

              {sellMsg && (
                <div className={`mb-3 p-3 rounded-sm text-sm ${sellMsg.startsWith("✅") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                  {sellMsg}
                </div>
              )}
              <button
                onClick={handleSell}
                disabled={sellLoading || !sellAmount || !price}
                className="w-full bg-green-700 text-white py-3 rounded-sm font-semibold hover:bg-green-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {sellLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                {sellLoading ? "Processing..." : "Sell Gold"}
              </button>
            </div>
          </div>
        )}

        {/* ── WALLET TAB ── */}
        {activeTab === "wallet" && (
          <div className="max-w-lg mx-auto space-y-4">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-serif font-bold text-primary">My Gold Wallet</h2>
                <button onClick={fetchWallet} className="text-primary hover:text-amber-600">
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
              {wallet ? (
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-amber-400 to-amber-600 rounded-lg p-6 text-white">
                    <p className="text-sm opacity-90 mb-1">Total Gold Balance</p>
                    <p className="text-4xl font-serif font-bold">{Number(wallet.goldBalanceGrams).toFixed(4)}<span className="text-xl ml-1">g</span></p>
                    <p className="text-sm opacity-90 mt-2">≈ ₹{Number(wallet.currentValueInr).toFixed(2)} at live sell price</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-green-50 rounded-sm p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <TrendingUp className="w-4 h-4 text-green-600" />
                        <span className="text-xs text-gray-500">Total Bought</span>
                      </div>
                      <p className="font-bold text-green-700">{Number(wallet.totalGoldBought).toFixed(4)}g</p>
                    </div>
                    <div className="bg-red-50 rounded-sm p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <TrendingDown className="w-4 h-4 text-red-600" />
                        <span className="text-xs text-gray-500">Total Sold</span>
                      </div>
                      <p className="font-bold text-red-700">{Number(wallet.totalGoldSold).toFixed(4)}g</p>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-sm p-4 space-y-2">
                    <p className="text-xs text-gray-500">Account Holder</p>
                    <p className="font-semibold">{user?.fullName}</p>
                    <p className="text-sm text-gray-500">{user?.email}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        user?.kycStatus === "VERIFIED" ? "bg-green-100 text-green-700" :
                        user?.kycStatus === "UNDER_REVIEW" ? "bg-blue-100 text-blue-700" :
                        user?.kycStatus === "REJECTED" ? "bg-red-100 text-red-700" :
                        "bg-amber-100 text-amber-700"
                      }`}>
                        KYC: {user?.kycStatus || "PENDING"}
                      </span>
                    </div>
                  </div>
                  {wallet.inrBalance > 0 && (
                    <div className="bg-green-50 rounded-sm p-4">
                      <p className="text-xs text-gray-500 mb-1">INR Balance (pending payout)</p>
                      <p className="font-bold text-green-700">₹{Number(wallet.inrBalance).toFixed(2)}</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">Unable to load wallet. Please try again.</p>
              )}
            </div>
          </div>
        )}

        {/* ── TRANSACTIONS TAB ── */}
        {activeTab === "transactions" && (
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-serif font-bold text-primary">Transaction History</h2>
              <button onClick={() => fetchTransactions(txPage)} className="text-primary hover:text-amber-600">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
            {transactions.length === 0 ? (
              <div className="p-12 text-center text-gray-400">
                <p className="text-lg mb-2">No transactions yet</p>
                <p className="text-sm">Start by buying your first gram of gold!</p>
                <button onClick={() => setActiveTab("buy")} className="mt-4 bg-primary text-white px-6 py-2 rounded-sm text-sm font-medium hover:bg-primary/90">
                  Buy Gold
                </button>
              </div>
            ) : (
              <>
                <div className="divide-y">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === "BUY" ? "bg-green-100" : "bg-red-100"}`}>
                          {tx.type === "BUY" ? (
                            <TrendingUp className="w-5 h-5 text-green-600" />
                          ) : (
                            <TrendingDown className="w-5 h-5 text-red-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{tx.type === "BUY" ? "Bought Gold" : "Sold Gold"}</p>
                          <p className="text-xs text-gray-400">{new Date(tx.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</p>
                          <p className="text-xs text-gray-400">{tx.orderReference}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-sm">{Number(tx.goldGrams).toFixed(4)}g</p>
                        <p className={`text-sm font-bold ${tx.type === "BUY" ? "text-red-600" : "text-green-600"}`}>
                          {tx.type === "BUY" ? "-" : "+"}₹{Number(tx.totalAmount).toFixed(2)}
                        </p>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                          tx.status === "COMPLETED" ? "bg-green-100 text-green-700" :
                          tx.status === "PENDING" ? "bg-amber-100 text-amber-700" :
                          "bg-gray-100 text-gray-600"
                        }`}>
                          {tx.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Pagination */}
                {txTotalPages > 1 && (
                  <div className="flex items-center justify-center gap-4 p-4 border-t">
                    <button
                      onClick={() => fetchTransactions(txPage - 1)}
                      disabled={txPage === 0}
                      className="flex items-center gap-1 text-sm text-gray-600 disabled:opacity-40 hover:text-primary"
                    >
                      <ChevronLeft className="w-4 h-4" /> Prev
                    </button>
                    <span className="text-sm text-gray-500">Page {txPage + 1} of {txTotalPages}</span>
                    <button
                      onClick={() => fetchTransactions(txPage + 1)}
                      disabled={txPage >= txTotalPages - 1}
                      className="flex items-center gap-1 text-sm text-gray-600 disabled:opacity-40 hover:text-primary"
                    >
                      Next <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── KYC TAB ── */}
        {activeTab === "kyc" && (
          <div className="max-w-lg mx-auto space-y-4">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center gap-3 mb-6">
                <ShieldCheck className="w-6 h-6 text-primary" />
                <h2 className="text-xl font-serif font-bold text-primary">KYC Verification</h2>
              </div>

              {/* Status badge */}
              <div className={`rounded-sm p-4 mb-6 text-sm font-medium ${
                kycVerified ? "bg-green-50 text-green-700 border border-green-200" :
                kycPending ? "bg-blue-50 text-blue-700 border border-blue-200" :
                user?.kycStatus === "REJECTED" ? "bg-red-50 text-red-700 border border-red-200" :
                "bg-amber-50 text-amber-700 border border-amber-200"
              }`}>
                {kycVerified && "✅ Your KYC is verified. You can transact without limits."}
                {kycPending && "🔄 Your KYC is under review. This usually takes 1–2 business days."}
                {user?.kycStatus === "REJECTED" && "❌ Your KYC was rejected. Please re-submit with correct details."}
                {(!user?.kycStatus || user?.kycStatus === "PENDING") && "⚠️ Complete KYC to unlock higher transaction limits and full account features."}
              </div>

              {!kycVerified && !kycPending && (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">PAN Number <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      maxLength={10}
                      value={panNumber}
                      onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                      className="w-full px-4 py-3 border rounded-sm focus:outline-none focus:ring-2 focus:ring-amber-500 uppercase tracking-widest"
                      placeholder="ABCDE1234F"
                    />
                    <p className="text-xs text-gray-400 mt-1">10-character PAN as on your card</p>
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-medium mb-1">Upload ID Proof</label>
                    <div className="border-2 border-dashed border-gray-200 rounded-sm p-6 text-center text-sm text-gray-400">
                      <p className="mb-1">Drag & drop or click to upload</p>
                      <p className="text-xs">Aadhaar front & back, or Passport (PDF/JPG, max 5MB)</p>
                      <p className="text-xs mt-2 italic text-amber-600">File upload coming soon — PAN number submission is active</p>
                    </div>
                  </div>

                  {kycMsg && (
                    <div className={`mb-3 p-3 rounded-sm text-sm ${kycMsg.startsWith("✅") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                      {kycMsg}
                    </div>
                  )}

                  <button
                    onClick={handleKycSubmit}
                    disabled={kycLoading || panNumber.length !== 10}
                    className="w-full bg-primary text-primary-foreground py-3 rounded-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {kycLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                    Submit KYC
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* ── SETTINGS TAB ── */}
        {activeTab === "settings" && (
          <div className="max-w-lg mx-auto space-y-4">
            {/* Profile */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center gap-3 mb-5">
                <Settings className="w-5 h-5 text-gray-500" />
                <h2 className="text-lg font-semibold text-gray-800">Profile Settings</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Full Name</label>
                  <input
                    type="text"
                    value={settingsForm.fullName}
                    onChange={(e) => setSettingsForm({ ...settingsForm, fullName: e.target.value })}
                    className="w-full px-4 py-2.5 border rounded-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Phone</label>
                  <input
                    type="tel"
                    value={settingsForm.phone}
                    onChange={(e) => setSettingsForm({ ...settingsForm, phone: e.target.value })}
                    className="w-full px-4 py-2.5 border rounded-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input type="email" value={user?.email || ""} disabled
                    className="w-full px-4 py-2.5 border rounded-sm bg-gray-50 text-gray-400 cursor-not-allowed" />
                </div>
              </div>
              <button
                onClick={handleProfileSave}
                disabled={settingsLoading}
                className="mt-4 bg-primary text-primary-foreground px-6 py-2.5 rounded-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {settingsLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Save Changes
              </button>
            </div>

            {/* Bank Account */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <Building2 className="w-5 h-5 text-gray-500" />
                  <h2 className="text-lg font-semibold text-gray-800">Bank Account</h2>
                </div>
                <button onClick={() => setShowBankForm(!showBankForm)} className="text-sm text-primary hover:underline">
                  {bankAccount ? "Edit" : "Add Account"}
                </button>
              </div>

              {bankAccount && !showBankForm && (
                <div className="bg-gray-50 rounded-sm p-4 text-sm space-y-1">
                  <p><span className="text-gray-500">Bank:</span> <strong>{bankAccount.bankName}</strong></p>
                  <p><span className="text-gray-500">Account:</span> ****{bankAccount.accountNumber.slice(-4)}</p>
                  <p><span className="text-gray-500">IFSC:</span> {bankAccount.ifscCode}</p>
                  <p><span className="text-gray-500">Name:</span> {bankAccount.accountHolderName}</p>
                </div>
              )}

              {(showBankForm || !bankAccount) && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Account Holder Name</label>
                    <input type="text" value={bankForm.accountHolderName}
                      onChange={(e) => setBankForm({ ...bankForm, accountHolderName: e.target.value })}
                      className="w-full px-4 py-2.5 border rounded-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="As per bank records"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Bank Name</label>
                    <input type="text" value={bankForm.bankName}
                      onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                      className="w-full px-4 py-2.5 border rounded-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="e.g. HDFC Bank"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Account Number</label>
                    <input type="text" value={bankForm.accountNumber}
                      onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })}
                      className="w-full px-4 py-2.5 border rounded-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">IFSC Code</label>
                    <input type="text" value={bankForm.ifscCode}
                      onChange={(e) => setBankForm({ ...bankForm, ifscCode: e.target.value.toUpperCase() })}
                      className="w-full px-4 py-2.5 border rounded-sm focus:outline-none focus:ring-2 focus:ring-amber-500 uppercase"
                      placeholder="HDFC0001234"
                    />
                  </div>
                  {bankMsg && (
                    <div className={`p-3 rounded-sm text-sm ${bankMsg.startsWith("✅") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                      {bankMsg}
                    </div>
                  )}
                  <button
                    onClick={handleBankSave}
                    disabled={bankLoading}
                    className="bg-primary text-primary-foreground px-6 py-2.5 rounded-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {bankLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                    Save Bank Account
                  </button>
                </div>
              )}
            </div>

            {/* Change Password */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-5">Change Password</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Current Password</label>
                  <input type="password" value={pwForm.currentPassword}
                    onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                    className="w-full px-4 py-2.5 border rounded-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">New Password</label>
                  <input type="password" value={pwForm.newPassword}
                    onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
                    className="w-full px-4 py-2.5 border rounded-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Confirm New Password</label>
                  <input type="password" value={pwForm.confirmPassword}
                    onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                    className="w-full px-4 py-2.5 border rounded-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
              {settingsMsg && (
                <div className={`mt-3 p-3 rounded-sm text-sm ${settingsMsg.startsWith("✅") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                  {settingsMsg}
                </div>
              )}
              <button
                onClick={handlePasswordChange}
                disabled={settingsLoading || !pwForm.currentPassword || !pwForm.newPassword}
                className="mt-4 bg-gray-800 text-white px-6 py-2.5 rounded-sm font-medium hover:bg-gray-900 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {settingsLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Change Password
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
