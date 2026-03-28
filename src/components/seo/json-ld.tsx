/**
 * JSON-LD structured data components for SEO.
 * Renders schema.org markup as <script type="application/ld+json"> tags.
 */

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://backerhub.com';

// ─── Organization ──────────────────────────────────────────────────────
export function OrganizationJsonLd() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'BackerHub',
    url: SITE_URL,
    logo: `${SITE_URL}/images/logo-512.png`,
    description:
      "Asia's premier poker tournament staking and backing platform. Connect backers with verified poker players.",
    foundingDate: '2025',
    sameAs: [],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      url: `${SITE_URL}/en/contact`,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

// ─── WebSite with SearchAction ─────────────────────────────────────────
export function WebSiteJsonLd() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'BackerHub',
    url: SITE_URL,
    description:
      "Asia's premier poker tournament staking platform. Back skilled players, share in their victories.",
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/en/marketplace?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

// ─── BreadcrumbList ────────────────────────────────────────────────────
interface BreadcrumbItem {
  name: string;
  href: string;
}

export function BreadcrumbJsonLd({
  items,
  locale,
}: {
  items: BreadcrumbItem[];
  locale: string;
}) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}/${locale}${item.href}`,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

// ─── FAQPage ───────────────────────────────────────────────────────────
interface FaqItem {
  question: string;
  answer: string;
}

export function FAQPageJsonLd({ items }: { items: FaqItem[] }) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

// ─── Product (for player staking listings) ─────────────────────────────
export function PlayerProductJsonLd({
  playerName,
  playerUrl,
  description,
  imageUrl,
  rating,
  reviewCount,
}: {
  playerName: string;
  playerUrl: string;
  description: string;
  imageUrl?: string;
  rating?: number;
  reviewCount?: number;
}) {
  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `${playerName} - Tournament Staking`,
    url: playerUrl,
    description,
    brand: {
      '@type': 'Organization',
      name: 'BackerHub',
    },
    category: 'Poker Tournament Staking',
    ...(imageUrl && { image: imageUrl }),
    ...(rating &&
      reviewCount &&
      reviewCount > 0 && {
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: rating.toFixed(1),
          bestRating: '5',
          worstRating: '1',
          reviewCount: String(reviewCount),
        },
      }),
    offers: {
      '@type': 'Offer',
      availability: 'https://schema.org/InStock',
      priceCurrency: 'USD',
      price: '0',
      priceValidUntil: '2027-12-31',
      url: playerUrl,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
