import { ShieldCheck } from 'lucide-react'
import { useTranslation } from '../../i18n/LanguageContext'

export default function DigitalSignatureBox({
  label,
  signed = false,
  signedAt,
  signedVia,
  signatureImage,
}) {
  const { t } = useTranslation()

  if (signed && (signedAt || signatureImage)) {
    return (
      <div className="digital-signature-box mt-10 flex justify-end print:mt-12">
        <div className="w-72 rounded-xl border-2 border-emerald-500 bg-emerald-50 p-4 text-center">
          <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-800">
            {label ?? t('print.digitalSignature')}
          </p>
          {signatureImage ? (
            <img
              src={signatureImage}
              alt=""
              className="mx-auto mt-3 max-h-24 max-w-full object-contain"
            />
          ) : (
            <div className="mx-auto mt-3 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <ShieldCheck size={18} aria-hidden />
            </div>
          )}
          {signedAt ? (
            <p className="mt-2 text-xs leading-relaxed text-emerald-700">
              {t('print.signedElectronically', {
                date: signedAt,
                brand: signedVia ?? t('print.brandName'),
              })}
            </p>
          ) : null}
        </div>
      </div>
    )
  }

  return (
    <div className="digital-signature-box mt-10 flex justify-end print:mt-12">
      <div className="w-64 rounded-xl border-2 border-dashed border-slate-400 bg-slate-50 p-4 text-center">
        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
          {label ?? t('print.digitalSignature')}
        </p>
        <div className="mt-7 h-16 border-b border-slate-300" />
        <p className="mt-2 text-[11px] text-slate-400">{t('print.signatureDate')}</p>
        <p className="mt-1 text-[10px] text-slate-300">
          {t('print.signatureVia', { brand: signedVia ?? t('print.brandName') })}
        </p>
      </div>
    </div>
  )
}
