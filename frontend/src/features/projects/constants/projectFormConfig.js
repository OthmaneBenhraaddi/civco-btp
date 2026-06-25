export const PROJECT_SECTORS = ['PRIVÉ', 'PUBLIC']

export const PAYMENT_STATES = ['PAYÉ', 'NON PAYÉ']

export const DEFAULT_PROJECT_FORM = {
  client_id: '',
  selectedSectorId: '',
  sector: 'PRIVÉ',
  objet: '',
  montant: '',
  etatPaiement: 'NON PAYÉ',
  ordreServiceDate: '',
  dateFinTravaux: '',
  delais: '',
  avancement: 'ÉTUDE 4 MOIS + 8 MOIS DE SUIVI',
  selectedLotIds: [],
  site_address_line1: '',
  site_city: '',
  site_postal_code: '',
}

export function buildProjectApiPayload(form, sectors = []) {
  const documentMeta = form.documentMeta ?? []
  const selectedLotNames = form.selectedLotNames ?? []
  const workSector = sectors.find(
    (item) => String(item.id) === String(form.selectedSectorId),
  )

  return {
    client_id: Number(form.client_id),
    title: form.objet.trim(),
    budget: form.montant === '' ? null : Number(form.montant),
    start_date: form.ordreServiceDate || null,
    end_date: form.dateFinTravaux || null,
    status: 'planned',
    nature: workSector?.name ?? form.sectorName ?? null,
    sector: form.sector,
    etat_paiement: form.etatPaiement,
    delais: form.delais || null,
    avancement: form.avancement || null,
    site_address_line1: form.site_address_line1?.trim() || null,
    site_city: form.site_city?.trim() || null,
    site_postal_code: form.site_postal_code?.trim() || null,
    lot_ids: form.selectedLotIds ?? [],
    description_meta: documentMeta.length > 0 ? { documents: documentMeta } : null,
    description: JSON.stringify(
      {
        nature: workSector?.name ?? form.sectorName ?? null,
        sector: form.sector,
        etat_paiement: form.etatPaiement,
        delais: form.delais,
        avancement: form.avancement,
        lots: selectedLotNames,
        documents: documentMeta,
      },
      null,
      2,
    ),
  }
}
