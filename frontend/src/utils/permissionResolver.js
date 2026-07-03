const SEMANTIC_EXPANSIONS = {
  view_financials: ['quote.view', 'invoice.view', 'delivery_form.view'],
  manage_financials: ['quote.manage', 'invoice.manage', 'delivery_form.manage', 'payment.record'],
  manage_tasks: ['task.view_all', 'task.assign', 'task.update'],
  edit_clients: ['client.create', 'client.update'],
  view_clients: ['client.view'],
  manage_projects: ['project.create', 'project.update', 'project.delete', 'project.budget'],
}

export function expandPermissions(slugs) {
  const expanded = [...slugs]

  for (const slug of slugs) {
    for (const implied of SEMANTIC_EXPANSIONS[slug] ?? []) {
      expanded.push(implied)
    }
  }

  return [...new Set(expanded)]
}

export function userHasPermission(userSlugs, required) {
  if (userSlugs.includes(required)) {
    return true
  }

  const expanded = expandPermissions(userSlugs)

  if (expanded.includes(required)) {
    return true
  }

  for (const [semantic, granular] of Object.entries(SEMANTIC_EXPANSIONS)) {
    if (userSlugs.includes(semantic) && granular.includes(required)) {
      return true
    }
  }

  return false
}
