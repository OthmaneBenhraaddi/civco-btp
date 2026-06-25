import { Outlet } from 'react-router-dom'

export default function AuthLayout() {
  return (
    <div className="flex h-full w-full items-center justify-center overflow-hidden bg-[#0D0E11] p-4 sm:p-6">
      <Outlet />
    </div>
  )
}
