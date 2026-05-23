import { useState, useEffect, useCallback } from "react";
import { adminApi } from "@/lib/api";
import {
  Loader2, ArrowLeft, Users, TrendingUp, RefreshCw,
  CheckCircle, XCircle, Search, ChevronLeft, ChevronRight
} from "lucide-react";

interface AdminStats {
  totalUsers: number;
  totalTransactions: number;
  totalGoldSoldGrams: number;
  totalRevenueInr: number;
  activePrices: { buyPriceWithGst: number; sellPricePerGram: number } | null;
}

interface UserProfile {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  kycStatus: string;
  emailVerified: boolean;
  createdAt: string;
  enabled?: boolean;
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

type AdminTab = "overview" | "users" | "transactions";

export default function AdminPanel({ onBack }: { onBack: () => void }) {
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [userPage, setUserPage] = useState(0);
  const [userTotalPages, setUserTotalPages] = useState(1);
  const [txPage, setTxPage] = useState(0);
  const [txTotalPages, setTxTotalPages] = useState(1);
  const [kycActionLoading, setKycActionLoading] = useState<number | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const s = await adminApi.getDashboard();
      setStats(s);
    } catch {}
  }, []);

  const fetchUsers = useCallback(async (page = 0, q = "") => {
    try {
      const data = await adminApi.getUsers(q || undefined, page, 15);
      setUsers(data.content || []);
      setUserTotalPages(data.totalPages || 1);
      setUserPage(page);
    } catch {}
  }, []);

  const fetchTransactions = useCallback(async (page = 0) => {
    try {
      const data = await adminApi.getAllTransactions(page, 15);
      setTransactions(data.content || []);
      setTxTotalPages(data.totalPages || 1);
      setTxPage(page);
    } catch {}
  }, []);

  useEffect(() => {
    Promise.all([fetchStats(), fetchUsers(), fetchTransactions()])
      .finally(() => setLoading(false));
  }, []);

  const handleKyc = async (userId: number, status: "VERIFIED" | "REJECTED") => {
    setKycActionLoading(userId);
    try {
      await adminApi.updateKyc(userId, status);
      await fetchUsers(userPage, search);
    } catch {}
    setKycActionLoading(null);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers(0, search);
  };

  const handleToggleUser = async (user: UserProfile) => {
    try {
      if (user.enabled === false) {
        await adminApi.enableUser(user.id);
      } else {
        await adminApi.disableUser(user.id);
      }
      await fetchUsers(userPage, search);
    } catch {}
  };

  const kycBadge = (status: string) => {
    const map: Record<string, string> = {
      VERIFIED: "bg-green-100 text-green-700",
      REJECTED: "bg-red-100 text-red-700",
      UNDER_REVIEW: "bg-blue-100 text-blue-700",
      PENDING: "bg-amber-100 text-amber-700",
    };
    return map[status] || "bg-gray-100 text-gray-600";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-primary text-primary-foreground py-2 px-4 text-sm flex justify-between items-center">
        <span>Admin Panel</span>
        <span>FinGold</span>
      </div>
      <header className="bg-white border-b shadow-sm sticky top-0 z-50">
        <div className="container py-4 flex items-center gap-4">
          <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
          <div className="h-5 w-px bg-gray-200" />
          <span className="text-lg font-serif font-bold text-primary">Admin Panel</span>
          <nav className="ml-auto flex gap-5">
            {(["overview", "users", "transactions"] as AdminTab[]).map((t) => (
              <button key={t}
                onClick={() => setActiveTab(t)}
                className={`text-sm font-medium pb-1 border-b-2 capitalize transition-colors ${
                  activeTab === t ? "border-amber-600 text-primary" : "border-transparent text-gray-600 hover:text-primary"
                }`}
              >
                {t}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <div className="container py-6">

        {/* ── OVERVIEW ── */}
        {activeTab === "overview" && stats && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total Users", value: stats.totalUsers.toLocaleString(), icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
                { label: "Total Transactions", value: stats.totalTransactions.toLocaleString(), icon: TrendingUp, color: "text-green-600", bg: "bg-green-50" },
                { label: "Gold Sold (g)", value: Number(stats.totalGoldSoldGrams || 0).toFixed(4), icon: TrendingUp, color: "text-amber-600", bg: "bg-amber-50" },
                { label: "Revenue (₹)", value: `₹${Number(stats.totalRevenueInr || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`, icon: TrendingUp, color: "text-purple-600", bg: "bg-purple-50" },
              ].map((card) => (
                <div key={card.label} className="bg-white rounded-lg border shadow-sm p-5">
                  <div className={`w-9 h-9 rounded-full ${card.bg} flex items-center justify-center mb-3`}>
                    <card.icon className={`w-5 h-5 ${card.color}`} />
                  </div>
                  <p className="text-2xl font-bold text-gray-800">{card.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{card.label}</p>
                </div>
              ))}
            </div>
            {stats.activePrices && (
              <div className="bg-white rounded-lg border shadow-sm p-5">
                <h3 className="font-semibold text-gray-700 mb-3">Live Gold Prices</h3>
                <div className="flex gap-8">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Buy (incl. GST)</p>
                    <p className="text-xl font-bold text-primary">₹{Number(stats.activePrices.buyPriceWithGst).toFixed(2)}/g</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Sell Price</p>
                    <p className="text-xl font-bold text-green-700">₹{Number(stats.activePrices.sellPricePerGram).toFixed(2)}/g</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── USERS ── */}
        {activeTab === "users" && (
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b gap-4">
              <h2 className="text-lg font-semibold text-gray-800">User Management</h2>
              <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search name or email…"
                    className="pl-9 pr-4 py-2 border rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 w-60"
                  />
                </div>
                <button type="submit" className="bg-primary text-white px-3 py-2 rounded-sm text-sm hover:bg-primary/90">
                  Search
                </button>
                <button type="button" onClick={() => { setSearch(""); fetchUsers(0, ""); }} className="text-gray-500 hover:text-gray-700">
                  <RefreshCw className="w-4 h-4" />
                </button>
              </form>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">User</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Phone</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Role</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">KYC</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Joined</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium">{u.fullName}</p>
                        <p className="text-xs text-gray-400">{u.email}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{u.phone || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.role === "ADMIN" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-600"}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${kycBadge(u.kycStatus)}`}>
                          {u.kycStatus || "PENDING"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {/* KYC approve/reject — only if not already verified */}
                          {u.kycStatus !== "VERIFIED" && u.kycStatus !== "REJECTED" && (
                            <>
                              <button
                                onClick={() => handleKyc(u.id, "VERIFIED")}
                                disabled={kycActionLoading === u.id}
                                title="Approve KYC"
                                className="text-green-600 hover:text-green-700 disabled:opacity-40"
                              >
                                {kycActionLoading === u.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                              </button>
                              <button
                                onClick={() => handleKyc(u.id, "REJECTED")}
                                disabled={kycActionLoading === u.id}
                                title="Reject KYC"
                                className="text-red-500 hover:text-red-600 disabled:opacity-40"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          {u.kycStatus === "REJECTED" && (
                            <button
                              onClick={() => handleKyc(u.id, "VERIFIED")}
                              disabled={kycActionLoading === u.id}
                              title="Approve KYC"
                              className="text-green-600 hover:text-green-700 disabled:opacity-40"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center text-gray-400 py-10">No users found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {userTotalPages > 1 && (
              <div className="flex items-center justify-center gap-4 p-4 border-t">
                <button onClick={() => fetchUsers(userPage - 1, search)} disabled={userPage === 0}
                  className="flex items-center gap-1 text-sm text-gray-600 disabled:opacity-40 hover:text-primary">
                  <ChevronLeft className="w-4 h-4" /> Prev
                </button>
                <span className="text-sm text-gray-500">Page {userPage + 1} of {userTotalPages}</span>
                <button onClick={() => fetchUsers(userPage + 1, search)} disabled={userPage >= userTotalPages - 1}
                  className="flex items-center gap-1 text-sm text-gray-600 disabled:opacity-40 hover:text-primary">
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── TRANSACTIONS ── */}
        {activeTab === "transactions" && (
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-semibold text-gray-800">All Transactions</h2>
              <button onClick={() => fetchTransactions(txPage)} className="text-primary hover:text-amber-600">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Order Ref</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Gold (g)</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Amount</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-xs">{tx.orderReference}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tx.type === "BUY" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                          {tx.type}
                        </span>
                      </td>
                      <td className="px-4 py-3">{Number(tx.goldGrams).toFixed(4)}g</td>
                      <td className="px-4 py-3 font-medium">₹{Number(tx.totalAmount).toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          tx.status === "COMPLETED" ? "bg-green-100 text-green-700" :
                          tx.status === "PENDING" ? "bg-amber-100 text-amber-700" :
                          "bg-gray-100 text-gray-600"
                        }`}>
                          {tx.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {new Date(tx.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                      </td>
                    </tr>
                  ))}
                  {transactions.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center text-gray-400 py-10">No transactions found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {txTotalPages > 1 && (
              <div className="flex items-center justify-center gap-4 p-4 border-t">
                <button onClick={() => fetchTransactions(txPage - 1)} disabled={txPage === 0}
                  className="flex items-center gap-1 text-sm text-gray-600 disabled:opacity-40 hover:text-primary">
                  <ChevronLeft className="w-4 h-4" /> Prev
                </button>
                <span className="text-sm text-gray-500">Page {txPage + 1} of {txTotalPages}</span>
                <button onClick={() => fetchTransactions(txPage + 1)} disabled={txPage >= txTotalPages - 1}
                  className="flex items-center gap-1 text-sm text-gray-600 disabled:opacity-40 hover:text-primary">
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
