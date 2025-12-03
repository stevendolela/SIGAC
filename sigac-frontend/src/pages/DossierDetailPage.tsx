import DossierDetailModal from './DossierDetailModal'

interface Props {
  dossierId: string
  onClose?: () => void
}

export default function DossierDetailPage({ dossierId, onClose }: Props) {
  return <DossierDetailModal dossierId={dossierId} onClose={onClose || (() => window.history.back())} />
}
