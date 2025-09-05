import { NextRequest, NextResponse } from 'next/server';

import { webmentionService } from '../../../../modules/webmentions';

/**
 * Test endpoint for sending webmentions manually during development
 */
export async function POST(request: NextRequest) {
  try {
    const { targetUrl, testContent } = await request.json();

    if (!targetUrl) {
      return NextResponse.json(
        { error: 'Target URL is required' },
        { status: 400 }
      );
    }

    // Mock source page with test content
    const mockSourceUrl = 'http://localhost:3000/test-mention';
    const mockSourceHtml = `
      <!DOCTYPE html>
      <html>
      <head>
          <title>Test WebMention</title>
      </head>
      <body>
          <article class="h-entry">
              <h1 class="p-name">Test WebMention</h1>
              <div class="p-author h-card">
                  <img class="u-photo" src="https://via.placeholder.com/40" alt="">
                  <a class="p-name u-url" href="http://localhost:3000">Test Author</a>
              </div>
              <div class="e-content">
                  ${testContent || `This is a test webmention for <a href="${targetUrl}">this post</a>.`}
              </div>
              <time class="dt-published" datetime="${new Date().toISOString()}">
                  ${new Date().toLocaleDateString()}
              </time>
          </article>
      </body>
      </html>
    `;

    // Create a mock fetch that returns our test HTML
    const originalFetch = global.fetch;
    global.fetch = async (url: string | URL | Request, init?: RequestInit) => {
      if (url === mockSourceUrl) {
        return new Response(mockSourceHtml, {
          status: 200,
          headers: { 'Content-Type': 'text/html' },
        });
      }
      return originalFetch(url, init);
    };

    try {
      const result = await webmentionService.processWebMention(mockSourceUrl, targetUrl);

      // Restore original fetch
      global.fetch = originalFetch;

      return NextResponse.json({
        success: result.ok,
        message: result.ok ? 'Test webmention processed successfully' : result.reason,
        id: result.id,
        mockSourceUrl,
      });

    } catch (error) {
      // Restore original fetch in case of error
      global.fetch = originalFetch;
      throw error;
    }

  } catch (error) {
    console.error('[API] Error processing test webmention:', error);
    return NextResponse.json(
      { error: 'Failed to process test webmention' },
      { status: 500 }
    );
  }
}

/**
 * Get information about the test endpoint
 */
export async function GET() {
  return NextResponse.json({
    message: 'WebMention Test Endpoint',
    usage: {
      method: 'POST',
      body: {
        targetUrl: 'URL of the post to mention',
        testContent: 'Optional test content (will include link to target)',
      },
    },
    example: {
      targetUrl: 'http://localhost:3000/blog/my-post',
      testContent: 'Great post! I wrote a response here: http://localhost:3000/blog/my-post',
    },
  });
}
