import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/services/authApi';
import { Eye, EyeOff, User, Lock, Loader2 } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const setUser = useAuthStore((state) => state.setUser);

  const [formData, setFormData] = useState({
    identifier: '',
    password: '',
    rememberMe: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authApi.login(
        formData.identifier,
        formData.password,
        formData.rememberMe
      );

      // Store user data in auth store
      setUser({
        ...response.user,
        accessToken: response.accessToken,
      });

      // Navigate to appropriate dashboard based on role and branch assignment
      const hasBranch = response.user.managedBranchId || response.user.branchId;

      if (response.user.role === 'SUPER_ADMIN') {
        // SUPER_ADMIN always goes to admin dashboard
        navigate('/dashboard');
      } else if (response.user.role === 'ADMIN' && !hasBranch) {
        // ADMIN without branch goes to admin dashboard
        navigate('/dashboard');
      } else {
        // Branch users (ADMIN with branch, MANAGER, RECEPTIONIST, TECHNICIAN) go to branch dashboard
        navigate('/branch/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-purple-50 to-blue-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorative circles */}
      <div className="absolute top-0 left-0 w-48 h-48 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
      <div className="absolute top-0 right-0 w-48 h-48 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-48 h-48 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>

      {/* Main Card */}
      <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden max-w-4xl w-full grid md:grid-cols-2">
        {/* Left Side - Form */}
        <div className="p-6 md:p-8 flex flex-col justify-center">
          <div className="max-w-sm mx-auto w-full">
            <h1 className="text-3xl font-bold text-gray-800 mb-1">LOGIN</h1>
            <p className="text-gray-500 text-sm mb-6">Welcome back! Please login to continue</p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username or Email Input */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Username or Email"
                  value={formData.identifier}
                  onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
                  className="w-full pl-10 pr-3 py-2.5 bg-gray-50 border-0 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all"
                  required
                />
              </div>

              {/* Password Input */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border-0 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.rememberMe}
                    onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
                    className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 focus:ring-2"
                  />
                  <span className="ml-2 text-sm text-gray-600">Remember me</span>
                </label>
                <a href="#" className="text-sm text-purple-600 hover:text-purple-700 font-medium">
                  Forgot Password?
                </a>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-purple-500 text-white py-2.5 rounded-lg text-sm font-semibold hover:from-purple-700 hover:to-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                    Logging in...
                  </>
                ) : (
                  'Login Now'
                )}
              </button>
            </form>

            {/* Quick Login Buttons */}
            <div className="mt-6 border-t border-gray-200 pt-6">
              <p className="text-xs text-gray-500 mb-3 text-center">Quick Login (For Testing)</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setFormData({
                      identifier: 'superadmin',
                      password: 'Admin@123',
                      rememberMe: true,
                    });
                  }}
                  className="px-3 py-2 text-xs font-medium text-purple-700 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                >
                  Super Admin
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormData({
                      identifier: 'admin',
                      password: 'Admin@123',
                      rememberMe: true,
                    });
                  }}
                  className="px-3 py-2 text-xs font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  Admin
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormData({
                      identifier: 'manager',
                      password: 'Manager@123',
                      rememberMe: true,
                    });
                  }}
                  className="px-3 py-2 text-xs font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                >
                  Branch Manager
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormData({
                      identifier: 'receptionist',
                      password: 'Receptionist@123',
                      rememberMe: true,
                    });
                  }}
                  className="px-3 py-2 text-xs font-medium text-cyan-700 bg-cyan-50 rounded-lg hover:bg-cyan-100 transition-colors"
                >
                  Receptionist
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormData({
                      identifier: 'technician',
                      password: 'Technician@123',
                      rememberMe: true,
                    });
                  }}
                  className="px-3 py-2 text-xs font-medium text-orange-700 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
                >
                  Technician
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormData({
                      identifier: 'manager.villupuram@deenmobiles.com',
                      password: 'Manager@123',
                      rememberMe: true,
                    });
                  }}
                  className="px-3 py-2 text-xs font-medium text-pink-700 bg-pink-50 rounded-lg hover:bg-pink-100 transition-colors"
                >
                  Villupuram Branch
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Illustration */}
        <div className="hidden md:flex bg-gradient-to-br from-purple-600 via-purple-500 to-purple-400 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/50 to-transparent"></div>

          {/* Decorative Elements */}
          <div className="absolute top-8 right-8 w-20 h-20 bg-white/10 rounded-full backdrop-blur-sm"></div>
          <div className="absolute bottom-16 left-8 w-16 h-16 bg-white/10 rounded-full backdrop-blur-sm"></div>

          {/* Icon */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-white/20 rounded-full backdrop-blur-sm flex items-center justify-center">
            <svg className="w-8 h-8 text-yellow-300" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>

          {/* Text Content */}
          <div className="relative z-10 p-8 flex flex-col justify-center items-center text-center text-white">
            <h2 className="text-2xl font-bold mb-2">Welcome to DeenMobiles</h2>
            <p className="text-purple-100 text-sm">Manage your mobile service center with ease</p>
          </div>
        </div>
      </div>
    </div>
  );
}
