import CutSelect from '../../../components/prodigy/CutSelect'
import { LABEL_CLASS } from '../../../theme/designTokens'

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

  const options = projects.map((project) => ({
    value: String(project.id),
    label: `${project.reference} — ${project.title}`,
  }))

  return (
    <label className={[LABEL_CLASS, 'max-w-md', className].filter(Boolean).join(' ')}>
      {label}
      <CutSelect
        className="mt-2 w-full"
        value={selectedProjectId != null ? String(selectedProjectId) : ''}
        options={options}
        onChange={(next) => onChange(Number(next))}
      />
    </label>
  )
}
