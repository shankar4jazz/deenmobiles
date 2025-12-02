"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Ticket, Phone } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchFormProps {
  compact?: boolean;
  defaultTicket?: string;
  defaultPhone?: string;
}

export default function SearchForm({
  compact,
  defaultTicket,
  defaultPhone,
}: SearchFormProps) {
  const router = useRouter();
  const [searchType, setSearchType] = useState<"ticket" | "phone">(
    defaultPhone ? "phone" : "ticket"
  );
  const [value, setValue] = useState(defaultTicket || defaultPhone || "");
  const [isSearching, setIsSearching] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;

    setIsSearching(true);
    const param =
      searchType === "ticket"
        ? `ticket=${encodeURIComponent(value.trim().toUpperCase())}`
        : `phone=${encodeURIComponent(value.trim())}`;
    router.push(`/track?${param}`);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Toggle Buttons */}
      <div className="flex bg-gray-100 rounded-2xl p-1.5">
        <button
          type="button"
          onClick={() => {
            setSearchType("ticket");
            setValue("");
          }}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-medium transition-all",
            searchType === "ticket"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          )}
        >
          <Ticket className="w-4 h-4" />
          Ticket Number
        </button>
        <button
          type="button"
          onClick={() => {
            setSearchType("phone");
            setValue("");
          }}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-medium transition-all",
            searchType === "phone"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          )}
        >
          <Phone className="w-4 h-4" />
          Phone Number
        </button>
      </div>

      {/* Input Field */}
      <div className="relative">
        <input
          type={searchType === "phone" ? "tel" : "text"}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={
            searchType === "ticket"
              ? "e.g., SRV-BLR-20251202-001"
              : "Enter 10-digit phone number"
          }
          className={cn(
            "w-full px-5 py-4 pr-16 bg-white border-2 border-gray-200 rounded-2xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-100",
            compact ? "text-sm py-3.5" : "text-base"
          )}
          maxLength={searchType === "phone" ? 15 : 30}
        />
        <button
          type="submit"
          disabled={isSearching || !value.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 bg-purple-600 text-white rounded-xl flex items-center justify-center hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 shadow-lg shadow-purple-200"
        >
          {isSearching ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Search className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Helper Text */}
      {!compact && (
        <p className="text-center text-sm text-gray-500">
          {searchType === "ticket"
            ? "Find your ticket number on the job sheet receipt"
            : "Use the phone number registered during service"}
        </p>
      )}
    </form>
  );
}
