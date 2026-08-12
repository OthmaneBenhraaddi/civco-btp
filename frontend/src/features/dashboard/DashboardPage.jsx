import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import CutFrame from '../../components/prodigy/CutFrame'
import NeonButton from '../../components/prodigy/NeonButton'
import Reveal from '../../components/prodigy/Reveal'
import {
  FEATURE_CARDS,
  KEY_STATS,
  LIVE_SITES,
  QUICK_ACTIONS,
} from './sandboxData'

export default function DashboardPage() {
  return (
    <div className="pb-20">
      {/* HERO — one composition: brand signal, headline, CTA, full-bleed visual */}
      <section className="pg-hero-bg relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,197,94,0.12),transparent_45%)]" />
        <div className="relative mx-auto flex min-h-[78vh] max-w-7xl flex-col justify-center px-4 pb-10 pt-16 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto max-w-4xl text-center"
          >
            <h1 className="font-[family-name:var(--pg-font-display)] text-[clamp(2.1rem,5vw,3.6rem)] font-extrabold leading-[1.08] tracking-tight text-white">
              Join Into a World of{' '}
              <span className="text-[var(--pg-accent)]">Limitless Sites</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-[15px] leading-relaxed text-slate-300 sm:text-base">
              A city of chantiers where{' '}
              <span className="font-semibold text-[var(--pg-accent)]">relationships</span> drive
              contracts. Open a{' '}
              <span className="font-semibold text-[var(--pg-accent)]">project</span>, supply another,
              build an <span className="font-semibold text-[var(--pg-accent)]">empire</span> of lots —
              with real <span className="font-semibold text-[var(--pg-accent)]">tools</span> for every
              crew.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <NeonButton to="/projects">View Projects</NeonButton>
              <NeonButton to="/tickets" variant="ghost">
                Explore Map
              </NeonButton>
              <NeonButton to="/roles" variant="ghost">
                Check Roles
              </NeonButton>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.65 }}
            className="mt-14"
          >
            <p className="mb-3 text-center text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--pg-accent)]">
              Live Now
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              {LIVE_SITES.map((site) => (
                <CutFrame key={site.id} size="md" className="block group">
                  <Link to="/projects" className="relative block aspect-[16/10] overflow-hidden">
                    <img
                      src={site.image}
                      alt={site.name}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0b0f17] via-[#0b0f17]/40 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3.5">
                      <p className="text-sm font-semibold text-white">{site.name}</p>
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-300">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--pg-accent)]" />
                        {site.viewers}
                      </span>
                    </div>
                  </Link>
                </CutFrame>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* KEY STATS */}
      <section className="relative border-t border-[var(--pg-border)] bg-[var(--pg-bg-elevated)]">
        <div
          className="pointer-events-none absolute inset-x-0 -top-px h-8 bg-[var(--pg-bg)]"
          style={{
            clipPath: 'polygon(0 0, 100% 0, 100% 0, 96% 100%, 4% 100%, 0 0)',
          }}
        />
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <Reveal className="text-center">
            <h2 className="pg-section-title">
              What We Achieved{' '}
              <span className="text-[var(--pg-accent)]">This Season</span>
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-[var(--pg-text-muted)]">
              Live operational metrics across active chantiers.
            </p>
          </Reveal>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {KEY_STATS.map((stat, index) => (
              <Reveal key={stat.id} delay={index * 0.06}>
                <CutFrame as="article" size="md" innerClassName="relative overflow-hidden p-5">
                  <StatIcon type={stat.icon} />
                  <p className="mt-4 flex flex-wrap items-baseline gap-x-2">
                    <span className="font-[family-name:var(--pg-font-display)] text-3xl font-bold text-white sm:text-4xl">
                      {stat.value}
                    </span>
                    <span className="text-sm font-bold uppercase tracking-wide text-[var(--pg-accent)]">
                      {stat.unit}
                    </span>
                  </p>
                  <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--pg-text-dim)]">
                    {stat.label}
                  </p>
                </CutFrame>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURE GRID */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <Reveal className="text-center">
          <h2 className="pg-section-title">
            Every Detail. <span className="text-[var(--pg-accent)]">Rethought.</span>
          </h2>
        </Reveal>

        <div className="mt-10 grid gap-4 lg:grid-cols-3 lg:grid-rows-2">
          <FeatureCard card={FEATURE_CARDS[0]} className="lg:row-span-2 min-h-[22rem] lg:min-h-0" delay={0} />
          <FeatureCard card={FEATURE_CARDS[1]} className="min-h-[16rem]" delay={0.08} />
          <FeatureCard card={FEATURE_CARDS[3]} className="lg:row-span-2 min-h-[22rem] lg:min-h-0" delay={0.12} />
          <FeatureCard card={FEATURE_CARDS[2]} className="min-h-[16rem]" delay={0.16} />
        </div>
      </section>

      {/* QUICK ACTIONS */}
      <section className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
        <Reveal>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {QUICK_ACTIONS.map((action) => (
              <CutFrame key={action.id} size="sm" className="block group transition hover:brightness-110">
                <Link
                  to={action.to}
                  className="flex items-center gap-3 px-4 py-3.5 transition group-hover:bg-[var(--pg-accent-dim)]"
                >
                  <span className="pg-cut-sm flex h-9 w-9 items-center justify-center bg-[#0e121b] text-[var(--pg-accent)] ring-1 ring-[var(--pg-border)]">
                    <QuickIcon type={action.icon} />
                  </span>
                  <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-200">
                    {action.label}
                  </span>
                </Link>
              </CutFrame>
            ))}
          </div>
        </Reveal>
      </section>

      {/* FOOTER STRIP */}
      <footer className="mt-8 border-t border-[var(--pg-border)] bg-[#0a0e15]">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:px-8">
          <div>
            <p className="font-[family-name:var(--pg-font-display)] text-sm font-bold italic tracking-[0.08em] text-[var(--pg-accent)]">
              CIVCO BTP
            </p>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-[var(--pg-text-muted)]">
              Dark command center for Moroccan & French BTP crews — projects, devis, factures, and
              site amendments in one place.
            </p>
          </div>
          <FooterCol title="Navigate" links={['Projects', 'Clients', 'Tasks', 'Tickets']} />
          <FooterCol title="Legal" links={['Terms', 'Privacy', 'Security']} />
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white">Site Status</p>
            <ul className="mt-4 space-y-2.5">
              {LIVE_SITES.map((site) => (
                <li key={site.id} className="flex items-center justify-between text-sm">
                  <span className="inline-flex items-center gap-2 text-slate-300">
                    <span className="h-2 w-2 rounded-[2px] bg-[var(--pg-accent)] shadow-[0_0_8px_var(--pg-accent)]" />
                    {site.name}
                  </span>
                  <span className="text-xs text-[var(--pg-text-dim)]">{site.viewers}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ card, className = '', delay = 0 }) {
  return (
    <Reveal delay={delay} className={`group h-full ${className}`}>
      <CutFrame size="lg" className="relative h-full overflow-hidden" innerClassName="relative h-full min-h-[16rem] overflow-hidden lg:min-h-full">
        <img
          src={card.image}
          alt=""
          className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b0f17] via-[#0b0f17]/75 to-[#0b0f17]/25" />
        <div className="absolute inset-0 bg-[var(--pg-accent)]/0 transition duration-300 group-hover:bg-[var(--pg-accent)]/[0.07]" />
        <div className="relative flex h-full min-h-[16rem] flex-col justify-end p-5 lg:min-h-full lg:p-6">
          <h3 className="text-lg font-bold text-white sm:text-xl">{card.title}</h3>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-300/90">{card.description}</p>
        </div>
      </CutFrame>
    </Reveal>
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

function StatIcon({ type }) {
  const className = 'h-5 w-5 text-[var(--pg-accent)]'
  if (type === 'team') {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
        <circle cx="9" cy="8" r="3" />
        <path d="M3 19c0-2.5 2.5-4 6-4s6 1.5 6 4" />
        <path d="M17 11h4M19 9v4" strokeLinecap="round" />
      </svg>
    )
  }
  if (type === 'budget') {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
        <rect x="3" y="6" width="18" height="12" rx="2" />
        <circle cx="12" cy="12" r="2.5" />
      </svg>
    )
  }
  if (type === 'time') {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
        <circle cx="12" cy="12" r="8" />
        <path d="M12 8v4l2.5 2.5" strokeLinecap="round" />
      </svg>
    )
  }
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M4 20V9l8-5 8 5v11" />
      <path d="M9 20v-6h6v6" />
    </svg>
  )
}

function QuickIcon({ type }) {
  const className = 'h-4 w-4'
  if (type === 'tickets') {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
        <path d="M4 8a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 000 4v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2a2 2 0 000-4V8z" />
      </svg>
    )
  }
  if (type === 'clients') {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
        <circle cx="9" cy="8" r="3" />
        <path d="M3 19c0-2.5 2.5-4 6-4s6 1.5 6 4" />
      </svg>
    )
  }
  if (type === 'roles') {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
        <path d="M12 3l7 3v5c0 4.5-2.8 7.8-7 10-4.2-2.2-7-5.5-7-10V6l7-3z" />
      </svg>
    )
  }
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" />
    </svg>
  )
}
