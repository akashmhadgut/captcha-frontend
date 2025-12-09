import React, { useEffect, useState, useContext, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import API from "../../api/axios";
import { AuthContext } from "../../context/AuthContext";

const Wallet = () => {
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [withdrawalsLoading, setWithdrawalsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const refreshIntervalRef = React.useRef(null);

  useEffect(() => {
    if (user) {
      fetchAllData();
      // Auto-refresh every 10 seconds
      refreshIntervalRef.current = setInterval(() => {
        fetchWallet();
        fetchWithdrawals(true); // Show notifications on auto-refresh
        fetchTransactions(page);
      }, 10000);
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [user, page]);

  const fetchAllData = async () => {
    await Promise.all([fetchWallet(), fetchTransactions(1), fetchWithdrawals(false)]);
  };

  const fetchWallet = useCallback(async () => {
    try {
      const { data } = await API.get("/wallet");
      setWallet(data.data);
    } catch (error) {
      console.error("Failed to fetch wallet:", error);
    }
  }, []);

  const fetchTransactions = async (pageNum = 1) => {
    try {
      setLoading(true);
      const { data } = await API.get(`/wallet/transactions?page=${pageNum}&limit=15`);
      // Handle both response formats
      setTransactions(data.transactions || data.data || []);
      setPage(pageNum);
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWithdrawals = async (showNotifications = true) => {
    try {
      setWithdrawalsLoading(true);
      const { data } = await API.get("/withdrawal/my");
      const newWithdrawals = data.data || [];
      
      // Check for status changes and show notifications (only if not initial load)
      if (showNotifications && withdrawals.length > 0 && newWithdrawals.length > 0) {
        newWithdrawals.forEach((newWithdrawal) => {
          const oldWithdrawal = withdrawals.find((w) => w._id === newWithdrawal._id);
          if (oldWithdrawal && oldWithdrawal.status !== newWithdrawal.status) {
            if (newWithdrawal.status === "approved") {
              toast.success(`✅ Withdrawal of ₹${newWithdrawal.amount.toFixed(2)} has been approved! Balance updated.`);
            } else if (newWithdrawal.status === "rejected") {
              toast.error(`❌ Withdrawal of ₹${newWithdrawal.amount.toFixed(2)} has been rejected.`);
              if (newWithdrawal.remarks) {
                toast.info(`Reason: ${newWithdrawal.remarks}`);
              }
            } else if (newWithdrawal.status === "completed") {
              toast.success(`🎉 Withdrawal of ₹${newWithdrawal.amount.toFixed(2)} has been completed!`);
            }
          }
        });
      }
      
      setWithdrawals(newWithdrawals);
    } catch (error) {
      console.error("Failed to fetch withdrawals:", error);
    } finally {
      setWithdrawalsLoading(false);
    }
  };

  const handleWithdraw = () => {
    if (!wallet || wallet.balance < 200) {
      toast.error("Minimum withdrawal amount is ₹200");
      return;
    }
    navigate("/withdraw");
  };

  const getTxnIcon = (type) => {
    return type === "credit" ? "📥" : "📤";
  };

  const getWithdrawalStatusColor = (status) => {
    switch (status) {
      case "approved":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "rejected":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "completed":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "pending":
      default:
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    }
  };

  const getWithdrawalStatusIcon = (status) => {
    switch (status) {
      case "approved":
        return "✅";
      case "rejected":
        return "❌";
      case "completed":
        return "🎉";
      case "pending":
      default:
        return "⏳";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">
              💰 Your Wallet
            </h1>
            <p className="text-slate-400 mt-2">Track your earnings and manage withdrawals</p>
          </div>
          <button
            onClick={() => navigate("/dashboard")}
            className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
          >
            ← Dashboard
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Current Balance */}
          <div className="rounded-2xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 p-8 hover:border-green-500/50 transition">
            <p className="text-slate-400 text-sm font-semibold mb-3">Current Balance</p>
            <p className="text-5xl font-bold text-green-400">₹{wallet?.balance.toFixed(2) || "0.00"}</p>
            <p className="text-xs text-slate-500 mt-2">Available to withdraw</p>
          </div>

          {/* Total Earned */}
          <div className="rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 p-8 hover:border-blue-500/50 transition">
            <p className="text-slate-400 text-sm font-semibold mb-3">Total Earned</p>
            <p className="text-5xl font-bold text-blue-400">₹{wallet?.totalEarned.toFixed(2) || "0.00"}</p>
            <p className="text-xs text-slate-500 mt-2">Lifetime earnings</p>
          </div>

          {/* Total Withdrawn */}
          <div className="rounded-2xl bg-gradient-to-br from-purple-500/10 to-violet-500/10 border border-purple-500/20 p-8 hover:border-purple-500/50 transition">
            <p className="text-slate-400 text-sm font-semibold mb-3">Total Withdrawn</p>
            <p className="text-5xl font-bold text-purple-400">₹{wallet?.totalWithdrawn.toFixed(2) || "0.00"}</p>
            <p className="text-xs text-slate-500 mt-2">Successfully withdrawn</p>
          </div>
        </div>

        {/* Withdraw Button */}
        <div className="mb-8">
          <button
            onClick={handleWithdraw}
            disabled={!wallet || wallet.balance < 200}
            className={`w-full py-4 rounded-xl font-bold text-lg transition transform ${
              !wallet || wallet.balance < 200
                ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                : "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white hover:scale-105 active:scale-95"
            }`}
          >
            {!wallet || wallet.balance < 200
              ? `💳 Withdrawal Locked (Min ₹200, You have ₹${wallet?.balance.toFixed(2) || "0.00"})`
              : "✓ Request Withdrawal"}
          </button>
        </div>

        {/* Withdrawal History */}
        <div className="rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 overflow-hidden mb-8">
          <div className="p-6 border-b border-slate-700">
            <h2 className="text-2xl font-bold text-white">💸 Withdrawal History</h2>
            <p className="text-slate-400 text-sm mt-1">Track your withdrawal requests</p>
          </div>

          {withdrawalsLoading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin">
                <div className="w-12 h-12 border-4 border-purple-400 border-t-transparent rounded-full"></div>
              </div>
              <p className="text-slate-400 mt-4">Loading withdrawals...</p>
            </div>
          ) : withdrawals.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-3xl mb-2">💳</p>
              <p className="text-slate-300 text-lg">No withdrawal requests yet</p>
              <p className="text-slate-500 text-sm mt-2">Request a withdrawal to see your history here</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-700/50 border-b border-slate-600">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase">Date</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase">Amount</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase">Bank Details</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {withdrawals.map((withdrawal) => (
                    <tr key={withdrawal._id} className="hover:bg-slate-700/30 transition">
                      <td className="px-6 py-4 text-sm text-slate-300">
                        {new Date(withdrawal.createdAt).toLocaleDateString()}
                        <br />
                        <span className="text-xs text-slate-500">
                          {new Date(withdrawal.createdAt).toLocaleTimeString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-red-400">
                        -₹{withdrawal.amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1 border ${getWithdrawalStatusColor(
                            withdrawal.status
                          )}`}
                        >
                          <span>{getWithdrawalStatusIcon(withdrawal.status)}</span>
                          {withdrawal.status.toUpperCase()}
                        </span>
                        {withdrawal.approvalDate && (
                          <p className="text-xs text-slate-500 mt-1">
                            {withdrawal.status === "approved" ? "Approved" : "Processed"} on{" "}
                            {new Date(withdrawal.approvalDate).toLocaleDateString()}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-300">
                        <div className="space-y-1">
                          <p className="font-semibold">{withdrawal.bankDetails?.accountHolder}</p>
                          <p className="text-xs text-slate-400">
                            {withdrawal.bankDetails?.bankName}
                          </p>
                          <p className="text-xs text-slate-500">
                            ****{withdrawal.bankDetails?.accountNumber?.slice(-4)}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-300">
                        {withdrawal.remarks ? (
                          <p className="text-xs">{withdrawal.remarks}</p>
                        ) : (
                          <p className="text-xs text-slate-500">-</p>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Transactions Table */}
        <div className="rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 overflow-hidden">
          <div className="p-6 border-b border-slate-700">
            <h2 className="text-2xl font-bold text-white">📊 Transaction History</h2>
            <p className="text-slate-400 text-sm mt-1">All your earnings and withdrawals</p>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin">
                <div className="w-12 h-12 border-4 border-purple-400 border-t-transparent rounded-full"></div>
              </div>
              <p className="text-slate-400 mt-4">Loading transactions...</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-3xl mb-2">📭</p>
              <p className="text-slate-300 text-lg">No transactions yet</p>
              <p className="text-slate-500 text-sm mt-2">Start solving captchas to earn and build your history</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-700/50 border-b border-slate-600">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase">Date</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase">Type</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase">Amount</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase">Description</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {transactions.map((trans, idx) => (
                    <tr key={idx} className="hover:bg-slate-700/30 transition">
                      <td className="px-6 py-4 text-sm text-slate-300">
                        {new Date(trans.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">
                        <span className="text-lg">{getTxnIcon(trans.type)}</span>
                        <span className="ml-2 text-slate-400 text-xs uppercase">{trans.type}</span>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold">
                        <span className={trans.type === "credit" ? "text-green-400" : "text-red-400"}>
                          {trans.type === "credit" ? "+" : "-"}₹{trans.amount.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-300">
                        {trans.description || "Transaction"}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold inline-block ${
                            trans.status === "completed"
                              ? "bg-green-500/20 text-green-400 border border-green-500/30"
                              : trans.status === "pending"
                              ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                              : "bg-red-500/20 text-red-400 border border-red-500/30"
                          }`}
                        >
                          {trans.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {!loading && transactions.length > 0 && (
          <div className="mt-8 flex justify-center gap-4">
            <button
              onClick={() => fetchTransactions(page - 1)}
              disabled={page === 1}
              className="px-6 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white rounded-lg transition"
            >
              ← Previous
            </button>
            <span className="text-slate-400 px-4 py-2">Page {page}</span>
            <button
              onClick={() => fetchTransactions(page + 1)}
              className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
            >
              Next →
            </button>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => navigate("/captcha")}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-3 rounded-lg transition"
          >
            🧩 Solve More Captchas
          </button>
          <button
            onClick={() => navigate("/dashboard")}
            className="bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 text-white font-bold py-3 rounded-lg transition"
          >
            📊 Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default Wallet;
