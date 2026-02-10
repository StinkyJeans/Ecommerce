"use client";

import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSearch,
  faTruckFast,
  faRotateLeft,
  faCreditCard,
  faUserGear,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";

const categories = [
  {
    icon: faTruckFast,
    title: "Orders & Shipping",
    description:
      "Track your delivery status, shipping times, and international rates.",
    href: "/account", // placeholder route
  },
  {
    icon: faRotateLeft,
    title: "Returns & Refunds",
    description:
      "Start a return, print labels, or check your refund status.",
    href: "/contact?topic=returns",
  },
  {
    icon: faCreditCard,
    title: "Payments",
    description:
      "Manage billing issues, payment methods, and security settings.",
    href: "/contact?topic=payments",
  },
  {
    icon: faUserGear,
    title: "Account Settings",
    description:
      "Password resets, profile updates, and preferences.",
    href: "/account/settings",
  },
];

const faqs = [
  "How can I change my shipping address after an order is placed?",
  "What is the \"Totally Normal\" 30-day guarantee?",
  "Can I buy a gift card for a friend?",
];

export default function HelpPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#F5F7FB] dark:bg-[#0f172a]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 lg:py-16">
        {/* Header / Search */}
        <div className="text-center mb-10 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#0f172a] dark:text-white mb-4">
            How can we help you?
          </h1>
          <div className="mx-auto max-w-2xl">
            <div className="relative">
              <input
                type="text"
                placeholder="Search for articles, tracking info, or policies..."
                className="w-full rounded-full bg-white dark:bg-[#020617] border border-[#E2E8F0] dark:border-[#1e293b] px-4 sm:px-5 py-3 sm:py-3.5 pr-12 text-sm sm:text-base text-[#0f172a] dark:text-[#e5e7eb] placeholder:text-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
              />
              <button
                type="button"
                className="absolute inset-y-1 right-1 flex items-center justify-center rounded-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white px-4 sm:px-5 text-sm font-medium shadow-md"
              >
                <FontAwesomeIcon icon={faSearch} className="mr-1.5 hidden sm:inline" />
                Search
              </button>
            </div>
            <p className="mt-3 text-xs sm:text-sm text-[#6b7280] dark:text-[#9ca3af]">
              Popular:{" "}
              <button
                type="button"
                onClick={() => router.push("/account?tab=orders")}
                className="underline-offset-2 hover:underline"
              >
                Track order
              </button>
              {" · "}
              <button
                type="button"
                onClick={() => router.push("/contact?topic=returns")}
                className="underline-offset-2 hover:underline"
              >
                Return policy
              </button>
              {" · "}
              <button
                type="button"
                onClick={() => router.push("/contact?topic=payments")}
                className="underline-offset-2 hover:underline"
              >
                Payment methods
              </button>
            </p>
          </div>
        </div>

        {/* Category cards */}
        <section className="mb-10 sm:mb-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {categories.map((cat) => (
              <button
                key={cat.title}
                type="button"
                onClick={() => router.push(cat.href)}
                className="text-left bg-white dark:bg-[#020617] rounded-2xl border border-[#E2E8F0] dark:border-[#1e293b] px-4 sm:px-5 py-5 sm:py-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#eff6ff] dark:bg-[#1d4ed8]/20 flex items-center justify-center mb-4">
                  <FontAwesomeIcon
                    icon={cat.icon}
                    className="text-[#2563eb] text-base sm:text-lg"
                  />
                </div>
                <h2 className="text-sm sm:text-base font-semibold text-[#0f172a] dark:text-white mb-1.5">
                  {cat.title}
                </h2>
                <p className="text-xs sm:text-sm text-[#6b7280] dark:text-[#9ca3af] mb-3">
                  {cat.description}
                </p>
                <span className="inline-flex items-center text-xs sm:text-sm font-semibold text-[#2563eb]">
                  View articles
                  <FontAwesomeIcon icon={faChevronRight} className="ml-1.5 text-[10px]" />
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* FAQ list */}
        <section>
          <h2 className="text-xl sm:text-2xl font-bold text-[#0f172a] dark:text-white mb-4 sm:mb-6 text-center sm:text-left">
            Frequently Asked Questions
          </h2>
          <div className="bg-white dark:bg-[#020617] rounded-2xl border border-[#E2E8F0] dark:border-[#1e293b] divide-y divide-[#E5E7EB] dark:divide-[#111827] shadow-sm">
            {faqs.map((question) => (
              <button
                key={question}
                type="button"
                className="w-full text-left px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between gap-4 hover:bg-[#f9fafb] dark:hover:bg-[#020617]/70"
              >
                <span className="text-sm sm:text-base text-[#111827] dark:text-[#e5e7eb]">
                  {question}
                </span>
                <FontAwesomeIcon
                  icon={faChevronRight}
                  className="text-[#9ca3af] text-xs flex-shrink-0"
                />
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

