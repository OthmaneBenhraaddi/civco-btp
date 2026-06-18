import { appendAuditLog } from './auditLogStore'

export function resolveActorLabel(user, roles, fallback = 'Admin / Gérant BTP') {
  const roleName = roles?.[0]?.name ?? roles?.[0]?.label
  const userName = user?.full_name

  if (userName && roleName) return `${userName} / ${roleName}`
  if (userName) return userName
  if (roleName) return roleName
  return fallback
}

export function logProjectCreated({ actor, title, nature, clientName }) {
  const clientSuffix = clientName ? ` (${clientName})` : ''
  return appendAuditLog({
    action: 'creation',
    actor,
    message: `A créé un nouveau projet ${nature}: ${title}${clientSuffix}`,
  })
}

export function logProjectUpdated({ actor, title, detail }) {
  return appendAuditLog({
    action: 'modification',
    actor,
    message: detail ?? `A mis à jour le projet « ${title} »`,
  })
}

export function logProjectDeleted({ actor, title }) {
  return appendAuditLog({
    action: 'suppression',
    actor,
    message: `A supprimé le projet « ${title} »`,
  })
}

export function logClientCreated({ actor, name }) {
  return appendAuditLog({
    action: 'creation',
    actor,
    message: `A ajouté un nouveau client: ${name}`,
  })
}

export function logClientUpdated({ actor, name }) {
  return appendAuditLog({
    action: 'modification',
    actor,
    message: `A modifié la fiche client: ${name}`,
  })
}

export function logClientDeleted({ actor, name }) {
  return appendAuditLog({
    action: 'suppression',
    actor,
    message: `A supprimé le client: ${name}`,
  })
}

export function logInvoiceCreated({ actor, clientName, amountLabel }) {
  return appendAuditLog({
    action: 'creation',
    actor,
    message: `A généré une facture pour le client ${clientName} (Montant: ${amountLabel})`,
  })
}

export function logInvoiceUpdated({ actor, reference, detail }) {
  return appendAuditLog({
    action: 'modification',
    actor,
    message: detail ?? `A modifié la facture ${reference}`,
  })
}

export function logInvoiceDeleted({ actor, reference }) {
  return appendAuditLog({
    action: 'suppression',
    actor,
    message: `A supprimé la facture ${reference}`,
  })
}

export function logPaymentRecorded({ actor, reference, amountLabel }) {
  return appendAuditLog({
    action: 'creation',
    actor,
    message: `A enregistré un paiement de ${amountLabel} sur la facture ${reference}`,
  })
}

export function logPaymentDeleted({ actor, reference, amountLabel }) {
  return appendAuditLog({
    action: 'suppression',
    actor,
    message: `A supprimé un paiement de ${amountLabel} sur la facture ${reference}`,
  })
}

export function logQuoteCreated({ actor, clientName, reference }) {
  const refSuffix = reference ? ` (${reference})` : ''
  return appendAuditLog({
    action: 'creation',
    actor,
    message: `A créé un devis pour le client ${clientName}${refSuffix}`,
  })
}

export function logQuoteUpdated({ actor, reference, detail }) {
  return appendAuditLog({
    action: 'modification',
    actor,
    message: detail ?? `A modifié le devis ${reference}`,
  })
}

export function logQuoteDeleted({ actor, reference }) {
  return appendAuditLog({
    action: 'suppression',
    actor,
    message: `A supprimé le devis ${reference}`,
  })
}

export function logQuoteConverted({ actor, quoteReference, invoiceReference }) {
  return appendAuditLog({
    action: 'creation',
    actor,
    message: `A converti le devis ${quoteReference} en facture ${invoiceReference}`,
  })
}
