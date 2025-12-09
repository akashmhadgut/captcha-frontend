import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import API from "../../api/axios";
import { AuthContext } from "../../context/AuthContext";

const Withdraw = () => {
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: "",
    accountHolder: "",
    accountNumber: "",
    bankName: "",
    ifscCode: "",
    upiId: "",
  });
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  useEffect(() => {
    if (user) {
      fetchWallet();
    }
  }, [user]);

  const fetchWallet = async () => {
    try {
      const { data } = await API.get("/wallet/balance");
      setBalance(data.balance);
    } catch (error) {
      toast.error("Failed to fetch wallet");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.amount || parseFloat(formData.amount) < 200) {
      toast.error("Minimum withdrawal amount is ₹200");
      return;
    }

    if (parseFloat(formData.amount) > balance) {
      toast.error("Insufficient balance");
      return;
    }

    if (!formData.accountHolder.trim()) {
      toast.error("Account holder name is required");
      return;
    }

    if (!formData.accountNumber.trim()) {
      toast.error("Account number is required");
      return;
    }

    if (!formData.bankName.trim()) {
      toast.error("Bank name is required");
      return;
    }

    if (!formData.ifscCode.trim()) {
      toast.error("IFSC code is required");
      return;
    }

    try {
      setLoading(true);
      const { data } = await API.post("/withdrawal/request", {
        amount: parseFloat(formData.amount),
        bankDetails: {
          accountHolder: formData.accountHolder,
          accountNumber: formData.accountNumber,
          bankName: formData.bankName,
          ifscCode: formData.ifscCode,
          upiId: formData.upiId || null,
        },
      });

      toast.success("✅ Withdrawal request submitted successfully!");
      setFormData({
        amount: "",
        accountHolder: "",
        accountNumber: "",
        bankName: "",
        ifscCode: "",
        upiId: "",
      });
      // Refresh wallet balance
      await fetchWallet();
      setTimeout(() => navigate("/wallet"), 2000);
    } catch (error) {
      toast.error(error.response?.data?.message || "Withdrawal request failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-600 to-green-800 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Request Withdrawal</h1>
          <p className="text-green-100 text-sm mt-1">Withdraw your earnings to your bank account</p>
        </div>

        {/* Form Card */}
        <div className="bg-white p-8 rounded-lg shadow-lg">
          {/* Balance Info */}
          <div className="bg-green-50 border-2 border-green-200 p-4 rounded-lg mb-6">
            <p className="text-sm text-gray-600">Available Balance</p>
            <p className="text-3xl font-bold text-green-600">₹{balance.toFixed(2)}</p>
            <p className="text-xs text-gray-500 mt-1">Minimum withdrawal: ₹200</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Withdrawal Amount <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-500 font-semibold">₹</span>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  placeholder="Enter amount (min ₹200)"
                  min="200"
                  step="1"
                  className="w-full pl-8 pr-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Bank Details Section */}
            <div className="border-t pt-4 mt-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Bank Account Details</h3>

              {/* Account Holder */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Holder Name <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  name="accountHolder"
                  value={formData.accountHolder}
                  onChange={handleChange}
                  placeholder="Full name as per bank account"
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
                  disabled={loading}
                />
              </div>

              {/* Account Number */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Number <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  name="accountNumber"
                  value={formData.accountNumber}
                  onChange={handleChange}
                  placeholder="12-digit account number"
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
                  disabled={loading}
                />
              </div>

              {/* Bank Name */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bank Name <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  name="bankName"
                  value={formData.bankName}
                  onChange={handleChange}
                  placeholder="e.g., HDFC Bank, ICICI Bank"
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
                  disabled={loading}
                />
              </div>

              {/* IFSC Code */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  IFSC Code <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  name="ifscCode"
                  value={formData.ifscCode}
                  onChange={handleChange}
                  placeholder="e.g., HDFC0001234"
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-600 uppercase"
                  disabled={loading}
                />
              </div>

              {/* UPI ID (Optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  UPI ID <span className="text-gray-400">(Optional)</span>
                </label>
                <input
                  type="text"
                  name="upiId"
                  value={formData.upiId}
                  onChange={handleChange}
                  placeholder="e.g., username@bank"
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded">
              <p className="text-sm text-gray-700">
                ℹ️ <strong>Processing Time:</strong> Withdrawals are processed within 2-3 business days.
                You will receive an email confirmation.
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition disabled:opacity-50 font-semibold text-lg mt-6"
            >
              {loading ? "Processing..." : "Request Withdrawal"}
            </button>
          </form>

          {/* Back Link */}
          <div className="text-center mt-4">
            <button
              onClick={() => navigate("/wallet")}
              className="text-gray-600 hover:text-gray-800 text-sm underline"
            >
              Back to Wallet
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Withdraw;
