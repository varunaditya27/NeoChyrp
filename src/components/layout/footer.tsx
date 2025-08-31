/**
 * Site Footer:
 * - Basic metadata + attribution; extend with sitemap links later.
 */
export function Footer() {
  return (
    <footer className="mt-12 border-t py-8 text-center text-xs text-neutral-500">
      <p>
        © {new Date().getFullYear()} NeoChyrp · Modern remake of the classic Chyrp engine.
      </p>
    </footer>
  );
}
