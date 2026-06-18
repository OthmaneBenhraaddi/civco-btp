export const PROJECT_NATURES = ['VRD', 'BÂTIMENT']

export const PROJECT_SECTORS = ['PRIVÉ', 'PUBLIC']

export const PAYMENT_STATES = ['PAYÉ', 'NON PAYÉ']

export const VRD_LOTS = [
  'ROUTE',
  'LES OUVRAGE HYDRAULIQUES (LES PONTS + LES DALOTS + LES BUSES)',
  'ASSAINISSEMENT (LIQUIDE + EAUX PLUVIALES)',
  'ECLAIRAGE PUBLICS',
  'RESEAU INFORMATIQUE (BORNE WIFI)',
  'AMENAGEMENT (PAVE + BANC + FONTAINE)',
]

export const BATIMENT_LOTS = [
  'Béton Armé (B.A)',
  'ELECTRICITE',
  'PLOMBERIE',
  'DETECTION ICENDIE',
  'PROTECTION INCENDIE',
  'VENTILLATION',
  'CLIMATISATION',
  'RESEAU INFO',
  'VISEO SURVEILLANCE',
  'DESENFUMAGE',
  'EAU POTABLE',
  'ACCOSTIQUE',
]

export function lotsForNature(nature) {
  return nature === 'BÂTIMENT' ? BATIMENT_LOTS : VRD_LOTS
}

export const DEFAULT_PROJECT_FORM = {
  client_id: '',
  nature: 'VRD',
  sector: 'PRIVÉ',
  objet: '',
  montant: '',
  etatPaiement: 'NON PAYÉ',
  ordreServiceDate: '',
  dateFinTravaux: '',
  delais: '',
  avancement: 'ÉTUDE 4 MOIS + 8 MOIS DE SUIVI',
  selectedLots: [],
}

export function buildProjectApiPayload(form) {
  const documentMeta = form.documentMeta ?? []

  return {
    client_id: Number(form.client_id),
    title: form.objet.trim(),
    budget: form.montant === '' ? null : Number(form.montant),
    start_date: form.ordreServiceDate || null,
    end_date: form.dateFinTravaux || null,
    status: 'planned',
    nature: form.nature,
    sector: form.sector,
    etat_paiement: form.etatPaiement,
    delais: form.delais || null,
    avancement: form.avancement || null,
    lots: form.selectedLots ?? [],
    description_meta: documentMeta.length > 0 ? { documents: documentMeta } : null,
    description: JSON.stringify(
      {
        nature: form.nature,
        sector: form.sector,
        etat_paiement: form.etatPaiement,
        delais: form.delais,
        avancement: form.avancement,
        lots: form.selectedLots,
        documents: documentMeta,
      },
      null,
      2,
    ),
  }
}
