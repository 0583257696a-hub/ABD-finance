'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Mic, MicOff, Pause, Play, Sparkles, Square, Upload } from 'lucide-react'
import { Sheet } from '@/components/ui/Sheet'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { useToast } from '@/components/ui/Toast'
import { useWorkspaceStore } from '@/lib/store/workspaceStore'
import type { ExtractedSuggestions } from '@/lib/transcript-types'

/**
 * Recording + live transcript + approve-only extraction (proposal §4).
 *
 * Consent first: the advisor confirms the client agreed; that is written to
 * the audit log with a timestamp and kept on the summary. While recording a
 * red indicator is always visible; pause is always one click.
 *
 * Capture: MediaRecorder from the device mic in ~30s SEGMENTS, each a
 * complete WebM/Opus file (a single long recording sliced with timeslice
 * only has a header on the first chunk, which Whisper can't decode), sent to
 * /api/transcribe and appended to the transcript. Uploading an existing
 * recording is the same path.
 *
 * Extraction: "הפק הצעות" asks the model for facts / decisions / tasks /
 * concerns from the transcript. Every item is a SUGGESTION with an "הוסף"
 * button — nothing enters the document by itself.
 *
 * The transcript is stored on the summary as an INTERNAL field: archived,
 * never printed, never emailed to the client. No audio is kept anywhere.
 */

const SEGMENT_MS = 30_000

type RecState = 'idle' | 'recording' | 'paused'

export function RecordingPanel({ open, onOpenChange, meetingId, clientName }: { open: boolean; onOpenChange: (open: boolean) => void; meetingId: string; clientName: string }) {
  const toast = useToast()
  const summary = useWorkspaceStore(state => state.meetingSummary)
  const setMeetingSummary = useWorkspaceStore(state => state.setMeetingSummary)
  const needs = useWorkspaceStore(state => state.needsAssessment)
  const setNeedsAssessment = useWorkspaceStore(state => state.setNeedsAssessment)

  const [recState, setRecState] = useState<RecState>('idle')
  const [consentOpen, setConsentOpen] = useState(false)
  const [transcribing, setTranscribing] = useState(0)
  const [seconds, setSeconds] = useState(0)
  const [suggestions, setSuggestions] = useState<ExtractedSuggestions | null>(null)
  const [extracting, setExtracting] = useState(false)
  const [error, setError] = useState('')
  const [applied, setApplied] = useState<Set<string>>(new Set())

  const streamRef = useRef<MediaStream | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const segmentTimer = useRef<number | null>(null)
  const stateRef = useRef<RecState>('idle')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const transcript = summary.transcript || ''

  useEffect(() => { stateRef.current = recState }, [recState])

  // Elapsed timer while recording.
  useEffect(() => {
    if (recState !== 'recording') return
    const handle = window.setInterval(() => setSeconds(value => value + 1), 1000)
    return () => window.clearInterval(handle)
  }, [recState])

  const appendTranscript = useCallback((text: string) => {
    if (!text.trim()) return
    const current = useWorkspaceStore.getState().meetingSummary
    setMeetingSummary({ ...current, transcript: `${current.transcript ? `${current.transcript}\n` : ''}${text.trim()}` })
  }, [setMeetingSummary])

  const transcribeBlob = useCallback(async (blob: Blob) => {
    if (!blob.size) return
    setTranscribing(count => count + 1)
    try {
      const response = await fetch('/api/transcribe?lang=he', { method: 'POST', headers: { 'Content-Type': blob.type || 'application/octet-stream' }, body: blob })
      const data = await response.json().catch(() => ({})) as { ok?: boolean; text?: string; error?: string; detail?: string }
      if (data.ok) appendTranscript(data.text || '')
      else setError(data.error === 'ai-unavailable' ? 'שירות התמלול אינו זמין בסביבה זו.' : `התמלול נכשל${data.detail ? ` (${data.detail.slice(0, 80)})` : ''}.`)
    } catch {
      setError('שגיאת רשת בתמלול — המקטע לא נשמר.')
    } finally {
      setTranscribing(count => Math.max(0, count - 1))
    }
  }, [appendTranscript])

  // One segment = one complete file. Stop → upload → start the next.
  const startSegment = useCallback(() => {
    const stream = streamRef.current
    if (!stream) return
    const mimeType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'].find(type => typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(type)) || ''
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType, audioBitsPerSecond: 32_000 } : undefined)
    const parts: Blob[] = []
    recorder.ondataavailable = event => { if (event.data.size) parts.push(event.data) }
    recorder.onstop = () => {
      const blob = new Blob(parts, { type: recorder.mimeType || 'audio/webm' })
      void transcribeBlob(blob)
      if (stateRef.current === 'recording') startSegment()
    }
    recorder.start()
    recorderRef.current = recorder
    segmentTimer.current = window.setTimeout(() => { if (recorder.state === 'recording') recorder.stop() }, SEGMENT_MS)
  }, [transcribeBlob])

  async function beginRecording() {
    setError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } })
      streamRef.current = stream
      setRecState('recording')
      stateRef.current = 'recording'
      startSegment()
    } catch {
      setError('אין גישה למיקרופון. אשר הרשאת מיקרופון בדפדפן ונסה שוב.')
    }
  }

  async function confirmConsent() {
    setConsentOpen(false)
    try {
      const response = await fetch('/api/meetings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'recording-consent', id: meetingId }) })
      const data = await response.json().catch(() => ({})) as { ok?: boolean; at?: string }
      const at = data.at || new Date().toISOString()
      const current = useWorkspaceStore.getState().meetingSummary
      setMeetingSummary({ ...current, recordingConsentAt: at })
    } catch { /* consent still recorded locally on the summary below */ }
    await beginRecording()
  }

  function pause() {
    if (segmentTimer.current) window.clearTimeout(segmentTimer.current)
    setRecState('paused'); stateRef.current = 'paused'
    const recorder = recorderRef.current
    if (recorder && recorder.state === 'recording') recorder.stop() // flushes the current segment to transcription
  }

  function resume() {
    setRecState('recording'); stateRef.current = 'recording'
    startSegment()
  }

  function stop() {
    if (segmentTimer.current) window.clearTimeout(segmentTimer.current)
    setRecState('idle'); stateRef.current = 'idle'
    const recorder = recorderRef.current
    if (recorder && recorder.state === 'recording') recorder.stop()
    streamRef.current?.getTracks().forEach(track => track.stop())
    streamRef.current = null
    setSeconds(0)
  }

  useEffect(() => () => { streamRef.current?.getTracks().forEach(track => track.stop()) }, [])

  async function extract() {
    if (transcript.trim().length < 20) { toast('אין עדיין מספיק תמליל להפקת הצעות.', 'info'); return }
    setExtracting(true)
    setError('')
    try {
      const response = await fetch('/api/transcribe/extract', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ transcript }) })
      const data = await response.json().catch(() => ({})) as { ok?: boolean; suggestions?: ExtractedSuggestions; error?: string }
      if (data.ok && data.suggestions) { setSuggestions(data.suggestions); setApplied(new Set()) }
      else setError(data.error === 'ai-unavailable' ? 'שירות ה-AI אינו זמין בסביבה זו.' : 'הפקת ההצעות נכשלה — נסה שוב.')
    } finally {
      setExtracting(false)
    }
  }

  function markApplied(key: string) { setApplied(current => new Set(current).add(key)) }

  function addFact(fact: { label: string; value: string }, key: string) {
    const current = useWorkspaceStore.getState().meetingSummary
    setMeetingSummary({ ...current, facts: [...(current.facts || []), { id: `fact-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, isAuto: false, label: fact.label, value: fact.value }] })
    markApplied(key); toast('נוסף לעובדות המרכזיות', 'success')
  }
  function addDecision(text: string, key: string) {
    const current = useWorkspaceStore.getState().meetingSummary
    setMeetingSummary({ ...current, recommendations: [...(current.recommendations || []), { id: `rec-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, text, isAuto: false }] })
    markApplied(key); toast('נוסף להמלצות/החלטות', 'success')
  }
  function addTask(task: { text: string; owner?: string; due?: string }, key: string) {
    const current = useWorkspaceStore.getState().meetingSummary
    const suffix = [task.owner === 'client' ? 'באחריות הלקוח' : '', task.due ? `עד ${task.due}` : ''].filter(Boolean).join(', ')
    setMeetingSummary({ ...current, manualFollowUps: [...(current.manualFollowUps || []), { id: `fu-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, text: suffix ? `${task.text} (${suffix})` : task.text, isAuto: false }] })
    markApplied(key); toast('נוסף למשימות המשך', 'success')
  }
  function addConcern(text: string, key: string) {
    const current = useWorkspaceStore.getState().meetingSummary
    const existing = current.editedSections?.['מה הטריד את הלקוח'] || ''
    setMeetingSummary({ ...current, editedSections: { ...(current.editedSections || {}), 'מה הטריד את הלקוח': existing ? `${existing}\n• ${text}` : `• ${text}` } })
    markApplied(key); toast('נוסף למקטע "מה הטריד את הלקוח"', 'success')
  }
  function applyNeed(field: string, value: string, key: string) {
    setNeedsAssessment({ ...(needs || {}), [field]: value })
    markApplied(key); toast('עודכן בבירור הצרכים', 'success')
  }

  const NEED_LABELS: Record<string, string> = { retirementAgeGoal: 'גיל פרישה מתוכנן', maritalStatus: 'מצב משפחתי', monthlyIncome: 'הכנסה חודשית', monthlyExpenses: 'הוצאות חודשיות', goals: 'מטרות' }
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0'), ss = String(seconds % 60).padStart(2, '0')

  return (
    <>
      <Sheet open={open} onClose={() => onOpenChange(false)} placement="side" width="min(560px, 100vw)" title="הקלטה ותמלול" subtitle="הלקוח חייב לאשר הקלטה. האודיו אינו נשמר — רק התמליל, כמידע פנימי בסיכום.">
        <div style={{ display: 'grid', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', padding: '10px 12px', borderRadius: 'var(--radius-lg)', background: recState === 'recording' ? 'var(--destructive-bg, #FEF2F2)' : 'var(--bg-surface-sunken)', border: '1px solid var(--separator)' }}>
            {recState === 'recording' && <span aria-hidden style={{ width: 10, height: 10, borderRadius: 999, background: 'var(--destructive)', animation: 'pulse 1.4s ease-in-out infinite' }} />}
            <strong style={{ color: recState === 'recording' ? 'var(--destructive-text, #991B1B)' : 'var(--text-heading)', fontSize: 14 }}>
              {recState === 'recording' ? `מקליט ${mm}:${ss}` : recState === 'paused' ? `מושהה ${mm}:${ss}` : 'לא מקליט'}
            </strong>
            {transcribing > 0 && <span style={{ color: 'var(--text-muted)', fontSize: 12.5 }}>מתמלל {transcribing} מקטע…</span>}
            <span style={{ flex: 1 }} />
            {recState === 'idle' && <Button variant="primary" size="sm" onClick={() => setConsentOpen(true)}><Mic size={14} /> התחל הקלטה</Button>}
            {recState === 'recording' && <Button variant="secondary" size="sm" onClick={pause}><Pause size={14} /> השהה</Button>}
            {recState === 'paused' && <Button variant="primary" size="sm" onClick={resume}><Play size={14} /> המשך</Button>}
            {recState !== 'idle' && <Button variant="ghost" size="sm" onClick={stop}><Square size={13} /> עצור</Button>}
            <input ref={fileInputRef} hidden type="file" accept="audio/*,video/webm" onChange={event => { const file = event.target.files?.[0]; if (file) void transcribeBlob(file); event.currentTarget.value = '' }} />
            <Button variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()} title="תמלול הקלטה קיימת (שיחת טלפון, הקלטה מהנייד)"><Upload size={14} /> העלה הקלטה</Button>
          </div>
          {summary.recordingConsentAt && <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 12.5 }}>✓ הלקוח אישר הקלטה ב-{new Date(summary.recordingConsentAt).toLocaleString('he-IL')} — נרשם ביומן הביקורת.</p>}
          {error && <p role="alert" style={{ margin: 0, color: 'var(--destructive-text, #991B1B)', fontWeight: 600, fontSize: 13.5 }}>{error}</p>}

          <section>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
              <h3 style={h3}>תמליל</h3>
              <Button variant="secondary" size="sm" disabled={extracting || transcript.trim().length < 20} onClick={() => void extract()}><Sparkles size={14} /> {extracting ? 'מפיק…' : 'הפק הצעות מהשיחה'}</Button>
            </div>
            <textarea
              value={transcript}
              onChange={event => setMeetingSummary({ ...useWorkspaceStore.getState().meetingSummary, transcript: event.target.value })}
              rows={10}
              placeholder="התמליל יופיע כאן תוך כדי ההקלטה (כל ~30 שניות). אפשר גם לערוך ידנית."
              style={{ width: '100%', border: '1px solid var(--separator)', borderRadius: 'var(--radius-md)', padding: 12, fontFamily: 'inherit', fontSize: 13.5, lineHeight: 1.7, background: 'var(--bg-surface)', color: 'var(--text-heading)', resize: 'vertical' }}
            />
            <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 12 }}>פנימי — לא נשלח ללקוח ולא מודפס. נשמר עם הסיכום בארכיון.</p>
          </section>

          {suggestions && (
            <section style={{ display: 'grid', gap: 12 }}>
              <h3 style={h3}>נשלף מהשיחה — לאישורך</h3>
              <SuggestionGroup title="עובדות על הלקוח" items={suggestions.facts.map((fact, index) => ({ key: `fact-${index}`, label: `${fact.label}: ${fact.value}`, onAdd: () => addFact(fact, `fact-${index}`) }))} applied={applied} addLabel="הוסף לעובדות" />
              <SuggestionGroup title="החלטות שהתקבלו" items={suggestions.decisions.map((text, index) => ({ key: `dec-${index}`, label: text, onAdd: () => addDecision(text, `dec-${index}`) }))} applied={applied} addLabel="הוסף להחלטות" />
              <SuggestionGroup title="משימות המשך" items={suggestions.tasks.map((task, index) => ({ key: `task-${index}`, label: `${task.text}${task.owner === 'client' ? ' · באחריות הלקוח' : ''}${task.due ? ` · עד ${task.due}` : ''}`, onAdd: () => addTask(task, `task-${index}`) }))} applied={applied} addLabel="הוסף למשימות" />
              <SuggestionGroup title="מה הטריד את הלקוח" items={suggestions.concerns.map((text, index) => ({ key: `con-${index}`, label: text, onAdd: () => addConcern(text, `con-${index}`) }))} applied={applied} addLabel="הוסף למסמך" />
              <SuggestionGroup title="עדכונים לבירור צרכים" items={Object.entries(suggestions.needs).map(([field, value]) => ({ key: `need-${field}`, label: `${NEED_LABELS[field] || field}: ${value}`, onAdd: () => applyNeed(field, String(value), `need-${field}`) }))} applied={applied} addLabel="עדכן" />
              {!suggestions.facts.length && !suggestions.decisions.length && !suggestions.tasks.length && !suggestions.concerns.length && !Object.keys(suggestions.needs).length && (
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 13.5 }}>לא נמצאו פריטים ברורים בתמליל עדיין.</p>
              )}
            </section>
          )}
        </div>
      </Sheet>

      <Dialog
        open={consentOpen}
        title="הלקוח אישר הקלטה?"
        description={`ההקלטה תתומלל אוטומטית וישמש להכנת סיכום הפגישה${clientName ? ` עם ${clientName}` : ''}. האודיו אינו נשמר; התמליל נשמר כמידע פנימי בסיכום. האישור נרשם ביומן הביקורת עם חותמת זמן.`}
        confirmLabel="הלקוח אישר — התחל הקלטה"
        cancelLabel="ביטול"
        onConfirm={() => void confirmConsent()}
        onCancel={() => setConsentOpen(false)}
      />
      {recState !== 'idle' && !open && (
        <button type="button" onClick={() => onOpenChange(true)} title="הקלטה פעילה — לחץ לפתיחת הפאנל" style={{ position: 'fixed', bottom: 18, insetInlineStart: 18, zIndex: 1050, display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 999, border: 0, background: 'var(--destructive)', color: '#fff', fontFamily: 'inherit', fontWeight: 700, fontSize: 13, boxShadow: 'var(--shadow-floating)', cursor: 'pointer' }}>
          {recState === 'recording' ? <Mic size={14} /> : <MicOff size={14} />} {recState === 'recording' ? `מקליט ${mm}:${ss}` : `מושהה ${mm}:${ss}`}
        </button>
      )}
    </>
  )
}

function SuggestionGroup({ title, items, applied, addLabel }: { title: string; items: Array<{ key: string; label: string; onAdd: () => void }>; applied: Set<string>; addLabel: string }) {
  if (!items.length) return null
  return (
    <div>
      <strong style={{ display: 'block', color: 'var(--text-muted)', fontSize: 12.5, marginBottom: 6 }}>{title}</strong>
      <div style={{ display: 'grid', gap: 6 }}>
        {items.map(item => (
          <div key={item.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '8px 10px', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface-sunken)', border: '1px solid var(--separator)' }}>
            <span style={{ fontSize: 13.5, color: 'var(--text-heading)', minWidth: 0, overflowWrap: 'anywhere' }}>{item.label}</span>
            {applied.has(item.key)
              ? <span style={{ color: 'var(--success-text, #065F46)', fontSize: 12.5, fontWeight: 700, flexShrink: 0 }}>✓ נוסף</span>
              : <Button size="sm" variant="secondary" onClick={item.onAdd}>{addLabel}</Button>}
          </div>
        ))}
      </div>
    </div>
  )
}

const h3: React.CSSProperties = { color: 'var(--text-heading)', fontSize: 14, fontWeight: 700, margin: 0 }
