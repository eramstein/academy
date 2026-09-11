import type { EventTemplate } from '@/lib/_model';

export async function saveEventTemplate(event: EventTemplate): Promise<EventTemplate> {
  const response = await fetch('/api/save-event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(event),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error ?? 'Failed to save event');
  }

  return (payload.event as EventTemplate) ?? event;
}
