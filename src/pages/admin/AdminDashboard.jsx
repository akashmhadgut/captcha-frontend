import React, { useEffect, useState, useContext, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import API from "../../api/axios";
import { AuthContext } from "../../context/AuthContext";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);

  // State for different tabs
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [captchas, setCaptchas] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [recentPurchases, setRecentPurchases] = useState([]);
  const [usersWithPlans, setUsersWithPlans] = useState([]);
  const [planStats, setPlanStats] = useState([]);
  const [captchaReloadTime, setCaptchaReloadTime] = useState(10);
  const [customReloadTime, setCustomReloadTime] = useState("");
  // manual refresh only; no auto polling
  const [lastRefresh, setLastRefresh] = useState(null);

  // UI state for creating plans
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [planToDelete, setPlanToDelete] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editPlan, setEditPlan] = useState(null);
  const [newPlan, setNewPlan] = useState({
    name: "",
    price: "",
    validityDays: "",
    captchaLimit: "",
    earningsPerCaptcha: "",
    description: "",
  });

  const fetchStats = async () => {
    try {
      const { data } = await API.get("/admin/stats");
      setStats(data.data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchRecentPurchases = async () => {
    try {
      const { data } = await API.get("/admin/recent-purchases?limit=10");
      setRecentPurchases(data.data || []);
    } catch (error) {
      console.error("Error fetching recent purchases:", error);
    }
  };

  const fetchUsersWithPlans = async () => {
    try {
      const { data } = await API.get("/admin/users-with-plans?limit=10&page=1");
      setUsersWithPlans(data.data || []);
    } catch (error) {
      console.error("Error fetching users with plans:", error);
    }
  };

  const fetchPlanStats = async () => {
    try {
      const { data } = await API.get("/admin/plan-stats");
      setPlanStats(data.data || []);
    } catch (error) {
      console.error("Error fetching plan stats:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data } = await API.get("/admin/users");
      setUsers(data.data);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const fetchPlans = async () => {
    try {
      const { data } = await API.get("/admin/plans");
      setPlans(data.data);
      // Also fetch plan stats for reactive data
      await fetchPlanStats();
    } catch (error) {
      console.error("Error fetching plans:", error);
    }
  };

  const fetchCaptchas = async () => {
    try {
      const { data } = await API.get("/admin/captchas");
      setCaptchas(data.data);
    } catch (error) {
      console.error("Error fetching captchas:", error);
    }
  };

  const fetchWithdrawals = async () => {
    try {
      const { data } = await API.get("/admin/withdrawals");
      setWithdrawals(data.data);
    } catch (error) {
      console.error("Error fetching withdrawals:", error);
    }
  };

  const fetchCaptchaSettings = async () => {
    try {
      const { data } = await API.get("/admin/captcha-settings");
      setCaptchaReloadTime(data.data?.reloadTime || 10);
    } catch (error) {
      console.error("Error fetching captcha settings:", error);
    }
  };

  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch all admin data in parallel
      const [statsRes, usersRes, plansRes, captchasRes, withdrawalsRes, settingsRes, recentPurchasesRes, usersWithPlansRes, planStatsRes] = await Promise.all([
        API.get("/admin/stats"),
        API.get("/admin/users"),
        API.get("/admin/plans"),
        API.get("/admin/captchas"),
        API.get("/admin/withdrawals"),
        API.get("/admin/captcha-settings"),
        API.get("/admin/recent-purchases?limit=10"),
        API.get("/admin/users-with-plans?limit=10&page=1"),
        API.get("/admin/plan-stats"),
      ]);
      
      setStats(statsRes.data?.data);
      setUsers(usersRes.data?.data);
      setPlans(plansRes.data?.data);
      setCaptchas(captchasRes.data?.data);
      setWithdrawals(withdrawalsRes.data?.data);
      setCaptchaReloadTime(settingsRes.data?.data?.reloadTime || 10);
      setRecentPurchases(recentPurchasesRes.data?.data || []);
      setUsersWithPlans(usersWithPlansRes.data?.data || []);
      setPlanStats(planStatsRes.data?.data || []);
      setLastRefresh(new Date());
    } catch (error) {
      console.error("Failed to fetch admin data:", error);
      toast.error("Failed to fetch admin data");
    } finally {
      setLoading(false);
    }
  }, []);

  // No automatic polling — admin can refresh manually using the Refresh button

  // Check if user is admin
  useEffect(() => {
    if (!user?.isAdmin) {
      toast.error("Access denied. Admin only.");
      navigate("/dashboard");
    } else {
      fetchAllData();
    }
  }, [user, navigate, fetchAllData]);

  // Fetch relevant data when switching tabs to ensure fresh values
  useEffect(() => {
    if (activeTab === "users") fetchUsers();
    if (activeTab === "plans") fetchPlans();
    if (activeTab === "purchases") fetchRecentPurchases();
    if (activeTab === "withdrawals") fetchWithdrawals();
    if (activeTab === "overview") fetchStats();
  }, [activeTab]);

  const updateCaptchaReloadTime = async (time) => {
    try {
      await API.put("/admin/captcha-settings", { reloadTime: time });
      setCaptchaReloadTime(time);
      toast.success(`Captcha reload time set to ${time}s`);
    } catch (error) {
      toast.error("Failed to update captcha settings");
    }
  };

  const approveWithdrawal = async (withdrawalId) => {
    try {
      await API.put(`/admin/withdrawals/${withdrawalId}/approve`);
      toast.success("Withdrawal approved!");
      fetchWithdrawals();
    } catch (error) {
      toast.error("Failed to approve withdrawal");
    }
  };

  const rejectWithdrawal = async (withdrawalId, reason) => {
    try {
      await API.put(`/admin/withdrawals/${withdrawalId}/reject`, { reason });
      toast.success("Withdrawal rejected!");
      fetchWithdrawals();
    } catch (error) {
      toast.error("Failed to reject withdrawal");
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="animate-spin">
          <div className="w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Admin Header */}
      <div className="bg-slate-800 border-b border-slate-700 p-6 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-slate-400 text-sm mt-1">Manage platform operations</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchAllData()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm"
            >
              ⟳ Refresh
            </button>
            <div className="text-sm text-slate-400">{lastRefresh ? `Last: ${new Date(lastRefresh).toLocaleTimeString()}` : ''}</div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-slate-800 border-b border-slate-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 flex overflow-x-auto justify-between items-center">
          <div className="flex">
            {[
              { id: "overview", label: "📊 Overview" },
              { id: "purchases", label: "🛒 Purchases" },
              { id: "users", label: "👥 Users" },
              { id: "plans", label: "📋 Plans" },
               { id: "withdrawals", label: "💸 Withdrawals" },
              { id: "settings", label: "⚙️ Settings" },
              { id: "reports", label: "📈 Reports" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-4 font-medium transition whitespace-nowrap ${
                  activeTab === tab.id
                    ? "text-blue-400 border-b-2 border-blue-400"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
           
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">Dashboard Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Total Users */}
              <div className="bg-slate-700 rounded-lg p-6 border border-slate-600">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm font-medium">Total Users</p>
                    <p className="text-3xl font-bold text-white mt-2">{stats?.totalUsers || 0}</p>
                  </div>
                  <span className="text-4xl">👥</span>
                </div>
              </div>

              {/* Active Plans */}
              <div className="bg-slate-700 rounded-lg p-6 border border-slate-600">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm font-medium">Active Plans</p>
                    <p className="text-3xl font-bold text-white mt-2">{stats?.activePlans || 0}</p>
                  </div>
                  <span className="text-4xl">📋</span>
                </div>
              </div>

              {/* Total Earnings */}
              <div className="bg-slate-700 rounded-lg p-6 border border-slate-600">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm font-medium">Platform Revenue</p>
                    <p className="text-3xl font-bold text-green-400 mt-2">
                      ₹{stats?.totalRevenue?.toFixed(2) || "0.00"}
                    </p>
                  </div>
                  <span className="text-4xl">💰</span>
                </div>
              </div>

              {/* Pending Withdrawals */}
              <div className="bg-slate-700 rounded-lg p-6 border border-slate-600">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm font-medium">Pending Withdrawals</p>
                    <p className="text-3xl font-bold text-yellow-400 mt-2">
                      {stats?.pendingWithdrawals || 0}
                    </p>
                  </div>
                  <span className="text-4xl">⏳</span>
                </div>
              </div>

              {/* Total Captchas */}
              {/* <div className="bg-slate-700 rounded-lg p-6 border border-slate-600">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm font-medium">Total Captchas</p>
                    <p className="text-3xl font-bold text-blue-400 mt-2">{stats?.totalCaptchas || 0}</p>
                  </div>
                  <span className="text-4xl">🔐</span>
                </div>
              </div> */}

              {/* Captchas Solved */}
              {/* <div className="bg-slate-700 rounded-lg p-6 border border-slate-600">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm font-medium">Captchas Solved</p>
                    <p className="text-3xl font-bold text-purple-400 mt-2">
                      {stats?.captchasSolved || 0}
                    </p>
                  </div>
                  <span className="text-4xl">✅</span>
                </div>
              </div> */}

              {/* Total Users with Plans */}
              <div className="bg-slate-700 rounded-lg p-6 border border-slate-600">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm font-medium">Users with Active Plans</p>
                    <p className="text-3xl font-bold text-indigo-400 mt-2">{stats?.usersWithPlans || 0}</p>
                  </div>
                  <span className="text-4xl">🎯</span>
                </div>
              </div>

              {/* Avg Earnings Per User */}
              <div className="bg-slate-700 rounded-lg p-6 border border-slate-600">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm font-medium">Avg Earnings/User</p>
                    <p className="text-3xl font-bold text-pink-400 mt-2">
                      ₹{stats?.avgEarningsPerUser?.toFixed(2) || "0.00"}
                    </p>
                  </div>
                  <span className="text-4xl">📊</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Purchases Tab */}
        {activeTab === "purchases" && (
          <div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              {/* Recent Purchases */}
              <div className="lg:col-span-2">
                <h2 className="text-2xl font-bold text-white mb-4">Recent Plan Purchases</h2>
                <div className="bg-slate-700 rounded-lg border border-slate-600 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-slate-600 border-b border-slate-500">
                          <th className="px-6 py-4 text-left text-slate-200 font-semibold">User</th>
                          <th className="px-6 py-4 text-left text-slate-200 font-semibold">Plan</th>
                          <th className="px-6 py-4 text-left text-slate-200 font-semibold">Amount</th>
                          <th className="px-6 py-4 text-left text-slate-200 font-semibold">Status</th>
                          <th className="px-6 py-4 text-left text-slate-200 font-semibold">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentPurchases.length > 0 ? (
                          recentPurchases.map((purchase) => (
                            <tr key={purchase._id} className="border-b border-slate-600 hover:bg-slate-600 transition">
                              <td className="px-6 py-4 text-slate-200">{purchase.user?.name}</td>
                              <td className="px-6 py-4 text-slate-200">{purchase.plan?.name}</td>
                              <td className="px-6 py-4 text-slate-200">₹{purchase.amount}</td>
                              <td className="px-6 py-4">
                                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-900 text-green-200">
                                  {purchase.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-slate-400 text-sm">
                                {new Date(purchase.createdAt).toLocaleDateString()}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="5" className="px-6 py-8 text-center text-slate-400">
                              No purchases found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Users with Active Plans */}
              <div>
                <h2 className="text-2xl font-bold text-white mb-4">Active Subscriptions</h2>
                <div className="bg-slate-700 rounded-lg border border-slate-600 p-4 max-h-96 overflow-y-auto">
                  {usersWithPlans.length > 0 ? (
                    <div className="space-y-3">
                      {usersWithPlans.map((user) => (
                        <div key={user._id} className="bg-slate-600 p-3 rounded-lg">
                          <p className="text-slate-200 font-semibold text-sm">{user.name}</p>
                          <p className="text-slate-400 text-xs">{user.email}</p>
                          <div className="mt-2 flex justify-between items-center">
                            <span className="text-blue-400 text-xs font-semibold">{user.plan?.name}</span>
                            <span className="text-yellow-400 text-xs">
                              {new Date(user.planExpiry).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-400 text-center text-sm">No active subscriptions</p>
                  )}
                </div>
              </div>
            </div>

            {/* Plan Statistics */}
            <h2 className="text-2xl font-bold text-white mb-4">Plan Performance</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {planStats.map((plan) => (
                <div key={plan._id} className="bg-slate-700 rounded-lg border border-slate-600 p-6">
                  <h3 className="text-xl font-bold text-white mb-3">{plan.name}</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-slate-300">Price:</span>
                      <span className="text-white font-bold">₹{plan.price}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-300">Active Users:</span>
                      <span className="text-green-400 font-bold">{plan.activeUsers}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-300">Total Sales:</span>
                      <span className="text-blue-400 font-bold">{plan.totalPurchases}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-300">Revenue:</span>
                      <span className="text-yellow-400 font-bold">₹{plan.totalRevenue}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">Manage Users</h2>
            <div className="bg-slate-700 rounded-lg border border-slate-600 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-600 border-b border-slate-500">
                      <th className="px-6 py-4 text-left text-slate-200 font-semibold">Name</th>
                      <th className="px-6 py-4 text-left text-slate-200 font-semibold">Email</th>
                      <th className="px-6 py-4 text-left text-slate-200 font-semibold">Status</th>
                      <th className="px-6 py-4 text-left text-slate-200 font-semibold">Plan</th>
                      <th className="px-6 py-4 text-left text-slate-200 font-semibold">Earnings</th>
                      <th className="px-6 py-4 text-left text-slate-200 font-semibold">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length > 0 ? (
                      users.map((user) => (
                        <tr key={user._id} className="border-b border-slate-600 hover:bg-slate-600 transition">
                          <td className="px-6 py-4 text-slate-200">{user.name}</td>
                          <td className="px-6 py-4 text-slate-300">{user.email}</td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                !user.isBlocked ? "bg-green-900 text-green-200" : "bg-red-900 text-red-200"
                              }`}
                            >
                              {!user.isBlocked ? "Active" : "Blocked"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-200">{user.plan?.name || "None"}</td>
                          <td className="px-6 py-4 text-slate-200">₹{user.totalEarnings?.toFixed(2) || "0.00"}</td>
                          <td className="px-6 py-4 text-slate-400 text-sm">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="px-6 py-8 text-center text-slate-400">
                          No users found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Plans Tab */}
        {activeTab === "plans" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Manage Plans</h2>
              <div className="flex items-center gap-3">
                {/* <button
                  onClick={() => setActiveTab("plans")}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold"
                >
                  Refresh
                </button> */}
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
                >
                  + Create Plan
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {plans.length > 0 ? (
                plans.map((plan) => (
                  <div key={plan._id} className="bg-slate-700 rounded-lg border border-slate-600 p-6">
                    <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                    <p className="text-slate-400 text-sm mb-4">{plan.description}</p>
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between">
                        <span className="text-slate-300">Price:</span>
                        <span className="text-white font-bold">₹{plan.price}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-300">Duration:</span>
                        <span className="text-white font-bold">{plan.durationDays || plan.validityDays} days</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-300">Daily Limit:</span>
                        <span className="text-white font-bold">{plan.dailyLimit || plan.captchaLimit} captchas</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-300">Rate:</span>
                        <span className="text-white font-bold">₹{plan.pricePerCaptcha || plan.earningsPerCaptcha}/captcha</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-300">Active Users:</span>
                        <span className="text-white font-bold">{plan.activeUsers || 0}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditPlan(plan);
                          setShowEditModal(true);
                        }}
                        className="flex-1 mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                      >
                        Edit Plan
                      </button>
                      <button
                        onClick={() => {
                          setPlanToDelete(plan._id);
                          setShowDeleteConfirm(true);
                        }}
                        className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-slate-400">No plans found</p>
              )}
            </div>

            {/* Create Plan Modal */}
            {showCreateModal && (
              <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                <div className="bg-white w-full max-w-2xl p-6 rounded-lg">
                  <h3 className="text-xl font-bold mb-4">Create New Plan</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      value={newPlan.name}
                      onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                      placeholder="Plan name"
                      className="px-4 py-2 border rounded"
                    />
                    <input
                      value={newPlan.price}
                      onChange={(e) => setNewPlan({ ...newPlan, price: e.target.value })}
                      placeholder="Price (number)"
                      type="number"
                      className="px-4 py-2 border rounded"
                    />
                    <input
                      value={newPlan.validityDays}
                      onChange={(e) => setNewPlan({ ...newPlan, validityDays: e.target.value })}
                      placeholder="Validity Days"
                      type="number"
                      className="px-4 py-2 border rounded"
                    />
                    <input
                      value={newPlan.captchaLimit}
                      onChange={(e) => setNewPlan({ ...newPlan, captchaLimit: e.target.value })}
                      placeholder="Daily Captcha Limit"
                      type="number"
                      className="px-4 py-2 border rounded"
                    />
                    <input
                      value={newPlan.earningsPerCaptcha}
                      onChange={(e) => setNewPlan({ ...newPlan, earningsPerCaptcha: e.target.value })}
                      placeholder="Earnings per Captcha"
                      type="number"
                      className="px-4 py-2 border rounded"
                    />
                    <input
                      value={newPlan.description}
                      onChange={(e) => setNewPlan({ ...newPlan, description: e.target.value })}
                      placeholder="Short description"
                      className="px-4 py-2 border rounded md:col-span-2"
                    />
                  </div>

                  <div className="flex justify-end gap-3 mt-4">
                    <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 rounded bg-gray-200">Cancel</button>
                    <button
                      onClick={async () => {
                        // Basic validation
                        if (!newPlan.name || !newPlan.price || !newPlan.captchaLimit || !newPlan.earningsPerCaptcha) {
                          toast.error('Please provide all required fields: name, price, captcha limit, and earnings per captcha');
                          return;
                        }

                        try {
                          const payload = {
                            name: newPlan.name,
                            description: newPlan.description,
                            price: Number(newPlan.price),
                            validityDays: Number(newPlan.validityDays) || 30,
                            captchaLimit: Number(newPlan.captchaLimit),
                            earningsPerCaptcha: Number(newPlan.earningsPerCaptcha),
                          };

                          await API.post('/admin/plans', payload);
                          toast.success('Plan created');
                          setShowCreateModal(false);
                          setNewPlan({ name: '', price: '', validityDays: '', captchaLimit: '', earningsPerCaptcha: '', description: '' });
                          fetchPlans();
                        } catch (err) {
                          console.error(err);
                          toast.error('Failed to create plan: ' + (err.response?.data?.message || err.message));
                        }
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded"
                    >
                      Create
                    </button>
                  </div>
                </div>
              </div>
            )}
            {/* Edit Plan Modal */}
            {showEditModal && editPlan && (
              <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                <div className="bg-white w-full max-w-2xl p-6 rounded-lg">
                  <h3 className="text-xl font-bold mb-4">Edit Plan</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      value={editPlan.name || ''}
                      onChange={(e) => setEditPlan({ ...editPlan, name: e.target.value })}
                      placeholder="Plan name"
                      className="px-4 py-2 border rounded"
                    />
                    <input
                      value={editPlan.price || ''}
                      onChange={(e) => setEditPlan({ ...editPlan, price: e.target.value })}
                      placeholder="Price (number)"
                      type="number"
                      className="px-4 py-2 border rounded"
                    />
                    <input
                      value={editPlan.validityDays || editPlan.durationDays || ''}
                      onChange={(e) => setEditPlan({ ...editPlan, validityDays: e.target.value })}
                      placeholder="Validity Days"
                      type="number"
                      className="px-4 py-2 border rounded"
                    />
                    <input
                      value={editPlan.captchaLimit || editPlan.dailyLimit || ''}
                      onChange={(e) => setEditPlan({ ...editPlan, captchaLimit: e.target.value })}
                      placeholder="Daily Captcha Limit"
                      type="number"
                      className="px-4 py-2 border rounded"
                    />
                    <input
                      value={editPlan.earningsPerCaptcha || editPlan.pricePerCaptcha || ''}
                      onChange={(e) => setEditPlan({ ...editPlan, earningsPerCaptcha: e.target.value })}
                      placeholder="Earnings per Captcha"
                      type="number"
                      className="px-4 py-2 border rounded"
                    />
                    <input
                      value={editPlan.description || ''}
                      onChange={(e) => setEditPlan({ ...editPlan, description: e.target.value })}
                      placeholder="Short description"
                      className="px-4 py-2 border rounded md:col-span-2"
                    />
                  </div>

                  <div className="flex justify-end gap-3 mt-4">
                    <button onClick={() => { setShowEditModal(false); setEditPlan(null); }} className="px-4 py-2 rounded bg-gray-200">Cancel</button>
                    <button
                      onClick={async () => {
                        try {
                          const payload = {
                            name: editPlan.name,
                            description: editPlan.description,
                            price: Number(editPlan.price),
                            validityDays: Number(editPlan.validityDays) || Number(editPlan.durationDays) || 30,
                            captchaLimit: Number(editPlan.captchaLimit) || Number(editPlan.dailyLimit) || 0,
                            earningsPerCaptcha: Number(editPlan.earningsPerCaptcha) || Number(editPlan.pricePerCaptcha) || 0,
                          };
                          await API.put(`/admin/plans/${editPlan._id}`, payload);
                          toast.success('Plan updated');
                          setShowEditModal(false);
                          setEditPlan(null);
                          fetchPlans();
                        } catch (err) {
                          console.error(err);
                          toast.error('Failed to update plan: ' + (err.response?.data?.message || err.message));
                        }
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded"
                    >
                      Save
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      

        {/* Withdrawals Tab */}
        {activeTab === "withdrawals" && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">Manage Withdrawal Requests</h2>
            <div className="bg-slate-700 rounded-lg border border-slate-600 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-600 border-b border-slate-500">
                      <th className="px-6 py-4 text-left text-slate-200 font-semibold">User</th>
                      <th className="px-6 py-4 text-left text-slate-200 font-semibold">Amount</th>
                      <th className="px-6 py-4 text-left text-slate-200 font-semibold">Bank</th>
                      <th className="px-6 py-4 text-left text-slate-200 font-semibold">Status</th>
                      <th className="px-6 py-4 text-left text-slate-200 font-semibold">Requested</th>
                      <th className="px-6 py-4 text-left text-slate-200 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {withdrawals.length > 0 ? (
                      withdrawals.map((withdrawal) => (
                        <tr key={withdrawal._id} className="border-b border-slate-600 hover:bg-slate-600 transition">
                          <td className="px-6 py-4 text-slate-200">{withdrawal.userName}</td>
                          <td className="px-6 py-4 text-white font-bold">₹{withdrawal.amount?.toFixed(2)}</td>
                          <td className="px-6 py-4 text-slate-300 text-sm">{withdrawal.bankName}</td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                withdrawal.status === "pending"
                                  ? "bg-yellow-900 text-yellow-200"
                                  : withdrawal.status === "approved"
                                  ? "bg-green-900 text-green-200"
                                  : "bg-red-900 text-red-200"
                              }`}
                            >
                              {withdrawal.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-400 text-sm">
                            {new Date(withdrawal.requestedAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4">
                            {withdrawal.status === "pending" && (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => approveWithdrawal(withdrawal._id)}
                                  className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition"
                                >
                                  ✓
                                </button>
                                <button
                                  onClick={() =>
                                    rejectWithdrawal(withdrawal._id, "Rejected by admin")
                                  }
                                  className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition"
                                >
                                  ✗
                                </button>
                              </div>
                            )}
                            {withdrawal.status !== "pending" && (
                              <span className="text-slate-400 text-sm">—</span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="px-6 py-8 text-center text-slate-400">
                          No withdrawal requests found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">Platform Settings</h2>

            {/* Captcha Reload Time Settings */}
            <div className="bg-slate-700 rounded-lg border border-slate-600 p-6 mb-6">
              <h3 className="text-xl font-bold text-white mb-4">⏱️ Captcha Reload Time</h3>
              <p className="text-slate-400 mb-4">Set the time interval for captcha reloads</p>

              <div className="flex flex-wrap gap-3 mb-6">
                {[10, 20, 30].map((time) => (
                  <button
                    key={time}
                    onClick={() => updateCaptchaReloadTime(time)}
                    className={`px-6 py-3 rounded-lg font-semibold transition ${
                      captchaReloadTime === time
                        ? "bg-blue-600 text-white"
                        : "bg-slate-600 text-slate-200 hover:bg-slate-500"
                    }`}
                  >
                    {time}s
                  </button>
                ))}
              </div>

              {/* Custom Reload Time */}
              <div className="flex gap-3">
                <input
                  type="number"
                  min="5"
                  max="300"
                  placeholder="Custom seconds (5-300)"
                  value={customReloadTime}
                  onChange={(e) => setCustomReloadTime(e.target.value)}
                  className="flex-1 px-4 py-2 bg-slate-600 border border-slate-500 text-white rounded-lg placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={() => {
                    if (customReloadTime >= 5 && customReloadTime <= 300) {
                      updateCaptchaReloadTime(parseInt(customReloadTime));
                      setCustomReloadTime("");
                    } else {
                      toast.error("Please enter a value between 5 and 300");
                    }
                  }}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-semibold"
                >
                  Set Custom
                </button>
              </div>

              <div className="mt-4 p-3 bg-slate-600 rounded text-slate-200 text-sm">
                <strong>Current Setting:</strong> Users must wait {captchaReloadTime} seconds between captchas
              </div>
            </div>

            {/* Other Settings */}
            <div className="bg-slate-700 rounded-lg border border-slate-600 p-6">
              <h3 className="text-xl font-bold text-white mb-4">⚙️ Other Settings</h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-600 rounded">
                  <div>
                    <p className="text-white font-semibold">Enable Referral Program</p>
                    <p className="text-slate-400 text-sm">Allow users to earn through referrals</p>
                  </div>
                  <input type="checkbox" className="w-5 h-5 cursor-pointer" defaultChecked />
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-600 rounded">
                  <div>
                    <p className="text-white font-semibold">Enable Leaderboard</p>
                    <p className="text-slate-400 text-sm">Show top earners publicly</p>
                  </div>
                  <input type="checkbox" className="w-5 h-5 cursor-pointer" defaultChecked />
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-600 rounded">
                  <div>
                    <p className="text-white font-semibold">Enable Speed Bonus</p>
                    <p className="text-slate-400 text-sm">Reward users who solve captchas quickly</p>
                  </div>
                  <input type="checkbox" className="w-5 h-5 cursor-pointer" defaultChecked />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === "reports" && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">Platform Reports & Analytics</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Revenue Report */}
              <div className="bg-slate-700 rounded-lg border border-slate-600 p-6">
                <h3 className="text-lg font-bold text-white mb-4">💰 Revenue Report</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-400">This Month:</span>
                    <span className="text-white font-bold">₹{stats?.monthlyRevenue?.toFixed(2) || "0.00"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">This Year:</span>
                    <span className="text-white font-bold">₹{stats?.yearlyRevenue?.toFixed(2) || "0.00"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">All Time:</span>
                    <span className="text-white font-bold">₹{stats?.totalRevenue?.toFixed(2) || "0.00"}</span>
                  </div>
                  <div className="h-px bg-slate-600 my-3"></div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Users' Total Earnings:</span>
                    <span className="text-green-400 font-bold">₹{stats?.totalUserEarnings?.toFixed(2) || "0.00"}</span>
                  </div>
                </div>
              </div>

              {/* Activity Report */}
              <div className="bg-slate-700 rounded-lg border border-slate-600 p-6">
                <h3 className="text-lg font-bold text-white mb-4">📊 Activity Report</h3>
                <div className="space-y-3">
                  {/* <div className="flex justify-between">
                    <span className="text-slate-400">Total Captchas Created:</span>
                    <span className="text-white font-bold">{stats?.totalCaptchas || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Captchas Solved:</span>
                    <span className="text-white font-bold">{stats?.captchasSolved || 0}</span>
                  </div> */}
                  <div className="flex justify-between">
                    <span className="text-slate-400">Accuracy Rate:</span>
                    <span className="text-white font-bold">
                      {stats?.totalCaptchas > 0
                        ? ((stats?.captchasSolved / stats?.totalCaptchas) * 100).toFixed(1)
                        : "0"}
                      %
                    </span>
                  </div>
                  <div className="h-px bg-slate-600 my-3"></div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Daily Active Users:</span>
                    <span className="text-white font-bold">{stats?.dailyActiveUsers || 0}</span>
                  </div>
                </div>
              </div>

              {/* User Growth */}
              <div className="bg-slate-700 rounded-lg border border-slate-600 p-6">
                <h3 className="text-lg font-bold text-white mb-4">📈 User Growth</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-400">New Users (Today):</span>
                    <span className="text-white font-bold">{stats?.newUsersToday || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">New Users (This Week):</span>
                    <span className="text-white font-bold">{stats?.newUsersWeek || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">New Users (This Month):</span>
                    <span className="text-white font-bold">{stats?.newUsersMonth || 0}</span>
                  </div>
                  <div className="h-px bg-slate-600 my-3"></div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Churn Rate:</span>
                    <span className="text-white font-bold">{stats?.churnRate?.toFixed(2) || "0"}%</span>
                  </div>
                </div>
              </div>

              {/* Earnings Distribution */}
              <div className="bg-slate-700 rounded-lg border border-slate-600 p-6">
                <h3 className="text-lg font-bold text-white mb-4">💸 Earnings Distribution</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Withdrawn:</span>
                    <span className="text-white font-bold">₹{stats?.totalWithdrawn?.toFixed(2) || "0.00"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Pending Withdrawals:</span>
                    <span className="text-yellow-400 font-bold">
                      ₹{stats?.pendingWithdrawalAmount?.toFixed(2) || "0.00"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">In Users' Wallets:</span>
                    <span className="text-blue-400 font-bold">₹{stats?.walletsTotal?.toFixed(2) || "0.00"}</span>
                  </div>
                  <div className="h-px bg-slate-600 my-3"></div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Avg Earnings/User:</span>
                    <span className="text-green-400 font-bold">
                      ₹{stats?.avgEarningsPerUser?.toFixed(2) || "0.00"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Earners */}
            <div className="bg-slate-700 rounded-lg border border-slate-600 p-6">
              <h3 className="text-lg font-bold text-white mb-4">🏆 Top Earners</h3>
              <div className="space-y-2">
                {stats?.topEarners?.length > 0 ? (
                  stats.topEarners.map((earner, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-slate-600 rounded">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-yellow-400">{index + 1}.</span>
                        <span className="text-white">{earner.name}</span>
                      </div>
                      <span className="text-white font-bold">₹{earner.earnings?.toFixed(2)}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400">No data available</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-sm">
              <h3 className="text-lg font-bold mb-4">Confirm Delete</h3>
              <p className="text-gray-600 mb-6">Are you sure you want to delete this plan? This action cannot be undone.</p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setPlanToDelete(null);
                  }}
                  className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    try {
                      await API.delete(`/admin/plans/${planToDelete}`);
                      toast.success('Plan deleted successfully');
                      setShowDeleteConfirm(false);
                      setPlanToDelete(null);
                      fetchPlans();
                    } catch (err) {
                      toast.error(err.response?.data?.message || 'Failed to delete plan');
                    }
                  }}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
