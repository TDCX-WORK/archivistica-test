import { useState } from 'react'
import { AlertCircle } from 'lucide-react'
import { useForo }         from '../../hooks/useForo'
import ThreadList          from './ThreadList'
import ThreadDetail        from './ThreadDetail'
import NewThreadModal      from './NewThreadModal'
import type { CurrentUser } from '../../types'
import type { ForoThread }  from '../../hooks/useForo'
import styles               from './ForoPage.module.css'

interface Props {
  currentUser: CurrentUser | null
}

export default function ForoPage({ currentUser }: Props) {
  const {
    threads, subjects, blocks,
    loading, error,
    crearThread, loadReplies, responder,
    marcarSolucion,
  } = useForo(currentUser)

  const [openThread,  setOpenThread]  = useState<ForoThread | null>(null)
  const [showModal,   setShowModal]   = useState(false)

  return (
    <div className={styles.page}>

      {/* Header — solo visible en la lista */}
      {!openThread && (
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <h1 className={styles.title}>Foro de dudas</h1>
            <p className={styles.subtitle}>
              Pregunta, responde y aprende con tu clase
            </p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className={styles.error}>
          <AlertCircle size={15} />
          {error}
        </div>
      )}

      {/* Vista: lista o detalle */}
      {openThread ? (
        <ThreadDetail
          thread={openThread}
          currentUser={currentUser}
          onBack={() => setOpenThread(null)}
          onLoadReplies={loadReplies}
          onResponder={responder}
          onMarcarSolucion={marcarSolucion}
        />
      ) : (
        <ThreadList
          threads={threads}
          subjects={subjects}
          blocks={blocks}
          loading={loading}
          onOpen={setOpenThread}
          onNuevo={() => setShowModal(true)}
        />
      )}

      {/* Modal nueva pregunta */}
      {showModal && (
        <NewThreadModal
          subjects={subjects}
          blocks={blocks}
          onCrear={crearThread}
          onClose={() => setShowModal(false)}
        />
      )}

    </div>
  )
}
