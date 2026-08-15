/** Static mock data for the unauthenticated Prodigy landing page. */

export const LIVE_SITES = [
  {
    id: 'site-1',
    name: 'Médiouna VRD',
    status: 'LIVE',
    viewers: '42 sur site',
    image:
      'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'site-2',
    name: 'Atlas R+4',
    status: 'LIVE',
    viewers: '18 équipes',
    image:
      'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'site-3',
    name: 'Marina Lotissement',
    status: 'LIVE',
    viewers: '27 actifs',
    image:
      'https://images.unsplash.com/photo-1517581177682-a085bb7ffb15?auto=format&fit=crop&w=900&q=80',
  },
]

export const KEY_STATS = [
  {
    id: 'stat-1',
    value: '12',
    unit: 'chantiers',
    label: 'Chantiers actifs',
    icon: 'sites',
  },
  {
    id: 'stat-2',
    value: '1 755',
    unit: 'équipiers',
    label: 'Équipes terrain',
    icon: 'team',
  },
  {
    id: 'stat-3',
    value: '10',
    unit: 'M MAD',
    label: 'Budget géré',
    icon: 'budget',
  },
  {
    id: 'stat-4',
    value: '98',
    unit: '%',
    label: 'Livraison à temps',
    icon: 'time',
  },
]

export const FEATURE_CARDS = [
  {
    id: 'feat-1',
    title: 'Carte interactive des projets',
    description:
      'Suivez chaque chantier en temps réel — phases, lots et statut opérationnel sur une carte vivante.',
    image:
      'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=1200&q=80',
    tall: true,
  },
  {
    id: 'feat-2',
    title: 'Outils client & avenants',
    description:
      'Workflow d’avenants pour clients publics et privés — validations, révisions et piste d’audit.',
    image:
      'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80',
    tall: false,
  },
  {
    id: 'feat-3',
    title: 'Équipes & droits d’accès',
    description:
      'Contrôle des rôles pour chefs de chantier, ingénieurs et bureau — une seule source de vérité.',
    image:
      'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1200&q=80',
    tall: false,
  },
  {
    id: 'feat-4',
    title: 'Chaque détail, repensé',
    description:
      'Du devis à la facture, documents et dépenses — la boucle BTP complète dans un centre de commande.',
    image:
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
    tall: true,
  },
]

export const QUICK_ACTIONS = [
  { id: 'qa-1', label: 'Voir les projets', to: '/login', icon: 'projects' },
  { id: 'qa-2', label: 'Avenants', to: '/login', icon: 'tickets' },
  { id: 'qa-3', label: 'Clients', to: '/login', icon: 'clients' },
  { id: 'qa-4', label: 'Rôles', to: '/login', icon: 'roles' },
]
