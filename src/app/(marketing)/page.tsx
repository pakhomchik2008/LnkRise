import type { Metadata } from "next";
import { BlogPreview } from "@/components/landing/blog-preview";
import { Faq } from "@/components/landing/faq";
import { Features } from "@/components/landing/features";
import { FinalCta } from "@/components/landing/footer";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { PricingSection } from "@/components/landing/pricing-cards";
import { Testimonials } from "@/components/landing/testimonials";
import { APP_DESCRIPTION, APP_NAME, PLANS } from "@/lib/constants";
import { FAQ_ITEMS } from "@/lib/faq";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  description: APP_DESCRIPTION,
  alternates: { canonical: "/" },
};

// ISR rather than force-dynamic: this is the highest-traffic page, so it
// should stay cached/static, but a build-time DB failure (DATABASE_URL is a
// "Sensitive" env var on Vercel, only injected at request time, not during
// build) must not permanently freeze the blog-preview section empty. The
// catch below lets the initial build succeed with an empty preview; this
// revalidate window regenerates it against a working DB shortly after.
export const revalidate = 3600;

async function latestPosts() {
  try {
    return await prisma.blogPost.findMany({
      where: { published: true },
      orderBy: { publishedAt: "desc" },
      take: 3,
      select: { slug: true, title: true, excerpt: true, tags: true, publishedAt: true },
    });
  } catch {
    // The landing page must render before anyone has run a migration.
    return [];
  }
}

function StructuredData() {
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        name: APP_NAME,
        applicationCategory: "BusinessApplication",
        description: APP_DESCRIPTION,
        offers: PLANS.map((plan) => ({
          "@type": "Offer",
          name: plan.name,
          price: plan.price.replace("$", ""),
          priceCurrency: "USD",
        })),
      },
      {
        "@type": "FAQPage",
        mainEntity: FAQ_ITEMS.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: { "@type": "Answer", text: item.a },
        })),
      },
    ],
  };

  // Escape < / > / & so a rogue string in metadata (FAQ answer, plan name)
  // can never close the script tag with `</script>` and inject arbitrary HTML.
  // The escaped form is still valid JSON to a JSON-LD parser.
  const safe = JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safe }}
    />
  );
}

export default async function LandingPage() {
  const posts = await latestPosts();

  return (
    <>
      <StructuredData />
      <Hero />
      <HowItWorks />
      <Features />
      <PricingSection />
      <Testimonials />
      <BlogPreview posts={posts} />
      <Faq />
      <FinalCta />
    </>
  );
}
