export default function PolicyPrintWrapper({
  children,
  watermarkLabel,
}) {
  return (
    <div className="policy-print-root relative">
      {watermarkLabel ? (
        <div className="policy-print-watermark policy-print-watermark-copy" aria-hidden>
          {watermarkLabel}
        </div>
      ) : null}
      {children}
    </div>
  )
}
