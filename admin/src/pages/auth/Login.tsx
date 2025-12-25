import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/services/authApi';
import { Eye, EyeOff, User, Lock, Loader2, Shield } from 'lucide-react';

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

      // Check if user has admin access
      if (!['SUPER_ADMIN', 'ADMIN'].includes(response.user.role)) {
        setError('Access denied. Admin credentials required.');
        setLoading(false);
        return;
      }

      // Store user data in auth store
      setUser({
        ...response.user,
        accessToken: response.accessToken,
      });

      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute top-0 right-0 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>

      {/* Main Card */}
      <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden max-w-4xl w-full grid md:grid-cols-2">
        {/* Left Side - Form */}
        <div className="p-8 md:p-10 flex flex-col justify-center">
          <div className="max-w-sm mx-auto w-full">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Shield className="w-6 h-6 text-purple-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-800">Admin Login</h1>
            </div>
            <p className="text-gray-500 text-sm mb-8">Sign in to access the admin panel</p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Username or Email Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Username or Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Enter your username or email"
                    value={formData.identifier}
                    onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent focus:bg-white transition-all"
                    required
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pl-10 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent focus:bg-white transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
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
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-lg text-sm font-semibold hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right Side - Branding */}
        <div className="hidden md:flex bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-indigo-600/10"></div>

          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
              backgroundSize: '20px 20px'
            }}></div>
          </div>

          {/* Decorative Elements */}
          <div className="absolute top-8 right-8 w-24 h-24 bg-purple-500/10 rounded-full backdrop-blur-sm"></div>
          <div className="absolute bottom-16 left-8 w-20 h-20 bg-indigo-500/10 rounded-full backdrop-blur-sm"></div>

          {/* Content */}
          <div className="relative z-10 p-10 flex flex-col justify-center items-center text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Admin Panel</h2>
            <p className="text-slate-400 text-sm max-w-xs">
              Manage branches, employees, inventory, and system settings from one central location.
            </p>
            <div className="mt-8 flex gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
              <div className="w-2 h-2 bg-slate-600 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
