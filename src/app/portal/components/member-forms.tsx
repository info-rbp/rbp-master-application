'use client';

import { FormEvent, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export function SimpleRequestForm({ action, fields, disabledText, onSubmitted }: { action: string; fields: Array<{ key: string; label: string; type?: 'text' | 'datetime-local' }>; disabledText?: string; onSubmitted?: () => void }) {
  const [payload, setPayload] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch(action, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
      if (!response.ok) {
        const body = await response.json();
        throw new Error(body.error ?? 'Request failed');
      }
      setPayload({});
      onSubmitted?.();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Request failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (disabledText) {
    return <p className="text-sm text-muted-foreground">{disabledText}</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {fields.map((field) => (
        <div key={field.key}>
          <label className="text-sm">{field.label}</label>
          {field.key === 'description' || field.key === 'notes' || field.key === 'requestDescription' ? (
            <Textarea value={payload[field.key] ?? ''} onChange={(e) => setPayload((prev) => ({ ...prev, [field.key]: e.target.value }))} required />
          ) : (
            <Input type={field.type ?? 'text'} value={payload[field.key] ?? ''} onChange={(e) => setPayload((prev) => ({ ...prev, [field.key]: e.target.value }))} required />
          )}
        </div>
      ))}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit" disabled={submitting}>{submitting ? 'Submitting...' : 'Submit'}</Button>
    </form>
  );
}
