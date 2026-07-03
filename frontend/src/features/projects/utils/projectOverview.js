export function formatProjectOverviewDescription(project, fallbackLabel) {
  const meta = project?.description_meta

  if (meta && typeof meta === 'object' && !Array.isArray(meta)) {
    const parts = [
      meta.nature,
      meta.sector,
      meta.avancement,
      meta.delais,
    ].filter(Boolean)

    if (parts.length > 0) {
      return parts.join(' · ')
    }
  }

  const description = project?.description?.trim()

  if (!description) {
    return fallbackLabel
  }

  if (description.startsWith('{')) {
    try {
      const parsed = JSON.parse(description)

      if (parsed && typeof parsed === 'object') {
        const parts = [
          parsed.nature,
          parsed.sector,
          parsed.avancement,
          parsed.delais,
        ].filter(Boolean)

        if (parts.length > 0) {
          return parts.join(' · ')
        }
      }
    } catch {
      // Keep plain text fallback below.
    }
  }

  return description
}
