'use client'

import { useCallback, useEffect, useState } from 'react'
import { FileText, Pencil, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Sheet } from '@/components/ui/Sheet'
import { Dialog } from '@/components/ui/Dialog'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { parseQuestions, type QuestionnaireQuestion, type QuestionType } from '@/lib/questionnaires'

/**
 * Settings-panel manager for questionnaire templates (שאלוני הכנה):
 * list / create (seeded from the base needs-assessment + personal-details
 * questionnaire) / edit (labels, types incl. multiple-choice "אמריקאיות",
 * options, required, add/remove) / delete. The base template can be edited
 * but not deleted.
 */

type TemplateRow = {
  id: string
  name: string
  questions_json: string
  is_default: number
  updated_at: string
}

const TYPE_LABELS: Record<QuestionType, string> = {
  'text': 'טקסט חופשי',
  'number': 'מספר',
  'select': 'בחירה מרשימה',
  'multiple-choice': 'שאלה אמריקאית',
  'yes-no': 'כן / לא',
  'textarea': 'טקסט ארוך',
}

export default function QuestionnaireManager() {
  const [templates, setTemplates] = useState<TemplateRow[]>([])
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [editing, setEditing] = useState<TemplateRow | null>(null)
  const [editName, setEditName] = useState('')
  const [editQuestions, setEditQuestions] = useState<QuestionnaireQuestion[]>([])
  const [deleting, setDeleting] = useState<TemplateRow | null>(null)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')

  const load = useCallback(async () => {
    setLoadState('loading')
    try {
      const response = await fetch('/api/questionnaires')
      if (!response.ok) { setLoadState('error'); return }
      const data = await response.json() as { templates: TemplateRow[] }
      setTemplates(data.templates || [])
      setLoadState('ready')
    } catch {
      setLoadState('error')
    }
  }, [])

  useEffect(() => { void load() }, [load])

  async function createTemplate() {
    const name = window.prompt('שם השאלון החדש:', 'שאלון הכנה מותאם')
    if (!name?.trim()) return
    setBusy(true)
    try {
      const response = await fetch('/api/questionnaires', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', name: name.trim() }),
      })
      if (response.ok) {
        setNotice('השאלון נוצר — מבוסס על השאלון הבסיסי, ניתן לערוך.')
        await load()
      }
    } finally {
      setBusy(false)
    }
  }

  function openEditor(template: TemplateRow) {
    setEditing(template)
    setEditName(template.name)
    setEditQuestions(parseQuestions(template.questions_json))
  }

  async function saveEditor() {
    if (!editing || !editName.trim() || !editQuestions.length) return
    setBusy(true)
    try {
      const response = await fetch('/api/questionnaires', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update', id: editing.id, name: editName.trim(), questions: editQuestions }),
      })
      if (response.ok) {
        setEditing(null)
        setNotice('השאלון נשמר.')
        await load()
      } else {
        setNotice('שמירת השאלון נכשלה — בדוק שלכל שאלה יש כותרת ולשאלות בחירה לפחות 2 אפשרויות.')
      }
    } finally {
      setBusy(false)
    }
  }

  async function confirmDelete() {
    if (!deleting) return
    setBusy(true)
    try {
      await fetch('/api/questionnaires', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id: deleting.id }),
      })
      setDeleting(null)
      await load()
    } finally {
      setBusy(false)
    }
  }

  function updateQuestion(id: string, patch: Partial<QuestionnaireQuestion>) {
    setEditQuestions(current => current.map(question => question.id === id ? { ...question, ...patch } : question))
  }

  function removeQuestion(id: string) {
    setEditQuestions(current => current.filter(question => question.id !== id))
  }

  function addQuestion(type: QuestionType) {
    const question: QuestionnaireQuestion = {
      id: `custom-${crypto.randomUUID().slice(0, 8)}`,
      section: 'שאלות נוספות',
      label: '',
      type,
      options: type === 'multiple-choice' || type === 'select' ? ['אפשרות 1', 'אפשרות 2'] : undefined,
    }
    setEditQuestions(current => [...current, question])
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: 13.5, margin: 0 }}>
          שאלונים שנשלחים ללקוח לפני פגישה. כל שאלון מבוסס על בירור הצרכים והפרטים האישיים, וניתן להוסיף שאלות משלך.
        </p>
        <Button variant="primary" size="sm" disabled={busy} onClick={() => void createTemplate()}>
          <Plus size={14} style={{ marginInlineEnd: 4 }} /> צור שאלון חדש
        </Button>
      </div>

      {notice && <p style={{ color: 'var(--success-text, #065F46)', fontSize: 13, fontWeight: 600, margin: 0 }}>{notice}</p>}
      {loadState === 'error' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <p style={{ color: 'var(--destructive-text)', margin: 0 }}>טעינת השאלונים נכשלה.</p>
          <Button variant="secondary" size="sm" onClick={() => void load()}>נסה שוב</Button>
        </div>
      )}
      {loadState === 'loading' && <p style={{ color: 'var(--text-muted)', margin: 0 }}>טוען…</p>}

      {loadState === 'ready' && templates.map(template => (
        <div key={template.id} style={templateRowStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <FileText size={16} color="var(--text-muted)" />
            <strong style={{ color: 'var(--text-heading)', fontSize: 14 }}>{template.name}</strong>
            {Boolean(template.is_default) && <StatusBadge tone="neutral" label="שאלון בסיס" />}
            <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{parseQuestions(template.questions_json).length} שאלות</span>
          </div>
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            <Button size="sm" variant="secondary" onClick={() => openEditor(template)}>
              <Pencil size={13} style={{ marginInlineEnd: 4 }} /> ערוך
            </Button>
            {!template.is_default && (
              <Button size="sm" variant="ghost" onClick={() => setDeleting(template)}>
                <Trash2 size={13} style={{ marginInlineEnd: 4 }} /> מחק
              </Button>
            )}
          </div>
        </div>
      ))}

      {editing && (
        <Sheet
          open
          onClose={() => setEditing(null)}
          placement="center"
          width="min(880px, 96vw)"
          title="עריכת שאלון"
          footer={
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-start' }}>
              <Button variant="primary" disabled={busy} onClick={() => void saveEditor()}>שמור שאלון</Button>
              <Button variant="ghost" disabled={busy} onClick={() => setEditing(null)}>ביטול</Button>
            </div>
          }
        >
          <div style={{ display: 'grid', gap: 16 }}>
            <label style={{ display: 'grid', gap: 6, fontWeight: 600, fontSize: 13.5, color: 'var(--text-heading)' }}>
              <span>שם השאלון</span>
              <input value={editName} onChange={event => setEditName(event.target.value)} style={editorInputStyle} />
            </label>

            <div style={{ display: 'grid', gap: 10 }}>
              {editQuestions.map(question => (
                <div key={question.id} style={questionCardStyle}>
                  <div style={{ display: 'grid', gap: 8, flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={sectionChipStyle}>{question.section}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{TYPE_LABELS[question.type] || question.type}</span>
                      {question.spouseOnly && <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>· מוצג רק לבני זוג</span>}
                    </div>
                    <input
                      value={question.label}
                      onChange={event => updateQuestion(question.id, { label: event.target.value })}
                      placeholder="נוסח השאלה"
                      style={editorInputStyle}
                    />
                    {(question.type === 'select' || question.type === 'multiple-choice') && (
                      <input
                        value={(question.options || []).join(' | ')}
                        onChange={event => updateQuestion(question.id, { options: event.target.value.split('|').map(option => option.trim()).filter(Boolean) })}
                        placeholder="אפשרויות מופרדות ב-| (לדוגמה: כן | לא | אולי)"
                        style={editorInputStyle}
                      />
                    )}
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--text-muted)', fontWeight: 400 }}>
                      <input type="checkbox" checked={Boolean(question.required)} onChange={event => updateQuestion(question.id, { required: event.target.checked })} />
                      שדה חובה
                    </label>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => removeQuestion(question.id)} title="מחק שאלה">
                    <Trash2 size={14} />
                  </Button>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', paddingTop: 4, borderTop: '1px solid var(--separator)' }}>
              <span style={{ color: 'var(--text-heading)', fontWeight: 600, fontSize: 13.5, alignSelf: 'center' }}>הוסף שאלה:</span>
              <Button size="sm" variant="secondary" onClick={() => addQuestion('text')}>טקסט</Button>
              <Button size="sm" variant="secondary" onClick={() => addQuestion('number')}>מספר</Button>
              <Button size="sm" variant="secondary" onClick={() => addQuestion('yes-no')}>כן/לא</Button>
              <Button size="sm" variant="secondary" onClick={() => addQuestion('multiple-choice')}>שאלה אמריקאית</Button>
              <Button size="sm" variant="secondary" onClick={() => addQuestion('textarea')}>טקסט ארוך</Button>
            </div>
          </div>
        </Sheet>
      )}

      <Dialog
        open={Boolean(deleting)}
        title="למחוק את השאלון?"
        description={`"${deleting?.name}" יימחק לצמיתות. שאלונים שכבר נשלחו ללקוחות לא יושפעו.`}
        confirmLabel="מחק"
        destructive
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleting(null)}
      />
    </div>
  )
}

const templateRowStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '12px 14px', border: '1px solid var(--separator)', borderRadius: 'var(--radius-md)', background: 'var(--bg-canvas)' }
const questionCardStyle: React.CSSProperties = { display: 'flex', gap: 10, alignItems: 'flex-start', padding: '12px 14px', border: '1px solid var(--separator)', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface-sunken)' }
const sectionChipStyle: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: 'var(--text-heading)', background: 'var(--bg-surface)', border: '1px solid var(--separator)', borderRadius: 999, padding: '2px 10px' }
const editorInputStyle: React.CSSProperties = { minHeight: 40, border: '1px solid var(--separator)', borderRadius: 10, padding: '8px 12px', fontFamily: 'var(--font-main)', fontSize: 13.5, background: 'var(--bg-surface)', color: 'var(--text-heading)', width: '100%' }
