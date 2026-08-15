import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { MapPin } from 'lucide-react'
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import StatusBadge from '../../components/StatusBadge'
import RoleBadge from '../../components/RoleBadge'
import NeonButton from '../../components/prodigy/NeonButton'
import { useAuth } from '../../context/AuthContext'
import { useStealthMode, useStealthModeRefresh } from '../../context/StealthModeContext'
import { useTheme } from '../../context/ThemeContext'
import { useTranslation } from '../../i18n/LanguageContext'
import { resolveNavPath } from '../../routes/routeAccess'
import * as projectsApi from '../../api/projects'
import { extractErrorMessage } from '../../utils/apiHelpers'
import { filterOfficialLinkedRecords } from '../../utils/stealthVisibility'
import MapFitBounds from './MapFitBounds'
import { buildNeonMarkerIcon, resolveProjectMarkerColor } from './projectMapMarkers'

function hasValidMapCoordinates(project) {
  const lat = Number(project?.latitude)
  const lng = Number(project?.longitude)

  return Number.isFinite(lat) && Number.isFinite(lng)
}

const DEFAULT_CENTER = [31.7917, -7.0926]
const DEFAULT_ZOOM = 6

const STADIA_API_KEY = import.meta.env.VITE_STADIA_API_KEY
const STADIA_TILE_BASE = 'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png'
const MAP_TILE_URL = STADIA_API_KEY
  ? `${STADIA_TILE_BASE}?api_key=${STADIA_API_KEY}`
  : STADIA_TILE_BASE
const MAP_TILE_ATTRIBUTION =
  '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'

function ProjectMapEmptyState() {
  const { t } = useTranslation()
  const { isAdmin, user } = useAuth()

  return (
    <div className="project-map-empty flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="project-map-empty__icon flex h-14 w-14 items-center justify-center pg-card text-[var(--pg-accent)]">
        <MapPin size={28} strokeWidth={1.75} aria-hidden />
      </div>
      <div className="max-w-md space-y-2">
        <p className="text-base font-bold uppercase tracking-[0.08em] text-white">{t('map.empty')}</p>
        <p className="text-sm leading-relaxed text-[var(--pg-text-muted)]">{t('map.emptyHint')}</p>
      </div>
      {isAdmin ? (
        <NeonButton to={resolveNavPath('/projects', user)}>
          {t('map.emptyAction')}
        </NeonButton>
      ) : null}
    </div>
  )
}

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
        className="mt-3 inline-flex text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--pg-accent)] hover:text-[var(--pg-accent-soft)]"
      >
        {t('map.viewProject')} →
      </Link>
    </div>
  )
}

export default function ProjectMapPage() {
  const { t } = useTranslation()
  const { isAdmin } = useAuth()
  const { stealthMode } = useStealthMode()
  const stealthModeRef = useRef(stealthMode)
  stealthModeRef.current = stealthMode
  const { colors } = useTheme()
  const [projects, setProjects] = useState([])
  const projectsBaselineRef = useRef([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const visibleProjects = useMemo(
    () => (stealthMode ? filterOfficialLinkedRecords(projects) : projects),
    [projects, stealthMode],
  )

  const mapProjects = useMemo(
    () => visibleProjects.filter(hasValidMapCoordinates),
    [visibleProjects],
  )

  const hasMapProjects = mapProjects.length > 0

  useEffect(() => {
    async function loadMapProjects() {
      setLoading(true)
      setError('')

      try {
        const data = await projectsApi.fetchMapProjects()
        const list = data.data ?? []
        setProjects(list)
        if (!stealthModeRef.current) {
          projectsBaselineRef.current = list
        }
      } catch (err) {
        setError(extractErrorMessage(err, t('map.loadError')))
        setProjects([])
      } finally {
        setLoading(false)
      }
    }

    loadMapProjects()
  }, [t])

  useStealthModeRefresh(({ active }) => {
    if (!active) {
      if (projectsBaselineRef.current.length > 0) {
        setProjects(projectsBaselineRef.current)
      }
      projectsApi.fetchMapProjects()
        .then((data) => {
          const list = data.data ?? []
          setProjects(list)
          projectsBaselineRef.current = list
        })
        .catch(() => {})
    }
  })

  const markerIcons = useMemo(() => {
    const iconMap = new Map()

    mapProjects.forEach((project) => {
      const color = resolveProjectMarkerColor(project, colors)
      iconMap.set(project.id, buildNeonMarkerIcon(color))
    })

    return iconMap
  }, [mapProjects, colors])

  const mapCenter = useMemo(() => {
    if (mapProjects.length === 1) {
      return [mapProjects[0].latitude, mapProjects[0].longitude]
    }

    return DEFAULT_CENTER
  }, [mapProjects])

  return (
    <div className="project-map-page list-page flex h-full min-h-0 flex-col">
      <header className="page-header shrink-0">
        <div>
          <h1>{t('map.title')}</h1>
          <p className="mt-1 text-sm text-[var(--pg-text-muted)]">
            {isAdmin ? t('map.subtitleAdmin') : t('map.subtitleUser')}
          </p>
        </div>
        {!loading ? (
          <p className="text-sm text-slate-500">
            {t('map.projectCount', { count: mapProjects.length })}
          </p>
        ) : null}
      </header>

      {error ? <p className="error shrink-0">{error}</p> : null}

      <div className="project-map-canvas relative min-h-[520px] flex-1 overflow-hidden bg-[#0e121b]">
        {loading ? (
          <div className="flex h-full items-center justify-center text-sm text-slate-500">
            {t('common.loading')}
          </div>
        ) : !hasMapProjects ? (
          <ProjectMapEmptyState />
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
              <MapFitBounds projects={mapProjects} />
              {mapProjects.map((project) => (
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
            <div className="project-map-overlay pointer-events-none absolute inset-0" aria-hidden />
          </>
        )}
      </div>
    </div>
  )
}
