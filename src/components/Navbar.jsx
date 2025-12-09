import React, { useContext } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const linkClass = ({ isActive }) =>
    `px-3 py-2 rounded-md text-sm font-medium ${
      isActive ? "text-white bg-blue-600" : "text-slate-200 hover:bg-slate-700"
    }`;

  return (
    <header className="bg-slate-900 border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-6">
            <NavLink to="/plans" className="text-xl font-bold text-white">
              Captcha Earning
            </NavLink>

            <nav className="hidden md:flex items-center gap-2">
              <NavLink to="/plans" className={linkClass}>
                Plans
              </NavLink>
              {user && (
                <>
                  <NavLink to="/dashboard" className={linkClass}>
                    Dashboard
                  </NavLink>
                  <NavLink to="/captcha" className={linkClass}>
                    Captcha
                  </NavLink>
                  <NavLink to="/wallet" className={linkClass}>
                    Wallet
                  </NavLink>
                  <NavLink to="/withdraw" className={linkClass}>
                    Withdraw
                  </NavLink>
                </>
              )}
              {user?.isAdmin && (
                <NavLink to="/admin" className={linkClass}>
                  Admin
                </NavLink>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {!user ? (
              <>
                <NavLink to="/login" className={linkClass}>
                  Login
                </NavLink>
                <NavLink to="/register" className={linkClass}>
                  Register
                </NavLink>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-slate-200 text-sm">{user.name || user.email}</span>
                <button
                  onClick={handleLogout}
                  className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
