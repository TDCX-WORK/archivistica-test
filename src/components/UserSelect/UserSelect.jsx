import { useState } from 'react'
import { UserCircle2, Plus, ArrowRight, BookOpen, Trash2 } from 'lucide-react'
import { getStoredUsers } from '../../hooks/useProgress'
import styles from './UserSelect.module.css'

const COLORS = ['#2d6a35','#b84a38','#9a7020','#2d5f8a','#6a2d7a','#2d7a6a']

function initials(name) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

export default function UserSelect({ onSelect }) {
  const [users, setUsers] = useState(getStoredUsers)
  const [newName, setNewName] = useState('')
  const [adding, setAdding] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const handleAdd = () => {
    const name = newName.trim()
    if (!name || name.length < 2) return
    const id = name.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now()
    const color = COLORS[users.length % COLORS.length]
    const updated = [...users, { id, name, color }]
    setUsers(updated)
    try { localStorage.setItem('archivistica_users', JSON.stringify(updated)) } catch {}
    setNewName('')
    setAdding(false)
    onSelect({ id, name, color })
  }

  const handleDelete = (userId) => {
    const updated = users.filter(u => u.id !== userId)
    setUsers(updated)
    try {
      localStorage.setItem('archivistica_users', JSON.stringify(updated))
      localStorage.removeItem(`archivistica_progress_${userId}`)
    } catch {}
    setConfirmDelete(null)
  }

  return (
    <div className={styles.screen}>
      <div className={styles.card}>
        <div className={styles.topIcon}>
          <BookOpen size={28} strokeWidth={1.5} />
        </div>
        <h1 className={styles.title}>Archivística</h1>
        <p className={styles.sub}>Oposiciones · Ministerio de Cultura</p>
        <p className={styles.pick}>¿Quién estudia hoy?</p>

        <div className={styles.list}>
          {users.map(user => (
            <div key={user.id} className={styles.userRow}>
              {confirmDelete === user.id ? (
                <div className={styles.confirmRow}>
                  <span className={styles.confirmText}>¿Eliminar a {user.name}?</span>
                  <button className={styles.btnDanger} onClick={() => handleDelete(user.id)}>Sí, eliminar</button>
                  <button className={styles.btnCancel} onClick={() => setConfirmDelete(null)}>Cancelar</button>
                </div>
              ) : (
                <>
                  <button className={styles.userBtn} onClick={() => onSelect(user)}>
                    <span className={styles.avatar} style={{ background: user.color }}>
                      {initials(user.name)}
                    </span>
                    <span className={styles.userName}>{user.name}</span>
                    <ArrowRight size={16} className={styles.arrow} />
                  </button>
                  <button className={styles.deleteBtn} onClick={() => setConfirmDelete(user.id)} title="Eliminar usuario">
                    <Trash2 size={14} />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>

        {adding ? (
          <div className={styles.addForm}>
            <input
              className={styles.input}
              placeholder="Tu nombre…"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              autoFocus
              maxLength={30}
            />
            <div className={styles.addActions}>
              <button className={styles.btnPrimary} onClick={handleAdd} disabled={newName.trim().length < 2}>
                <Plus size={16} /> Crear perfil
              </button>
              <button className={styles.btnCancel} onClick={() => { setAdding(false); setNewName('') }}>
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <button className={styles.addBtn} onClick={() => setAdding(true)}>
            <Plus size={18} />
            <span>Nuevo perfil</span>
          </button>
        )}

        <p className={styles.note}>
          <UserCircle2 size={13} /> Los datos se guardan localmente en este dispositivo
        </p>
      </div>
    </div>
  )
}
