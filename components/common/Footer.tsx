import Link from "next/link";

const footerLinks = [
  { href: "/legal/terms", label: "Terms" },
  { href: "/legal/privacy", label: "Privacy" },
  { href: "/legal/refund", label: "Refund" },
  { href: "/legal/seller-policy", label: "Seller Policy" },
  { href: "/legal/affiliate-terms", label: "Affiliate" },
];

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-slate-950 px-4 py-6 text-sm text-slate-400 sm:px-6 lg:px-8">
      <nav
        aria-label="Legal links"
        className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-center gap-x-4 gap-y-2 text-center"
      >
        {footerLinks.map((link) => (
          <Link key={link.href} href={link.href} className="transition hover:text-cyan-300">
            {link.label}
          </Link>
        ))}
      </nav>
    </footer>
  );
}
