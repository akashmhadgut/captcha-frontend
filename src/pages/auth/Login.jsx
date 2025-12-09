import React, { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../../api/axios";
import { AuthContext } from "../../context/AuthContext";
import { toast } from "react-toastify";

const Login = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!form.email || !form.password) {
      toast.error("Please fill all fields");
      setLoading(false);
      return;
    }

    try {
      const { data } = await API.post("/auth/login", form);

      // Normalize user object to include boolean `isAdmin`
      const userObj = {
        ...data.user,
        isAdmin: (data.user && (data.user.role === "admin" || data.user.isAdmin)) || false,
      };

      login(data.token, userObj);
      toast.success("✅ Login successful!");

      // Navigate based on role
      if (userObj.isAdmin) {
        navigate("/adminDashboard"); // Go to Admin Dashboard
      } else {
        navigate("/plan-selection"); // Go to Plan Selection for new/existing users
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-3xl font-bold text-center mb-2 text-blue-600">Welcome Back</h2>
        <p className="text-center text-gray-600 mb-6">Login to your account</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Demo Credentials Info */}
          <div className="bg-blue-50 border-l-4 border-blue-600 p-3 rounded mb-4">
            <p className="text-xs text-gray-600 font-semibold">Demo Credentials:</p>
            <p className="text-xs text-gray-600">Email: test@example.com</p>
            <p className="text-xs text-gray-600">Password: Test@123</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              value={form.email}
              onChange={handleChange}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              name="password"
              placeholder="Enter your password"
              value={form.password}
              onChange={handleChange}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {/* Register Link */}
        <div className="mt-6 text-center">
          <p className="text-gray-600">Don't have an account?</p>
          <Link
            to="/register"
            className="text-blue-600 font-semibold hover:underline"
          >
            Create one now
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
