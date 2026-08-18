'use client'

import { useRouter } from 'next/navigation'
import { SegmentedControl } from '@/components/ui/SegmentedControl'

/**
 * Meetings and their summaries are the same thing at different times, so
 * they share ONE place in the sidebar ("פגישות") and switch here between
 * "קרובות והיסטוריה" and "ארכיון סיכומים" instead of two top-level screens.
 */
export function MeetingsSwitch({ active }: { active: 'meetings' | 'archive' }) {
  const router = useRouter()
  return (
    <div style={{ marginBottom: 14 }}>
      <SegmentedControl<'meetings' | 'archive'>
        value={active}
        onChange={next => router.push(next === 'meetings' ? '/?tab=meetings' : '/?tab=meeting-summaries')}
        options={[{ value: 'meetings', label: 'פגישות' }, { value: 'archive', label: 'ארכיון סיכומים' }]}
      />
    </div>
  )
}
