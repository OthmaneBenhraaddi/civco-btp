import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import StatusBadge from '../../components/StatusBadge'
import RoleBadge from '../../components/RoleBadge'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { useTranslation } from '../../i18n/LanguageContext'
import * as projectsApi from '../../api/projects'
import { extractErrorMessage } from '../../utils/apiHelpers'
import MapFitBounds from './MapFitBounds'
import { buildNeonMarkerIcon, resolveProjectMarkerColor } from './projectMapMarkers'

const DEFAULT_CENTER = [31.7917, -7.0926]
const DEFAULT_ZOOM = 6

const STADIA_API_KEY = import.meta.env.VITE_STADIA_API_KEY
const STADIA_TILE_BASE = 'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png'
const MAP_TILE_URL = STADIA_API_KEY
  ? `${STADIA_TILE_BASE}?api_key=${STADIA_API_KEY}`
  : STADIA_TILE_BASE
const MAP_TILE_ATTRIBUTION =
  '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'

function ProjectMapPopup({ project }) {
  const { t } = useTranslation()

  return (
    <div className="project-map-popup min-w-[220px] max-w-[280px]">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{project.reference}</p>
      <h3 className="mt-1 text-sm font-semibold leading-snug text-white">{project.title}</h3>

      <div className="mt-2 flex flex-wrap gap-1.5">
        <StatusBadge status={project.status} />
        {project.nature ? (
          <RoleBadge label={project.nature} tone="sky" />
        ) : null}
        {project.sector ? (
          <RoleBadge label={project.sector} tone="purple" />
        ) : null}
      </div>

      {project.site_address ? (
        <p className="mt-3 text-xs leading-relaxed text-slate-400">{project.site_address}</p>
      ) : null}

      <Link
        to={`/projects/${project.id}`}
        className="mt-3 inline-flex rounded-lg border border-slate-600/60 bg-slate-800/90 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-slate-700"
      >
        {t('map.viewProject')}
      </Link>
    </div>
  )
}

export default function ProjectMapPage() {
  const { t } = useTranslation()
  const { isAdmin } = useAuth()
  const { colors } = useTheme()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadMapProjects() {
      setLoading(true)
      setError('')

      try {
        const data = await projectsApi.fetchMapProjects()
        setProjects(data.data ?? [])
      } catch (err) {
        setError(extractErrorMessage(err, t('map.loadError')))
        setProjects([])
      } finally {
        setLoading(false)
      }
    }

    loadMapProjects()
  }, [t])

  const markerIcons = useMemo(() => {
    const iconMap = new Map()

    projects.forEach((project) => {
      const color = resolveProjectMarkerColor(project, colors)
      iconMap.set(project.id, buildNeonMarkerIcon(color))
    })

    return iconMap
  }, [projects, colors])

  const mapCenter = useMemo(() => {
    if (projects.length === 1) {
      return [projects[0].latitude, projects[0].longitude]
    }

    return DEFAULT_CENTER
  }, [projects])

  return (
    <div className="project-map-page list-page flex h-full min-h-0 flex-col">
      <header className="page-header shrink-0">
        <div>
          <h1>{t('map.title')}</h1>
          <p className="mt-1 text-sm text-slate-400">
            {isAdmin ? t('map.subtitleAdmin') : t('map.subtitleUser')}
          </p>
        </div>
        {!loading ? (
          <p className="text-sm text-slate-500">
            {t('map.projectCount', { count: projects.length })}
          </p>
        ) : null}
      </header>

      {error ? <p className="error shrink-0">{error}</p> : null}

      <div className="project-map-canvas relative min-h-[520px] flex-1 overflow-hidden rounded-xl border border-slate-700/50 bg-[#1a1f2e]">
        {loading ? (
          <div className="flex h-full items-center justify-center text-sm text-slate-500">
            {t('common.loading')}
          </div>
        ) : projects.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
            <p className="text-sm text-slate-400">{t('map.empty')}</p>
            <p className="text-xs text-slate-500">{t('map.emptyHint')}</p>
          </div>
        ) : (
          <>
            <MapContainer
              center={mapCenter}
              zoom={DEFAULT_ZOOM}
              scrollWheelZoom
              attributionControl={false}
              className="project-map-leaflet h-full w-full"
            >
              <TileLayer attribution={MAP_TILE_ATTRIBUTION} url={MAP_TILE_URL} />
              <MapFitBounds projects={projects} />
              {projects.map((project) => (
                <Marker
                  key={project.id}
                  position={[project.latitude, project.longitude]}
                  icon={markerIcons.get(project.id)}
                >
                  <Popup className="project-map-leaflet-popup" minWidth={240}>
                    <ProjectMapPopup project={project} />
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
            <div className="project-map-overlay pointer-events-none absolute inset-0 rounded-xl" aria-hidden />
          </>
        )}
      </div>
    </div>
  )
}
