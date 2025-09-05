import Head from 'next/head';

interface WebMentionHeadProps {
  /** The URL of the current page */
  pageUrl?: string;
}

/**
 * WebMentionHead component adds the necessary meta tags and links
 * for webmention discovery to the document head.
 */
export default function WebMentionHead({ pageUrl }: WebMentionHeadProps) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const webmentionEndpoint = `${siteUrl}/api/webmentions`;

  return (
    <Head>
      {/* Webmention endpoint discovery */}
      <link rel="webmention" href={webmentionEndpoint} />

      {/* Pingback endpoint (for backward compatibility) */}
      <link rel="pingback" href={`${siteUrl}/api/pingback`} />

      {/* Additional IndieWeb metadata */}
      <link rel="authorization_endpoint" href="https://indieauth.com/auth" />
      <link rel="token_endpoint" href="https://tokens.indieauth.com/token" />

      {/* Microsub endpoint (optional - for feed readers) */}
      <link rel="microsub" href={`${siteUrl}/api/microsub`} />

      {/* Self-referencing canonical link */}
      {pageUrl && <link rel="canonical" href={pageUrl} />}

      {/* JSON-LD structured data for better webmention parsing */}
      {pageUrl && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebPage',
              url: pageUrl,
              mainEntity: {
                '@type': 'BlogPosting',
                url: pageUrl,
              },
            }),
          }}
        />
      )}
    </Head>
  );
}
