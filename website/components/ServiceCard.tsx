"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Phone, MapPin, Calendar } from "lucide-react";
import StatusBadge from "./StatusBadge";
import StatusTimeline from "./StatusTimeline";
import PricingSummary from "./PricingSummary";
import { PublicServiceResponse } from "@/lib/types";
import { formatDate, formatPhone, cn } from "@/lib/utils";

interface ServiceCardProps {
  service: PublicServiceResponse;
}

export default function ServiceCard({ service }: ServiceCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="bg-white rounded-3xl border border-gray-200 shadow-sm shadow-purple-100/50 overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
              Ticket Number
            </p>
            <h2 className="font-[family-name:var(--font-outfit)] font-bold text-xl text-gray-900">
              {service.ticketNumber}
            </h2>
          </div>
          <StatusBadge status={service.status} size="lg" />
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
          <span className="font-medium">{service.deviceModel}</span>
          <span className="text-gray-300">|</span>
          <div className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>{formatDate(service.createdAt)}</span>
          </div>
        </div>
      </div>

      {/* Status Message */}
      <div className="px-5 py-4 bg-gradient-to-r from-purple-50 to-blue-50 border-b border-gray-100">
        <p className="text-sm text-gray-700 leading-relaxed">
          {service.estimatedCompletionMessage}
        </p>
      </div>

      {/* Expandable Details */}
      <div className="p-5">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between text-sm font-medium text-gray-700 mb-4 hover:text-gray-900 active:scale-98"
        >
          <span>{isExpanded ? "Hide Details" : "View Details"}</span>
          <div
            className={cn(
              "w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center transition-transform",
              isExpanded && "rotate-180"
            )}
          >
            <ChevronDown className="w-4 h-4" />
          </div>
        </button>

        {isExpanded && (
          <div className="space-y-6 animate-in slide-in-from-top-2 duration-200">
            {/* Timeline */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 text-sm uppercase tracking-wider">
                Status Timeline
              </h3>
              <StatusTimeline history={service.statusHistory} />
            </div>

            {/* Pricing */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 text-sm uppercase tracking-wider">
                Pricing Summary
              </h3>
              <PricingSummary
                estimatedCost={service.estimatedCost}
                advancePayment={service.advancePayment}
                balanceAmount={service.balanceAmount}
              />
            </div>

            {/* Branch Info */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 text-sm uppercase tracking-wider">
                Service Center
              </h3>
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <p className="font-semibold text-gray-800">
                  {service.branch.name}
                </p>

                {service.branch.address && (
                  <div className="flex items-start gap-2.5 text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-400" />
                    <span>{service.branch.address}</span>
                  </div>
                )}

                {service.branch.phone && (
                  <a
                    href={`tel:${service.branch.phone}`}
                    className="flex items-center gap-2.5 text-purple-600 font-medium text-sm hover:text-purple-700 active:scale-98"
                  >
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Phone className="w-4 h-4" />
                    </div>
                    <span>{formatPhone(service.branch.phone)}</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
