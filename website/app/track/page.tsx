import { Suspense } from "react";
import Header from "@/components/Header";
import ServiceCard from "@/components/ServiceCard";
import SearchForm from "@/components/SearchForm";
import { trackService } from "@/lib/api";
import { AlertCircle, ArrowLeft, Search } from "lucide-react";
import Link from "next/link";
import type { PublicServiceResponse } from "@/lib/types";
import type { Metadata } from "next";

interface TrackPageProps {
  searchParams: Promise<{ ticket?: string; phone?: string }>;
}

export async function generateMetadata({
  searchParams,
}: TrackPageProps): Promise<Metadata> {
  const params = await searchParams;
  const { ticket, phone } = params;

  if (ticket) {
    return {
      title: `Track ${ticket} - Deen Mobiles`,
      description: `Track service status for ticket ${ticket}`,
    };
  }

  return {
    title: "Track Your Service - Deen Mobiles",
    description: "Track your mobile phone repair status",
  };
}

async function TrackingResults({
  ticket,
  phone,
}: {
  ticket?: string;
  phone?: string;
}) {
  if (!ticket && !phone) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-2xl flex items-center justify-center">
          <Search className="w-8 h-8 text-gray-400" />
        </div>
        <p className="text-gray-500">
          Enter a ticket number or phone number to search
        </p>
      </div>
    );
  }

  try {
    const result = await trackService(ticket, phone);
    const services: PublicServiceResponse[] = Array.isArray(result)
      ? result
      : [result];

    return (
      <div className="space-y-4">
        {phone && services.length > 1 && (
          <p className="text-sm text-gray-600 mb-4 bg-purple-50 rounded-xl px-4 py-3">
            Found <strong>{services.length}</strong> service(s) for this phone
            number
          </p>
        )}

        {services.map((service) => (
          <ServiceCard key={service.ticketNumber} service={service} />
        ))}
      </div>
    );
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Service not found. Please check your ticket number or phone number.";

    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
        <div className="w-14 h-14 mx-auto mb-4 bg-red-100 rounded-2xl flex items-center justify-center">
          <AlertCircle className="w-7 h-7 text-red-500" />
        </div>
        <h3 className="font-semibold text-red-800 mb-2 text-lg">Not Found</h3>
        <p className="text-red-600 text-sm">{errorMessage}</p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 mt-4 text-sm text-red-700 hover:text-red-800 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Try a different search
        </Link>
      </div>
    );
  }
}

function ServiceCardSkeleton() {
  return (
    <div className="bg-white rounded-3xl border border-gray-200 p-6 animate-pulse">
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="h-3 bg-gray-200 rounded w-20 mb-2"></div>
          <div className="h-6 bg-gray-200 rounded w-40"></div>
        </div>
        <div className="h-8 bg-gray-200 rounded-full w-24"></div>
      </div>
      <div className="h-4 bg-gray-200 rounded w-32 mb-6"></div>
      <div className="h-12 bg-gray-100 rounded-xl mb-4"></div>
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      </div>
    </div>
  );
}

export default async function TrackPage({ searchParams }: TrackPageProps) {
  const params = await searchParams;
  const { ticket, phone } = params;

  return (
    <main className="min-h-screen">
      <Header />

      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Search</span>
        </Link>

        {/* Compact Search Form */}
        <div className="mb-6">
          <SearchForm compact defaultTicket={ticket} defaultPhone={phone} />
        </div>

        {/* Results */}
        <Suspense fallback={<ServiceCardSkeleton />}>
          <TrackingResults ticket={ticket} phone={phone} />
        </Suspense>
      </div>
    </main>
  );
}
