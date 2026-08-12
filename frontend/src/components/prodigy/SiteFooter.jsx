import { Link } from 'react-router-dom'

const NAV_LINKS = ['Projects', 'Clients', 'Tasks', 'Tickets', 'Roles', 'FAQ']
const LEGAL_LINKS = ['Terms of Service', 'Privacy Policy', 'Security', 'Rules']
const SITE_STATUS = [
  { name: 'Médiouna VRD', count: '42 on site', tone: 'live' },
  { name: 'Atlas R+4', count: '18 crew', tone: 'live' },
  { name: 'Marina Lotissement', count: 'Restarting', tone: 'warn' },
]

export default function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-white/[0.05] bg-[#0a0e15]">
      <div className="mx-auto grid max-w-[1180px] gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.45fr_1fr_1fr_1.15fr]">
        <div>
          <p className="pg-brand text-sm">Civco Btp</p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-[var(--pg-text-muted)]">
            Dark command center for BTP crews — projects, devis, factures, and client conversations in
            one place.
          </p>
          <p className="mt-4 text-sm text-slate-300">hello@civco-btp.demo</p>
          <div className="mt-5 flex gap-3 text-[var(--pg-text-dim)]">
            <SocialDot label="D" />
            <SocialDot label="X" />
            <SocialDot label="Y" />
            <SocialDot label="T" />
          </div>
        </div>

        <FooterCol title="Navigate" links={NAV_LINKS} />
        <FooterCol title="Legal" links={LEGAL_LINKS} />

        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white">Site Status</p>
          <ul className="mt-4 space-y-2.5">
            {SITE_STATUS.map((site) => (
              <li key={site.name} className="flex items-center justify-between gap-3 text-sm">
                <span className="inline-flex items-center gap-2 text-slate-300">
                  <span
                    className={[
                      'h-2 w-2 rounded-[2px]',
                      site.tone === 'warn' ? 'bg-amber-400' : 'bg-[var(--pg-accent)]',
                    ].join(' ')}
                  />
                  {site.name}
                </span>
                <span className="text-xs text-[var(--pg-text-dim)]">{site.count}</span>
              </li>
            ))}
          </ul>
          <Link
            to="/projects"
            className="mt-4 inline-block text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--pg-accent)] hover:text-[var(--pg-accent-soft)]"
          >
            View projects →
          </Link>
        </div>
      </div>
    </footer>
  )
}

function FooterCol({ title, links }) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white">{title}</p>
      <ul className="mt-4 space-y-2">
        {links.map((link) => (
          <li key={link}>
            <span className="cursor-default text-sm text-[var(--pg-text-muted)] transition hover:text-white">
              {link}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function SocialDot({ label }) {
  return (
    <span className="flex h-8 w-8 items-center justify-center rounded-md border border-[var(--pg-border)] text-[11px] font-bold text-slate-400">
      {label}
    </span>
  )
}
