"use client";

import { useEffect } from "react";

export default function TermsOfServicePage() {
  useEffect(() => {
    document.title = "Terms of Service - TotallyNormalStore";
  }, []);

  const siteName = "TotallyNormalStore";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const contactEmail = "jome490@gmail.com"; // Update with your contact email
  const lastUpdated = "February 16, 2025"; // Update this date when you modify the terms

  return (
    <div className="min-h-screen bg-white dark:bg-[#1a1a1a]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        {/* Header */}
        <div className="mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#2C2C2C] dark:text-[#e5e5e5] mb-4">
            Terms of Service
          </h1>
          <p className="text-sm sm:text-base text-[#666666] dark:text-[#a3a3a3]">
            Last updated: {lastUpdated}
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-lg dark:prose-invert max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-[#2C2C2C] dark:text-[#e5e5e5] mb-4">
              1. Agreement to Terms
            </h2>
            <p className="text-base text-[#666666] dark:text-[#a3a3a3] leading-relaxed mb-4">
              By accessing or using TotallyNormalStore ("the Service"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of these terms, then you may not access the Service.
            </p>
            <p className="text-base text-[#666666] dark:text-[#a3a3a3] leading-relaxed">
              These Terms apply to all visitors, users, and others who access or use the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-[#2C2C2C] dark:text-[#e5e5e5] mb-4">
              2. Use License
            </h2>
            <p className="text-base text-[#666666] dark:text-[#a3a3a3] leading-relaxed mb-4">
              Permission is granted to temporarily access the materials on {siteName}'s website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2 text-base text-[#666666] dark:text-[#a3a3a3]">
              <li>Modify or copy the materials</li>
              <li>Use the materials for any commercial purpose or for any public display</li>
              <li>Attempt to reverse engineer any software contained on the website</li>
              <li>Remove any copyright or other proprietary notations from the materials</li>
              <li>Transfer the materials to another person or "mirror" the materials on any other server</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-[#2C2C2C] dark:text-[#e5e5e5] mb-4">
              3. User Accounts
            </h2>
            <p className="text-base text-[#666666] dark:text-[#a3a3a3] leading-relaxed mb-4">
              When you create an account with us, you must provide information that is accurate, complete, and current at all times. You are responsible for:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2 text-base text-[#666666] dark:text-[#a3a3a3]">
              <li>Maintaining the security of your account and password</li>
              <li>All activities that occur under your account</li>
              <li>Notifying us immediately of any unauthorized use of your account</li>
              <li>Ensuring that your account information is kept up to date</li>
            </ul>
            <p className="text-base text-[#666666] dark:text-[#a3a3a3] leading-relaxed">
              We reserve the right to suspend or terminate accounts that violate these Terms or engage in fraudulent, illegal, or harmful activities.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-[#2C2C2C] dark:text-[#e5e5e5] mb-4">
              4. Products and Services
            </h2>
            <h3 className="text-xl font-semibold text-[#2C2C2C] dark:text-[#e5e5e5] mb-3 mt-6">
              4.1 Product Information
            </h3>
            <p className="text-base text-[#666666] dark:text-[#a3a3a3] leading-relaxed mb-4">
              We strive to provide accurate product descriptions, images, and pricing. However, we do not warrant that product descriptions or other content on the Service is accurate, complete, reliable, current, or error-free.
            </p>

            <h3 className="text-xl font-semibold text-[#2C2C2C] dark:text-[#e5e5e5] mb-3 mt-6">
              4.2 Pricing and Payment
            </h3>
            <p className="text-base text-[#666666] dark:text-[#a3a3a3] leading-relaxed mb-4">
              All prices are displayed in the currency indicated and are subject to change without notice. You agree to pay all charges incurred by your account, including applicable taxes. Payment must be made at the time of purchase.
            </p>

            <h3 className="text-xl font-semibold text-[#2C2C2C] dark:text-[#e5e5e5] mb-3 mt-6">
              4.3 Shipping and Delivery
            </h3>
            <p className="text-base text-[#666666] dark:text-[#a3a3a3] leading-relaxed mb-4">
              Shipping costs and delivery times are provided at checkout. We are not responsible for delays caused by shipping carriers or customs. Risk of loss and title for products pass to you upon delivery to the carrier.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-[#2C2C2C] dark:text-[#e5e5e5] mb-4">
              5. Returns and Refunds
            </h2>
            <p className="text-base text-[#666666] dark:text-[#a3a3a3] leading-relaxed mb-4">
              Our return and refund policy is as follows:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2 text-base text-[#666666] dark:text-[#a3a3a3]">
              <li>Returns must be requested within 30 days of delivery</li>
              <li>Items must be unused, in original packaging, and in the same condition as received</li>
              <li>Refunds will be processed to the original payment method within 5-10 business days</li>
              <li>Shipping costs for returns are the responsibility of the customer unless the item is defective or incorrect</li>
            </ul>
            <p className="text-base text-[#666666] dark:text-[#a3a3a3] leading-relaxed">
              Please contact us at {contactEmail} to initiate a return or refund request.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-[#2C2C2C] dark:text-[#e5e5e5] mb-4">
              6. Prohibited Uses
            </h2>
            <p className="text-base text-[#666666] dark:text-[#a3a3a3] leading-relaxed mb-4">
              You agree not to use the Service:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2 text-base text-[#666666] dark:text-[#a3a3a3]">
              <li>In any way that violates any applicable national or international law or regulation</li>
              <li>To transmit, or procure the sending of, any advertising or promotional material without our prior written consent</li>
              <li>To impersonate or attempt to impersonate the company, a company employee, another user, or any other person or entity</li>
              <li>In any way that infringes upon the rights of others, or in any way is illegal, threatening, fraudulent, or harmful</li>
              <li>To engage in any other conduct that restricts or inhibits anyone's use or enjoyment of the Service</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-[#2C2C2C] dark:text-[#e5e5e5] mb-4">
              7. Intellectual Property
            </h2>
            <p className="text-base text-[#666666] dark:text-[#a3a3a3] leading-relaxed mb-4">
              The Service and its original content, features, and functionality are and will remain the exclusive property of {siteName} and its licensors. The Service is protected by copyright, trademark, and other laws. Our trademarks may not be used in connection with any product or service without our prior written consent.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-[#2C2C2C] dark:text-[#e5e5e5] mb-4">
              8. User Content
            </h2>
            <p className="text-base text-[#666666] dark:text-[#a3a3a3] leading-relaxed mb-4">
              Our Service may allow you to post, link, store, share, and otherwise make available certain information, text, graphics, or other material ("Content"). You are responsible for the Content that you post on or through the Service, including its legality, reliability, and appropriateness.
            </p>
            <p className="text-base text-[#666666] dark:text-[#a3a3a3] leading-relaxed">
              By posting Content on or through the Service, you grant us the right and license to use, modify, publicly perform, publicly display, reproduce, and distribute such Content on and through the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-[#2C2C2C] dark:text-[#e5e5e5] mb-4">
              9. Disclaimer
            </h2>
            <p className="text-base text-[#666666] dark:text-[#a3a3a3] leading-relaxed mb-4">
              THE INFORMATION ON THIS WEBSITE IS PROVIDED ON AN "AS IS" BASIS. TO THE FULLEST EXTENT PERMITTED BY LAW, THIS COMPANY:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2 text-base text-[#666666] dark:text-[#a3a3a3]">
              <li>EXCLUDES ALL REPRESENTATIONS AND WARRANTIES RELATING TO THIS WEBSITE AND ITS CONTENTS</li>
              <li>EXCLUDES ALL LIABILITY FOR DAMAGES ARISING OUT OF OR IN CONNECTION WITH YOUR USE OF THIS WEBSITE</li>
            </ul>
            <p className="text-base text-[#666666] dark:text-[#a3a3a3] leading-relaxed">
              This includes, without limitation, direct loss, loss of business or profits, damage caused to your computer, computer software, systems and programs, and the data thereon.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-[#2C2C2C] dark:text-[#e5e5e5] mb-4">
              10. Limitation of Liability
            </h2>
            <p className="text-base text-[#666666] dark:text-[#a3a3a3] leading-relaxed mb-4">
              In no event shall {siteName}, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your use of the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-[#2C2C2C] dark:text-[#e5e5e5] mb-4">
              11. Indemnification
            </h2>
            <p className="text-base text-[#666666] dark:text-[#a3a3a3] leading-relaxed">
              You agree to defend, indemnify, and hold harmless {siteName} and its licensee and licensors, and their employees, contractors, agents, officers and directors, from and against any and all claims, damages, obligations, losses, liabilities, costs or debt, and expenses (including but not limited to attorney's fees).
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-[#2C2C2C] dark:text-[#e5e5e5] mb-4">
              12. Governing Law
            </h2>
            <p className="text-base text-[#666666] dark:text-[#a3a3a3] leading-relaxed">
              These Terms shall be interpreted and governed by the laws of [Your Country/State], without regard to its conflict of law provisions. Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-[#2C2C2C] dark:text-[#e5e5e5] mb-4">
              13. Changes to Terms
            </h2>
            <p className="text-base text-[#666666] dark:text-[#a3a3a3] leading-relaxed">
              We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-[#2C2C2C] dark:text-[#e5e5e5] mb-4">
              14. Contact Information
            </h2>
            <p className="text-base text-[#666666] dark:text-[#a3a3a3] leading-relaxed mb-4">
              If you have any questions about these Terms of Service, please contact us:
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
