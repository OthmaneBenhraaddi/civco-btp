import { FIELD_CLASS, LABEL_CLASS } from '../../../theme/designTokens'

export default function PortalProjectSelector({
  projects,
  selectedProjectId,
  onChange,
  label,
  className = '',
}) {
  if (!projects || projects.length <= 1) {
    return null
  }

  return (
    <label className={[LABEL_CLASS, 'max-w-md', className].filter(Boolean).join(' ')}>
      {label}
      <select
        className={FIELD_CLASS}
        value={selectedProjectId ?? ''}
        onChange={(event) => onChange(Number(event.target.value))}
      >
        {projects.map((project) => (
          <option key={project.id} value={project.id}>
            {project.reference} — {project.title}
          </option>
        ))}
      </select>
    </label>
  )
}
