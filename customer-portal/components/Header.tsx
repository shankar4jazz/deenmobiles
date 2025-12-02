"use client";

import { Smartphone } from "lucide-react";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-purple-100">
      <div className="max-w-lg mx-auto px-4 py-3">
        <div className="flex items-center justify-center gap-2">
          <div className="w-9 h-9 bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl flex items-center justify-center shadow-lg shadow-purple-200">
            <Smartphone className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-[family-name:var(--font-outfit)] font-bold text-lg text-gray-900">
              Deen Mobiles
            </h1>
            <p className="text-xs text-gray-500 -mt-0.5">Service Tracker</p>
          </div>
        </div>
      </div>
    </header>
  );
}
