"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  At,
  Phone,
  LocationPin,
  ArrowRight,
  AnnotationQuestion,
} from "griddy-icons";

export default function ContactPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState(null); // "success" | "error" | null

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setStatus(null);

    try {
      // Placeholder behaviour for now – this can be wired to an API later.
      await new Promise((resolve) => setTimeout(resolve, 800));
      setStatus("success");
      setFullName("");
      setEmail("");
      setSubject("");
      setMessage("");
    } catch {
      setStatus("error");
    } finally {
      setSubmitting(false);
    }
  };

  const faqs = [
    {
      question: "How do I track my order?",
      answer:
        "Visit your orders page in the User Portal to see real-time tracking updates and delivery status.",
    },
    {
      question: "What is your return policy?",
      answer:
        "Items can usually be returned within 30 days of purchase in their original condition. Check your order details for specifics.",
    },
    {
      question: "Can I sell my products here?",
      answer:
        "Yes. You can apply to become a seller through our dedicated Seller Portal.",
      ctaLabel: "Apply as a seller",
      ctaHref: "/sellerRegister",
    },
  ];

  return (
    <div className="min-h-screen bg-[#FAF9F6] dark:bg-[#1a1a1a]">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-12 lg:py-16">
        {/* Header */}
        <header className="mb-8 sm:mb-10">
          <p className="text-xs sm:text-sm font-semibold text-[#2F79F4] uppercase tracking-wider mb-2">
            Support
          </p>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 sm:gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#2C2C2C] dark:text-[#e5e5e5] mb-2">
                Contact Support
              </h1>
              <p className="text-sm sm:text-base text-[#666666] dark:text-[#a3a3a3] max-w-2xl">
                Have a question or need assistance? We&apos;re here to help you
                navigate through your shopping experience.
              </p>
            </div>
            <div className="flex sm:items-center">
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="inline-flex items-center justify-center rounded-lg border border-[#E0E0E0] dark:border-[#404040] bg-white/80 dark:bg-[#2C2C2C] px-4 py-2 text-xs sm:text-sm font-medium text-[#2C2C2C] dark:text-[#e5e5e5] hover:bg-white dark:hover:bg-[#333333] shadow-sm"
              >
                Back to login
              </button>
            </div>
          </div>
        </header>

        {/* Two-column layout */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10 mb-10 sm:mb-12">
          {/* Left column – contact methods & map */}
          <div className="space-y-5 sm:space-y-6">
            <div className="bg-white dark:bg-[#2C2C2C] rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-[#E0E0E0] dark:border-[#404040] space-y-4">
              <div>
                <h2 className="text-sm font-semibold text-[#2F79F4] uppercase tracking-wide mb-2">
                  Email Us
                </h2>
                <p className="text-sm text-[#666666] dark:text-[#a3a3a3] mb-2">
                  Our support team usually responds within 24 hours.
                </p>
                <button
                  type="button"
                  onClick={() => router.push("mailto:support@totallynormalstore.com")}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[#2F79F4] hover:text-[#2563eb]"
                >
                  <At size={18} />
                  <span>support@totallynormalstore.com</span>
                </button>
              </div>

              <div>
                <h2 className="text-sm font-semibold text-[#2F79F4] uppercase tracking-wide mb-2">
                  Call Us
                </h2>
                <p className="text-sm text-[#666666] dark:text-[#a3a3a3] mb-1">
                  Mon–Fri from 8am to 5pm.
                </p>
                <p className="text-sm font-semibold text-[#2C2C2C] dark:text-[#e5e5e5]">
                  +1 (555) 000-NORMAL
                </p>
              </div>

              <div>
                <h2 className="text-sm font-semibold text-[#2F79F4] uppercase tracking-wide mb-2">
                  Office Headquarters
                </h2>
                <p className="text-sm text-[#666666] dark:text-[#a3a3a3]">
                  123 Standard St, Baseline City, ST 12345
                </p>
              </div>
            </div>

            {/* Map placeholder */}
            <div className="bg-white dark:bg-[#2C2C2C] rounded-xl sm:rounded-2xl overflow-hidden shadow-sm border border-[#E0E0E0] dark:border-[#404040]">
              <div className="aspect-video bg-[url('/images/contact-map-placeholder.png')] bg-cover bg-center relative">
                <div className="absolute inset-0 bg-black/10 dark:bg-black/30" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#2F79F4] shadow-lg flex items-center justify-center">
                    <LocationPin size={24} className="text-white text-lg sm:text-xl" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right column – contact form */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-[#2C2C2C] rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-7 shadow-sm border border-[#E0E0E0] dark:border-[#404040]">
              <h2 className="text-lg sm:text-xl font-bold text-[#2C2C2C] dark:text-[#e5e5e5] mb-4 sm:mb-5">
                Send us a Message
              </h2>

              {status === "success" && (
                <div className="mb-4 sm:mb-5 rounded-lg border border-green-200 bg-green-50 text-green-800 text-sm px-3 py-2.5">
                  Thanks for reaching out. We&apos;ll get back to you within 24 hours.
                </div>
              )}

              {status === "error" && (
                <div className="mb-4 sm:mb-5 rounded-lg border border-red-200 bg-red-50 text-red-800 text-sm px-3 py-2.5">
                  Something went wrong while sending your message. Please try again.
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-[#2C2C2C] dark:text-[#e5e5e5] mb-1.5">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      placeholder="John Doe"
                      className="w-full rounded-lg border border-[#E0E0E0] dark:border-[#404040] bg-white dark:bg-[#1f1f1f] px-3 py-2.5 text-sm text-[#2C2C2C] dark:text-[#e5e5e5] focus:outline-none focus:ring-2 focus:ring-[#2F79F4]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-[#2C2C2C] dark:text-[#e5e5e5] mb-1.5">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="john@example.com"
                      className="w-full rounded-lg border border-[#E0E0E0] dark:border-[#404040] bg-white dark:bg-[#1f1f1f] px-3 py-2.5 text-sm text-[#2C2C2C] dark:text-[#e5e5e5] focus:outline-none focus:ring-2 focus:ring-[#2F79F4]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-[#2C2C2C] dark:text-[#e5e5e5] mb-1.5">
                    Subject
                  </label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                    className="w-full rounded-lg border border-[#E0E0E0] dark:border-[#404040] bg-white dark:bg-[#1f1f1f] px-3 py-2.5 text-sm text-[#2C2C2C] dark:text-[#e5e5e5] focus:outline-none focus:ring-2 focus:ring-[#2F79F4]"
                  >
                    <option value="">Select a topic</option>
                    <option value="order">Order or delivery question</option>
                    <option value="returns">Returns & refunds</option>
                    <option value="seller">Seller & product issues</option>
                    <option value="account">Account or login help</option>
                    <option value="other">Something else</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-[#2C2C2C] dark:text-[#e5e5e5] mb-1.5">
                    Message
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    rows={5}
                    placeholder="How can we help you today?"
                    className="w-full rounded-lg border border-[#E0E0E0] dark:border-[#404040] bg-white dark:bg-[#1f1f1f] px-3 py-2.5 text-sm text-[#2C2C2C] dark:text-[#e5e5e5] resize-none focus:outline-none focus:ring-2 focus:ring-[#2F79F4]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-[#2F79F4] hover:bg-[#2563eb] text-white font-semibold text-sm sm:text-base px-6 sm:px-8 py-2.5 sm:py-3 shadow-md hover:shadow-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <span>Sending...</span>
                  ) : (
                    <>
                      <span>Send Message</span>
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>

                <p className="text-[11px] sm:text-xs text-[#777777] dark:text-[#a3a3a3] mt-1">
                  By submitting this form, you agree to our{" "}
                  <button
                    type="button"
                    onClick={() => router.push("/terms")}
                    className="text-[#2F79F4] hover:text-[#2563eb] font-medium"
                  >
                    Terms of Service
                  </button>{" "}
                  and{" "}
                  <button
                    type="button"
                    onClick={() => router.push("/privacy")}
                    className="text-[#2F79F4] hover:text-[#2563eb] font-medium"
                  >
                    Privacy Policy
                  </button>
                  .
                </p>
              </form>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section>
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-[#2C2C2C] dark:text-[#e5e5e5] mb-4 sm:mb-6">
            Frequently Asked Questions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-white dark:bg-[#2C2C2C] rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-sm border border-[#E0E0E0] dark:border-[#404040]"
              >
                <div className="flex items-start gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-[#2F79F4]/15 flex items-center justify-center">
                    <AnnotationQuestion size={16} className="text-[#2F79F4] text-sm" />
                  </div>
                  <h3 className="text-sm sm:text-base font-semibold text-[#2C2C2C] dark:text-[#e5e5e5]">
                    {faq.question}
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-[#666666] dark:text-[#a3a3a3] mb-3">
                  {faq.answer}
                </p>
                {faq.ctaHref && faq.ctaLabel && (
                  <button
                    type="button"
                    onClick={() => router.push(faq.ctaHref)}
                    className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#2F79F4] hover:text-[#2563eb]"
                  >
                    <span>{faq.ctaLabel}</span>
                    <ArrowRight size={12} className="text-[10px]" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

