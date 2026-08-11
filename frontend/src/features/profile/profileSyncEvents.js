export const TEAM_DIRECTORY_REFRESH_EVENT = 'team-directory-refresh'

export function broadcastTeamDirectoryRefresh() {
  window.dispatchEvent(new CustomEvent(TEAM_DIRECTORY_REFRESH_EVENT))
}
