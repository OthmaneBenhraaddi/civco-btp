export default function PartnerLogoMarquee({ partners = [] }) {
  if (!partners.length) {
    return null
  }

  const padded = partners.length >= 6
    ? partners
    : Array.from({ length: Math.ceil(6 / partners.length) }, () => partners).flat()

  return (
    <section className="homepage-marquee border-y border-white/[0.04] bg-[#080c13] py-8">
      <p className="mb-5 text-center text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--pg-accent)]">
        Nos Partenaires
      </p>
      <div className="homepage-marquee__viewport overflow-hidden">
        <div className="animate-marquee homepage-marquee__track flex w-max items-center">
          {[0, 1].map((copy) => (
            <div key={copy} className="flex items-center gap-12 px-8" aria-hidden={copy === 1}>
              {padded.map((partner, index) => (
                <div
                  key={`${copy}-${partner.id}-${index}`}
                  className="flex h-12 w-36 shrink-0 items-center justify-center"
                  title={partner.name}
                >
                  {partner.logo_url ? (
                    <img
                      src={partner.logo_url}
                      alt={copy === 0 ? partner.name : ''}
                      className="max-h-10 max-w-[8.5rem] object-contain opacity-70 transition hover:opacity-100"
                    />
                  ) : (
                    <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400 opacity-70 transition hover:opacity-100">
                      {partner.name}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
