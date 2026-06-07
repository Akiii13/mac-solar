import Link from "next/link";
import { CheckCircle2, ArrowLeft, Sun, MailWarning } from "lucide-react";
import type { Metadata } from "next";
import ThankYouGuard from "./ThankYouGuard";

// Tell all search engines not to index or follow links on this page.
// /thank-you has no SEO value and should never appear in search results.
export const metadata: Metadata = {
  title: "Thank You | MAC Solar",
  robots: { index: false, follow: false },
};

export default function ThankYouPage() {
  return (
    <>
      {/*
        ThankYouGuard is a client component that runs in the browser.
        If the user didn't arrive here from the assessment (i.e. no
        "mac_submitted" flag in sessionStorage), it redirects them to
        the home page instead of showing a confusing confirmation message.
      */}
      <ThankYouGuard />

      <div className="min-h-screen bg-[#F5F8FF] flex flex-col">
        <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-16">
          <div className="max-w-lg w-full text-center">
            {/* Icon */}
            <div className="relative inline-flex mb-8">
              <div className="w-20 h-20 rounded-full bg-solar-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-solar-500" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-brand-blue flex items-center justify-center">
                <Sun className="w-3 h-3 text-solar-400" />
              </div>
            </div>

            <h1 className="font-display font-bold text-3xl sm:text-4xl text-navy-800 mb-4">
              Assessment Submitted!
            </h1>
            <p className="text-navy-800/55 text-base leading-relaxed mb-10">
              Thank you! Our team at MAC Solar will review your energy profile and
              get in touch with a customized solar proposal — usually within 1–2
              business days.
            </p>

            {/* What's next */}
            <div className="card p-6 text-left mb-5 space-y-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-solar-500">
                What Happens Next
              </p>
              {[
                {
                  step: "1",
                  title: "Review",
                  desc: "Our engineers analyze your appliance load and location.",
                },
                {
                  step: "2",
                  title: "Custom Proposal",
                  desc: "We design a solar system sized perfectly for your needs.",
                },
                {
                  step: "3",
                  title: "Installation",
                  desc: "Fast, clean installation by our certified technicians.",
                },
              ].map((item) => (
                <div key={item.step} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-brand-blue text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {item.step}
                  </span>
                  <div>
                    <p className="font-semibold text-navy-800 text-sm">{item.title}</p>
                    <p className="text-navy-800/50 text-sm">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Spam warning */}
            <div className="flex items-start gap-3 bg-solar-500/8 border border-solar-500/25 rounded-xl p-4 mb-8 text-left">
              <MailWarning className="w-5 h-5 text-solar-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-navy-800 mb-0.5">
                  Check your spam or junk folder
                </p>
                <p className="text-sm text-navy-800/60 leading-relaxed">
                  Our reply may be filtered by your email provider. If you don&apos;t
                  see it within 2 business days, please check spam and mark us as
                  safe.
                </p>
              </div>
            </div>

            <Link href="/" className="btn-secondary">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
          </div>
        </main>
      </div>
    </>
  );
}
