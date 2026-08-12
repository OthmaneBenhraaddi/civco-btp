/** Hardcoded sandbox data for the Prodigy-inspired landing dashboard. */

export const LIVE_SITES = [
  {
    id: 'site-1',
    name: 'Médiouna VRD',
    status: 'LIVE',
    viewers: '42 on site',
    image:
      'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'site-2',
    name: 'Atlas R+4',
    status: 'LIVE',
    viewers: '18 crew',
    image:
      'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'site-3',
    name: 'Marina Lotissement',
    status: 'LIVE',
    viewers: '27 active',
    image:
      'https://images.unsplash.com/photo-1591603862259-90c7d8d8a0f0?auto=format&fit=crop&w=900&q=80',
  },
]

export const KEY_STATS = [
  {
    id: 'stat-1',
    value: '12',
    unit: 'sites',
    label: 'Active Sites',
    icon: 'sites',
  },
  {
    id: 'stat-2',
    value: '1,755',
    unit: 'crew',
    label: 'Team Members',
    icon: 'team',
  },
  {
    id: 'stat-3',
    value: '10',
    unit: 'm MAD',
    label: 'Budget Managed',
    icon: 'budget',
  },
  {
    id: 'stat-4',
    value: '98',
    unit: '%',
    label: 'On Time Delivery',
    icon: 'time',
  },
]

export const FEATURE_CARDS = [
  {
    id: 'feat-1',
    title: 'Interactive Project Map',
    description:
      'Track every chantier in real time — phases, lots, and site status on a living operational map.',
    image:
      'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=1200&q=80',
    tall: true,
  },
  {
    id: 'feat-2',
    title: 'Government & Client Tools',
    description:
      'Amendments workflow rebuilt for public and private clients — approvals, revisions, and audit trails.',
    image:
      'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80',
    tall: false,
  },
  {
    id: 'feat-3',
    title: 'Team Roster & Access',
    description:
      'Faction-style role control for chefs de chantier, ingénieurs, and office crews — one source of truth.',
    image:
      'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1200&q=80',
    tall: false,
  },
  {
    id: 'feat-4',
    title: 'Every Corner, Reimagined',
    description:
      'From devis to facture, documents to dépenses — the full BTP loop in one dark command center.',
    image:
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
    tall: true,
  },
]

export const QUICK_ACTIONS = [
  { id: 'qa-1', label: 'View Projects', to: '/projects', icon: 'projects' },
  { id: 'qa-2', label: 'Amendments', to: '/tickets', icon: 'tickets' },
  { id: 'qa-3', label: 'Clients', to: '/clients', icon: 'clients' },
  { id: 'qa-4', label: 'Roles', to: '/roles', icon: 'roles' },
]
