import { useEffect } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'

export default function MapFitBounds({ projects }) {
  const map = useMap()

  useEffect(() => {
    const validProjects = (projects ?? []).filter(
      (project) => Number.isFinite(Number(project?.latitude))
        && Number.isFinite(Number(project?.longitude)),
    )

    if (validProjects.length === 0) {
      return
    }

    const bounds = L.latLngBounds(
      validProjects.map((project) => [project.latitude, project.longitude]),
    )

    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 12 })
  }, [map, projects])

  return null
}
