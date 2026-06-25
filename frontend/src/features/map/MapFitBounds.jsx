import { useEffect } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'

export default function MapFitBounds({ projects }) {
  const map = useMap()

  useEffect(() => {
    if (!projects?.length) {
      return
    }

    const bounds = L.latLngBounds(
      projects.map((project) => [project.latitude, project.longitude]),
    )

    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 12 })
  }, [map, projects])

  return null
}
