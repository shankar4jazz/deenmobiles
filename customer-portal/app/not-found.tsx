import Link from "next/link";
import Header from "@/components/Header";
import { Home, Search } from "lucide-react";

export default function NotFound() {
  return (
    <main className="min-h-screen">
      <Header />

      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="w-20 h-20 mx-auto mb-6 bg-purple-100 rounded-3xl flex items-center justify-center">
          <Search className="w-10 h-10 text-purple-600" />
        </div>

        <h1 className="font-[family-name:var(--font-outfit)] text-2xl font-bold text-gray-900 mb-3">
          Page Not Found
        </h1>

        <p className="text-gray-600 mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-purple-700 transition-colors active:scale-98"
        >
          <Home className="w-4 h-4" />
          Go to Home
        </Link>
      </div>
    </main>
  );
}
