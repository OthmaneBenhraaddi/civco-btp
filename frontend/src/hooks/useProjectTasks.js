import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as projectsApi from '../api/projects'
import { useStealthMode, useStealthModeRefresh } from '../context/StealthModeContext'
import { mapPhasesResponseToTasks } from '../features/tasks/utils/taskApiMappers'
import { unwrapResource } from '../utils/apiHelpers'
import { filterOfficialLinkedRecords, isOfficialLinkedRecord } from '../utils/stealthVisibility'

export function useProjectTasks() {
  const { stealthMode } = useStealthMode()
  const stealthModeRef = useRef(stealthMode)
  stealthModeRef.current = stealthMode

  const [tasks, setTasks] = useState([])
  const [projects, setProjects] = useState([])
  const projectsBaselineRef = useRef([])
  const tasksBaselineRef = useRef([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refresh = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true)
      setError(null)
    }

    try {
      const projectResponse = await projectsApi.fetchProjects({ per_page: 100 })
      const projectList = projectResponse.data ?? []
      setProjects(projectList)

      if (!stealthModeRef.current) {
        projectsBaselineRef.current = projectList
      }

      // Unlock the UI as soon as projects are available.
      if (!silent) {
        setLoading(false)
      }

      const taskGroups = await Promise.all(
        projectList.map(async (project) => {
          try {
            const phaseResponse = await projectsApi.fetchProjectPhases(project.id)
            const phases = unwrapResource(phaseResponse)
            return mapPhasesResponseToTasks(phases, project)
          } catch {
            return []
          }
        }),
      )

      const nextTasks = taskGroups.flat()
      setTasks(nextTasks)

      if (!stealthModeRef.current) {
        tasksBaselineRef.current = nextTasks
      }
    } catch (loadError) {
      setProjects([])
      setTasks([])
      setError(loadError)
      if (!silent) {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  useStealthModeRefresh(({ active }) => {
    if (!active) {
      if (projectsBaselineRef.current.length > 0) {
        setProjects(projectsBaselineRef.current)
      }
      if (tasksBaselineRef.current.length > 0) {
        setTasks(tasksBaselineRef.current)
      }
      refresh({ silent: true })
    }
  })

  const visibleProjects = useMemo(
    () => (stealthMode ? filterOfficialLinkedRecords(projects) : projects),
    [projects, stealthMode],
  )

  const visibleProjectIds = useMemo(
    () => new Set(visibleProjects.map((project) => String(project.id))),
    [visibleProjects],
  )

  const visibleTasks = useMemo(() => {
    if (!stealthMode) {
      return tasks
    }

    return tasks.filter((task) => {
      if (task.projectId != null && visibleProjectIds.has(String(task.projectId))) {
        return true
      }

      return isOfficialLinkedRecord(task)
    })
  }, [tasks, stealthMode, visibleProjectIds])

  return {
    tasks: visibleTasks,
    projects: visibleProjects,
    loading,
    error,
    refresh,
    setTasks,
  }
}
