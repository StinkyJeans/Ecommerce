"use client";

import { useRouter } from "next/navigation";
import { Shield, Users, Star, Leaf } from "griddy-icons";

export default function AboutPage() {
  const router = useRouter();

  const values = [
    {
      icon: Shield,
      title: "Integrity",
      description: "Transparent practices and honest communication in everything we do.",
    },
    {
      icon: Users,
      title: "Community",
      description: "Building connections between creators, sellers, and customers.",
    },
    {
      icon: Star,
      title: "Quality",
      description: "Curating products that meet our high standards for excellence.",
    },
    {
      icon: Leaf,
      title: "Sustainability",
      description: "Committed to responsible practices and environmental consciousness.",
    },
  ];

  const teamMembers = [
    {
      name: "Marcus Chen",
      role: "FOUNDER & CEO",
      description: "Visionary leader driving innovation and growth.",
      image: "/team/marcus.jpg",
    },
    {
      name: "Sarah Jenkins",
      role: "CREATIVE DIRECTOR",
      description: "Shaping our brand identity and user experience.",
      image: "/team/sarah.jpg",
    },
    {
      name: "David Ghero",
      role: "HEAD OF ENGINEERING",
      description: "Building robust platforms for seamless commerce.",
      image: "/team/david.jpg",
    },
    {
      name: "Elena Rosal",
      role: "OPERATIONS MANAGER",
      description: "Ensuring smooth operations and customer satisfaction.",
      image: "/team/elena.jpg",
    },
  ];

  return (
    <div className="min-h-screen bg-[#FAF9F6] dark:bg-[#1a1a1a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        {/* Our Story Section */}
        <section className="mb-12 sm:mb-16 lg:mb-20">
          <p className="text-xs sm:text-sm font-semibold text-[#FFBF00] uppercase tracking-wider mb-2">
            OUR JOURNEY
          </p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#2C2C2C] dark:text-[#e5e5e5] mb-4 sm:mb-6">
            Our Story
          </h1>
          <p className="text-base sm:text-lg text-[#666666] dark:text-[#a3a3a3] mb-6 sm:mb-8 max-w-3xl">
            Redefining the everyday with elegance and integrity. We started in a small workshop with one goal: to bridge the gap between artisanal quality and digital convenience.
          </p>
          <div className="rounded-xl sm:rounded-2xl overflow-hidden shadow-lg">
            <div className="aspect-video bg-gradient-to-br from-[#FFBF00] to-[#e6ac00] flex items-center justify-center">
              <div className="text-center p-8">
                <div className="w-24 h-24 bg-white/20 rounded-lg mx-auto mb-4 flex items-center justify-center">
                  <span className="text-4xl text-white">🏪</span>
                </div>
                <p className="text-white/90 text-sm">Store Image Placeholder</p>
              </div>
            </div>
          </div>
        </section>

        {/* Our Mission Section */}
        <section className="mb-12 sm:mb-16 lg:mb-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16">
            {/* Left Column - Mission */}
            <div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#2C2C2C] dark:text-[#e5e5e5] mb-4 sm:mb-6">
                Our Mission
              </h2>
              <p className="text-base sm:text-lg text-[#666666] dark:text-[#a3a3a3] mb-4">
                Totally Normal Store was founded on the principle that quality products should be accessible, transparent, and beautifully designed. We strive to create a seamless bridge between sellers and customers, fostering a community of trust.
              </p>
              <p className="text-base sm:text-lg text-[#666666] dark:text-[#a3a3a3]">
                We believe that commerce is more than just a transaction - it's an opportunity to support creators and provide value that lasts.
              </p>
            </div>

            {/* Right Column - Core Values */}
            <div>
              <div className="grid grid-cols-2 gap-4 sm:gap-6">
                {values.map((value, index) => {
                  const Icon = value.icon;
                  return (
                  <div
                    key={index}
                    className="bg-white dark:bg-[#2C2C2C] rounded-lg sm:rounded-xl p-4 sm:p-6 shadow-sm border border-[#E0E0E0] dark:border-[#404040]"
                  >
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#FFBF00]/10 dark:bg-[#FFBF00]/20 rounded-lg flex items-center justify-center mb-3 sm:mb-4">
                      {Icon ? <Icon size={24} className="text-[#FFBF00] text-lg sm:text-xl" /> : null}
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-[#2C2C2C] dark:text-[#e5e5e5] mb-2">
                      {value.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#666666] dark:text-[#a3a3a3]">
                      {value.description}
                    </p>
                  </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Meet the Team Section */}
        <section className="mb-12 sm:mb-16 lg:mb-20">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#2C2C2C] dark:text-[#e5e5e5] mb-2 sm:mb-3">
              Meet the Team
            </h2>
            <p className="text-base sm:text-lg text-[#666666] dark:text-[#a3a3a3]">
              The humans behind the platform.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {teamMembers.map((member, index) => (
              <div
                key={index}
                className="text-center"
              >
                <div className="w-32 h-32 sm:w-40 sm:h-40 mx-auto mb-4 sm:mb-6 bg-gray-200 dark:bg-[#404040] rounded-xl sm:rounded-2xl overflow-hidden flex items-center justify-center">
                  <div className="w-full h-full bg-gradient-to-br from-[#FFBF00] to-[#e6ac00] flex items-center justify-center">
                    <span className="text-4xl sm:text-5xl text-white">
                      {member.name.charAt(0)}
                    </span>
                  </div>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-[#2C2C2C] dark:text-[#e5e5e5] mb-1 sm:mb-2">
                  {member.name}
                </h3>
                <p className="text-xs sm:text-sm font-semibold text-[#FFBF00] mb-2 sm:mb-3 uppercase tracking-wide">
                  {member.role}
                </p>
                <p className="text-sm sm:text-base text-[#666666] dark:text-[#a3a3a3]">
                  {member.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Call to Action Section */}
        <section className="mb-12 sm:mb-16">
          <div className="bg-[#FFBF00] rounded-xl sm:rounded-2xl p-8 sm:p-12 lg:p-16 text-center">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4 sm:mb-6">
              Be Part of Our Journey
            </h2>
            <p className="text-base sm:text-lg text-white/90 mb-6 sm:mb-8 max-w-2xl mx-auto">
              Whether you're looking for unique goods or looking to scale your business, we're here to help you grow.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center">
              <button
                onClick={() => router.push("/dashboard")}
                className="px-6 sm:px-8 py-3 sm:py-4 bg-[#2C2C2C] hover:bg-[#1a1a1a] text-white font-semibold rounded-lg sm:rounded-xl transition-colors text-sm sm:text-base"
              >
                Shop Now
              </button>
              <button
                onClick={() => router.push("/seller/addProduct")}
                className="px-6 sm:px-8 py-3 sm:py-4 bg-white hover:bg-gray-50 text-[#FFBF00] border-2 border-[#FFBF00] font-semibold rounded-lg sm:rounded-xl transition-colors text-sm sm:text-base"
              >
                Sell with Us
              </button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-[#E0E0E0] dark:border-[#404040] pt-6 sm:pt-8">
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-6 mb-4 sm:mb-6">
            <button
              onClick={() => router.push("/privacy-policy")}
              className="text-sm sm:text-base text-[#666666] dark:text-[#a3a3a3] hover:text-[#FFBF00] transition-colors"
            >
              Privacy Policy
            </button>
            <span className="hidden sm:inline text-[#666666] dark:text-[#a3a3a3]">•</span>
            <button
              onClick={() => router.push("/terms-of-service")}
              className="text-sm sm:text-base text-[#666666] dark:text-[#a3a3a3] hover:text-[#FFBF00] transition-colors"
            >
              Terms of Service
            </button>
            <span className="hidden sm:inline text-[#666666] dark:text-[#a3a3a3]">•</span>
            <button
              onClick={() => router.push("/careers")}
              className="text-sm sm:text-base text-[#666666] dark:text-[#a3a3a3] hover:text-[#FFBF00] transition-colors"
            >
              Careers
            </button>
          </div>
          <p className="text-center text-xs sm:text-sm text-[#666666] dark:text-[#a3a3a3]">
            © 2024 Totally Normal Store. All rights reserved.
          </p>
        </footer>
      </div>
    </div>
  );
}
