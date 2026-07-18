"use client";

type AdminLink = readonly [number: string, label: string, href: string];

export function AdminMobileNav({ links }: { links: readonly AdminLink[] }) {
  function closeMenu(event: React.MouseEvent<HTMLAnchorElement>) {
    event.currentTarget.closest("details")?.removeAttribute("open");
  }

  return (
    <details className="admin-mobile-nav">
      <summary>Menu <span>{links.length} bagian</span></summary>
      <nav aria-label="Navigasi admin mobile">
        {links.map(([number, label, href]) => <a key={href} href={href} onClick={closeMenu}><span>{number}</span>{label}</a>)}
      </nav>
    </details>
  );
}
