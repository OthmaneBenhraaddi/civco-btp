export function buildThreadKey(projectId) {
  return projectId == null ? 'general' : `project:${projectId}`
}

export function parseThreadKey(threadKey) {
  if (!threadKey || threadKey === 'general') {
    return { projectId: null }
  }

  if (threadKey.startsWith('project:')) {
    return { projectId: Number(threadKey.slice(8)) }
  }

  return { projectId: null }
}

export function formatProjectThreadLabel(project, t) {
  if (!project) {
    return ''
  }

  const reference = project.reference ?? project.project_reference
  const title = project.title ?? project.project_title

  if (reference && title) {
    return `${reference} — ${title}`
  }

  return reference ?? title ?? t('messaging.unnamedProject')
}
