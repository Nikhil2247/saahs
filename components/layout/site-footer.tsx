import Link from "next/link"
import { MapPin, Mail, Phone, AtSign, Link2, Globe, Send } from "lucide-react"
import { BrandMark } from "@/components/brand-mark"
import { navLinks } from "@/lib/data"

const resourceLinks = [
  { label: "E-Library", href: "/e-library" },
  { label: "Notices", href: "/notices" },
  { label: "Help Desk", href: "/help-desk" },
  { label: "Dashboard", href: "/dashboard" },
]

const socials = [
  { label: "Instagram", href: "#", icon: AtSign },
  { label: "LinkedIn", href: "#", icon: Link2 },
  { label: "Website", href: "#", icon: Globe },
  { label: "Newsletter", href: "#", icon: Send },
]

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-primary text-primary-foreground">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-4">
          <BrandMark invert />
          <p className="max-w-xs text-sm leading-relaxed text-primary-foreground/70">
            The Student Association of Allied Health Sciences unites, empowers and
            elevates allied health students across PGIMER Chandigarh.
          </p>
          <div className="flex items-center gap-2">
            {socials.map((s) => (
              <a
                key={s.label}
                href={s.href}
                aria-label={s.label}
                className="flex size-8 items-center justify-center rounded-md bg-primary-foreground/10 text-primary-foreground/80 transition-colors hover:bg-brand hover:text-brand-foreground"
              >
                <s.icon className="size-4" />
              </a>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-primary-foreground/60">
            Navigation
          </h3>
          <ul className="mt-4 space-y-2">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm text-primary-foreground/80 transition-colors hover:text-primary-foreground"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-primary-foreground/60">
            Resources
          </h3>
          <ul className="mt-4 space-y-2">
            {resourceLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm text-primary-foreground/80 transition-colors hover:text-primary-foreground"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-primary-foreground/60">
            Contact
          </h3>
          <ul className="mt-4 space-y-3 text-sm text-primary-foreground/80">
            <li className="flex gap-2.5">
              <MapPin className="mt-0.5 size-4 shrink-0 text-brand" />
              <span>
                Room No. 6013, Research Block B,
                <br />
                PGIMER, Chandigarh — 160012
              </span>
            </li>
            <li className="flex items-center gap-2.5">
              <Mail className="size-4 shrink-0 text-brand" />
              <a href="mailto:office@saahs.pgimer.edu.in" className="hover:text-primary-foreground">
                office@saahs.pgimer.edu.in
              </a>
            </li>
            <li className="flex items-center gap-2.5">
              <Phone className="size-4 shrink-0 text-brand" />
              <a href="tel:+911722755555" className="hover:text-primary-foreground">
                +91 172 275 5555
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-primary-foreground/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-primary-foreground/60 sm:flex-row">
          <p>© {new Date().getFullYear()} SAAHS, PGIMER Chandigarh. All rights reserved.</p>
          <p className="font-mono uppercase tracking-widest text-brand">
            Unite · Empower · Elevate
          </p>
        </div>
      </div>
    </footer>
  )
}
