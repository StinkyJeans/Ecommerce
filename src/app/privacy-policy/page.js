"use client";

import { useEffect } from "react";

export default function PrivacyPolicyPage() {
  useEffect(() => {
    document.title = "Privacy Policy - TotallyNormalStore";
  }, []);

  const siteName = "TotallyNormalStore";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const contactEmail = "jome490@gmail.com"; // Update with your contact email
  const lastUpdated = "February 16, 2025"; // Update this date when you modify the policy

  return (
    <div className="min-h-screen bg-white dark:bg-[#1a1a1a]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        {/* Header */}
        <div className="mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#2C2C2C] dark:text-[#e5e5e5] mb-4">
            Privacy Policy
          </h1>
          <p className="text-sm sm:text-base text-[#666666] dark:text-[#a3a3a3]">
            Last updated: {lastUpdated}
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-lg dark:prose-invert max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-[#2C2C2C] dark:text-[#e5e5e5] mb-4">
              1. Introduction
            </h2>
            <p className="text-base text-[#666666] dark:text-[#a3a3a3] leading-relaxed mb-4">
              Welcome to Totally Normal Store. We are committed to protecting your privacy and ensuring you have a positive experience on our website and in using our products and services. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website totallynormalstore.vercel.app.
            </p>
            <p className="text-base text-[#666666] dark:text-[#a3a3a3] leading-relaxed">
              Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access the site.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-[#2C2C2C] dark:text-[#e5e5e5] mb-4">
              2. Information We Collect
            </h2>
            <h3 className="text-xl font-semibold text-[#2C2C2C] dark:text-[#e5e5e5] mb-3 mt-6">
              2.1 Information You Provide to Us
            </h3>
            <p className="text-base text-[#666666] dark:text-[#a3a3a3] leading-relaxed mb-4">
              We may collect information that you provide directly to us, including:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2 text-base text-[#666666] dark:text-[#a3a3a3]">
              <li>Name and contact information (email address, phone number, mailing address)</li>
              <li>Account credentials (username, password)</li>
              <li>Payment information (credit card details, billing address)</li>
              <li>Profile information and preferences</li>
              <li>Communications with us (customer service inquiries, feedback)</li>
              <li>Product reviews and ratings</li>
            </ul>

            <h3 className="text-xl font-semibold text-[#2C2C2C] dark:text-[#e5e5e5] mb-3 mt-6">
              2.2 Automatically Collected Information
            </h3>
            <p className="text-base text-[#666666] dark:text-[#a3a3a3] leading-relaxed mb-4">
              When you visit our website, we automatically collect certain information about your device and how you interact with our site, including:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2 text-base text-[#666666] dark:text-[#a3a3a3]">
              <li>IP address and location data</li>
              <li>Browser type and version</li>
              <li>Device information (type, operating system)</li>
              <li>Pages visited and time spent on pages</li>
              <li>Referring website addresses</li>
              <li>Cookies and similar tracking technologies</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-[#2C2C2C] dark:text-[#e5e5e5] mb-4">
              3. How We Use Your Information
            </h2>
            <p className="text-base text-[#666666] dark:text-[#a3a3a3] leading-relaxed mb-4">
              We use the information we collect for various purposes, including:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2 text-base text-[#666666] dark:text-[#a3a3a3]">
              <li>To process and fulfill your orders and transactions</li>
              <li>To create and manage your account</li>
              <li>To communicate with you about your orders, products, services, and promotional offers</li>
              <li>To improve our website, products, and services</li>
              <li>To personalize your shopping experience</li>
              <li>To detect, prevent, and address technical issues and security threats</li>
              <li>To comply with legal obligations and enforce our terms of service</li>
              <li>To send you marketing communications (with your consent)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-[#2C2C2C] dark:text-[#e5e5e5] mb-4">
              4. How We Share Your Information
            </h2>
            <p className="text-base text-[#666666] dark:text-[#a3a3a3] leading-relaxed mb-4">
              We may share your information in the following circumstances:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2 text-base text-[#666666] dark:text-[#a3a3a3]">
              <li><strong>Service Providers:</strong> We may share information with third-party service providers who perform services on our behalf (payment processing, shipping, data analytics)</li>
              <li><strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of assets, your information may be transferred</li>
              <li><strong>Legal Requirements:</strong> We may disclose information if required by law or to protect our rights and safety</li>
              <li><strong>With Your Consent:</strong> We may share information for any other purpose disclosed to you with your consent</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-[#2C2C2C] dark:text-[#e5e5e5] mb-4">
              5. Cookies and Tracking Technologies
            </h2>
            <p className="text-base text-[#666666] dark:text-[#a3a3a3] leading-relaxed mb-4">
              We use cookies and similar tracking technologies to track activity on our website and store certain information. Cookies are files with a small amount of data that may include an anonymous unique identifier. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our website.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-[#2C2C2C] dark:text-[#e5e5e5] mb-4">
              6. Data Security
            </h2>
            <p className="text-base text-[#666666] dark:text-[#a3a3a3] leading-relaxed mb-4">
              We implement appropriate technical and organizational security measures to protect your personal information. However, no method of transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-[#2C2C2C] dark:text-[#e5e5e5] mb-4">
              7. Your Rights and Choices
            </h2>
            <p className="text-base text-[#666666] dark:text-[#a3a3a3] leading-relaxed mb-4">
              Depending on your location, you may have certain rights regarding your personal information, including:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2 text-base text-[#666666] dark:text-[#a3a3a3]">
              <li>The right to access your personal information</li>
              <li>The right to correct inaccurate information</li>
              <li>The right to delete your personal information</li>
              <li>The right to restrict or object to processing</li>
              <li>The right to data portability</li>
              <li>The right to opt-out of marketing communications</li>
            </ul>
            <p className="text-base text-[#666666] dark:text-[#a3a3a3] leading-relaxed">
              To exercise these rights, please contact us using the information provided below.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-[#2C2C2C] dark:text-[#e5e5e5] mb-4">
              8. Children's Privacy
            </h2>
            <p className="text-base text-[#666666] dark:text-[#a3a3a3] leading-relaxed">
              Our website is not intended for children under the age of 13. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us immediately.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-[#2C2C2C] dark:text-[#e5e5e5] mb-4">
              9. Changes to This Privacy Policy
            </h2>
            <p className="text-base text-[#666666] dark:text-[#a3a3a3] leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. You are advised to review this Privacy Policy periodically for any changes.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-[#2C2C2C] dark:text-[#e5e5e5] mb-4">
              10. Contact Us
            </h2>
            <p className="text-base text-[#666666] dark:text-[#a3a3a3] leading-relaxed mb-4">
              If you have any questions about this Privacy Policy, please contact us:
            </p>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <p className="text-base text-[#666666] dark:text-[#a3a3a3]">
                <strong>Email:</strong> <a href={`mailto:${contactEmail}`} className="text-[#2F79F4] hover:underline">{contactEmail}</a>
              </p>
              <p className="text-base text-[#666666] dark:text-[#a3a3a3] mt-2">
                <strong>Website:</strong> <a href={siteUrl} className="text-[#2F79F4] hover:underline">{siteUrl}</a>
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
