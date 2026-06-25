import L from 'leaflet'
import { STATUS_COLOR_KEYS, THEME_COLOR_DEFAULTS } from '../../theme/themeColorDefaults'
import { hexToRgbString } from '../../utils/colorUtils'

export function resolveProjectMarkerColor(project, themeColors = {}) {
  const colors = { ...THEME_COLOR_DEFAULTS, ...themeColors }
  const colorKey = STATUS_COLOR_KEYS[project.status] ?? 'neutral_status'

  return colors[colorKey] ?? colors.neutral_status
}

export function buildNeonMarkerIcon(color) {
  const rgb = hexToRgbString(color)

  return L.divIcon({
    className: 'project-map-marker',
    html: `
      <div
        class="project-map-neon-marker"
        style="--marker-color:${color};--marker-color-rgb:${rgb}"
        aria-hidden="true"
      >
        <span class="project-map-neon-marker__pulse"></span>
        <span class="project-map-neon-marker__pulse project-map-neon-marker__pulse--delayed"></span>
        <span class="project-map-neon-marker__pulse project-map-neon-marker__pulse--wide"></span>
        <span class="project-map-neon-marker__core">
          <span class="project-map-neon-marker__dot"></span>
        </span>
      </div>
    `,
    iconSize: [48, 48],
    iconAnchor: [24, 24],
    popupAnchor: [0, -22],
  })
}
