import React from 'react';

export interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
  canonical?: string;
}

export function SEO({
  title = "DOER | South Africa's On-Demand Services & Skills Marketplace",
  description = "DOER connects you with trusted local service providers and product sellers in South Africa. Helping people get things done while helping others earn a living. Combat high unemployment with a clean, fast, and modern skills marketplace.",
  keywords = "DOER, doer app, local services, South Africa skills marketplace, sell products, freelance jobs, handyman services, trusted customers, earn income, Johannesburg, Cape Town, Durban, Pretoria, work opportunity",
  image = "https://images.unsplash.com/photo-1521791136368-1a46827d0adb?w=1200&h=630&fit=crop&q=80",
  url = "https://doer.co.za",
  type = "website",
  canonical = "https://doer.co.za"
}: SEOProps) {
  // Ensure the brand name is always attached to the title nicely
  const fullTitle = title.includes("DOER") ? title : `${title} | DOER`;

  return (
    <>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <link rel="canonical" href={canonical} />

      {/* Open Graph / Facebook / WhatsApp */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content="DOER" />
      <meta property="og:locale" content="en_ZA" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </>
  );
}

export default SEO;
