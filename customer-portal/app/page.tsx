import Header from "@/components/Header";
import SearchForm from "@/components/SearchForm";
import { Smartphone, Clock, Shield } from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <Header />

      <div className="max-w-lg mx-auto px-4 py-8 sm:py-12">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <h1 className="font-[family-name:var(--font-outfit)] text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            Track Your Repair
          </h1>
          <p className="text-gray-600 text-lg">
            Enter your ticket number or phone number to check status
          </p>
        </div>

        {/* Search Form */}
        <SearchForm />

        {/* Features */}
        <div className="mt-12 grid grid-cols-3 gap-4 text-center">
          <div className="p-4">
            <div className="w-12 h-12 mx-auto mb-3 bg-purple-100 rounded-2xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-sm text-gray-900">Real-time</h3>
            <p className="text-xs text-gray-500 mt-1">Live updates</p>
          </div>
          <div className="p-4">
            <div className="w-12 h-12 mx-auto mb-3 bg-blue-100 rounded-2xl flex items-center justify-center">
              <Smartphone className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-sm text-gray-900">All Devices</h3>
            <p className="text-xs text-gray-500 mt-1">Phone & tablet</p>
          </div>
          <div className="p-4">
            <div className="w-12 h-12 mx-auto mb-3 bg-green-100 rounded-2xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-sm text-gray-900">Secure</h3>
            <p className="text-xs text-gray-500 mt-1">Your data is safe</p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 text-center text-sm text-gray-400">
          <p>&copy; 2024 Deen Mobiles. All rights reserved.</p>
        </div>
      </div>
    </main>
  );
}
