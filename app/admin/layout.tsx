import { CabinetShell } from '@/components/cabinet/shell'

export default function Layout({ children }: { children: React.ReactNode }) {
  return <CabinetShell role="admin">{children}</CabinetShell>
}
