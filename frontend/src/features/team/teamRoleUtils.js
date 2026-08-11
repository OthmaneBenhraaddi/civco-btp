/** Roles that must not appear in the team invitation dropdown. */
export const NON_ASSIGNABLE_TEAM_ROLE_SLUGS = ['super_admin', 'client_extern']

export function filterTeamAssignableRoles(roles = []) {
  return roles.filter((role) => !NON_ASSIGNABLE_TEAM_ROLE_SLUGS.includes(role.slug))
}

export function resolveMemberFunction(member) {
  return member.roles?.[0]?.name ?? member.job_title ?? '—'
}
