import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import CutFrame from '../../components/prodigy/CutFrame'
import CutSelect from '../../components/prodigy/CutSelect'
import NeonButton from '../../components/prodigy/NeonButton'
import Reveal from '../../components/prodigy/Reveal'
import SiteFooter from '../../components/prodigy/SiteFooter'
import {
  TICKET_CATEGORIES,
  TICKET_PROJECTS,
  createTicket,
} from './ticketsData'

const DEFAULT_DESCRIPTION = `Your Contact Name:
Your Role / Company:
Issue summary:
`

export default function NewTicketPage() {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [projectId, setProjectId] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState(DEFAULT_DESCRIPTION)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const canSubmit = useMemo(
    () => title.trim() && projectId && category && description.trim(),
    [title, projectId, category, description],
  )

  function handleSubmit(event) {
    event.preventDefault()
    if (!canSubmit) {
      setError('Please fill in title, project, category, and description.')
      return
    }

    setSubmitting(true)
    setError('')

    const ticket = createTicket({
      title,
      projectId,
      category,
      description,
    })

    window.setTimeout(() => {
      setSubmitting(false)
      navigate(`/tickets/${ticket.id}`)
    }, 180)
  }

  return (
    <div className="min-h-full">
      <div className="mx-auto max-w-[760px] px-4 py-8 sm:px-6 sm:py-10">
        <Reveal>
          <Link to="/tickets" className="pg-back-link">
            <IconChevronLeft className="h-3.5 w-3.5" />
            Back to tickets
          </Link>
        </Reveal>

        <Reveal delay={0.04} className="mt-8 text-center">
          <h1 className="pg-section-title">New Support Ticket</h1>
          <p className="mx-auto mt-3 max-w-lg text-sm text-[var(--pg-text-muted)]">
            Describe your issue and our staff will review it as soon as possible.
          </p>
        </Reveal>

        <Reveal delay={0.08} className="mt-8">
          <CutFrame size="lg" as="form" onSubmit={handleSubmit} className="block" innerClassName="p-5 sm:p-7">
            <label className="pg-field">
              <span className="pg-field-label">Title</span>
              <input
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Brief summary of your issue"
                className="pg-field-control"
                required
              />
            </label>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="pg-field">
                <span className="pg-field-label">Project</span>
                <CutSelect
                  className="w-full"
                  value={projectId}
                  onChange={setProjectId}
                  placeholder="Choose project"
                  options={[
                    { value: '', label: 'Choose project' },
                    ...TICKET_PROJECTS.map((project) => ({
                      value: project.id,
                      label: project.label,
                    })),
                  ]}
                />
              </label>

              <label className="pg-field">
                <span className="pg-field-label">Category</span>
                <CutSelect
                  className="w-full"
                  value={category}
                  onChange={setCategory}
                  placeholder="Choose category"
                  options={[
                    { value: '', label: 'Choose category' },
                    ...TICKET_CATEGORIES.map((item) => ({ value: item, label: item })),
                  ]}
                />
              </label>
            </div>

            <label className="pg-field mt-5">
              <span className="pg-field-label">Description</span>
              <CutFrame size="sm" className="block" innerClassName="overflow-hidden bg-[#0e121b]">
                <div className="flex flex-wrap items-center gap-3 border-b border-white/[0.05] px-3 py-2">
                  <div className="flex items-center gap-1">
                    <FormatBtn label="B" className="font-bold" />
                    <FormatBtn label="I" className="italic" />
                    <FormatBtn label="U" className="underline" />
                    <FormatBtn label="↗" />
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-300">
                    Paste or drop images to attach
                  </p>
                </div>
                <textarea
                  rows={8}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  className="min-h-[180px] w-full resize-y border-0 bg-transparent px-3 py-3 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-0"
                  required
                />
              </CutFrame>
            </label>

            {error ? <p className="error mt-4">{error}</p> : null}

            <div className="mt-6 flex flex-wrap items-center justify-end gap-2.5">
              <NeonButton to="/tickets" variant="ghost">
                Cancel
              </NeonButton>
              <NeonButton
                type="submit"
                disabled={submitting || !canSubmit}
                className={submitting || !canSubmit ? 'opacity-45' : ''}
              >
                {submitting ? 'Submitting…' : 'Submit Ticket'}
              </NeonButton>
            </div>
          </CutFrame>
        </Reveal>
      </div>

      <SiteFooter />
    </div>
  )
}

function FormatBtn({ label, className = '' }) {
  return (
    <button type="button" tabIndex={-1} className={`pg-format-btn ${className}`}>
      {label}
    </button>
  )
}

function IconChevronLeft({ className }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M12.5 4.5L7 10l5.5 5.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
