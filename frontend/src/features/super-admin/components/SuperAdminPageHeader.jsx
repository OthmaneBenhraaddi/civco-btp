export default function SuperAdminPageHeader({ title, subtitle }) {
  return (
    <header className="page-header mb-6">
      <div>
        <h1>{title}</h1>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
    </header>
  )
}
