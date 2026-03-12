'use client';

import { FormEvent, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export function SimpleRequestForm({ action, fields, disabledText, onSubmitted }: { action: string; fields: Array<{ key: string; label: string; type?: 'text' | 'datetime-local'; options?: string[] }>; disabledText?: string; onSubmitted?: () => void }) {
  const [payload, setPayload] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch(action, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
      const body = await response.json();
      if (!response.ok || !body.ok) {
        throw new Error(body.error ?? 'Request failed');
      }
      setPayload({});
      setSuccess('Submitted successfully. You can track this request in your history below.');
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
          {field.options ? (
            <select className="h-10 w-full rounded-md border bg-background px-3" value={payload[field.key] ?? ''} onChange={(e) => setPayload((prev) => ({ ...prev, [field.key]: e.target.value }))} required>
              <option value="" disabled>Select an option</option>
              {field.options.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          ) : field.key === 'description' || field.key === 'notes' || field.key === 'requestDescription' || field.key === 'requestedOutcome' ? (
            <Textarea value={payload[field.key] ?? ''} onChange={(e) => setPayload((prev) => ({ ...prev, [field.key]: e.target.value }))} required />
          ) : (
            <Input type={field.type ?? 'text'} value={payload[field.key] ?? ''} onChange={(e) => setPayload((prev) => ({ ...prev, [field.key]: e.target.value }))} required />
          )}
        </div>
      ))}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-700">{success}</p> : null}
      <Button type="submit" disabled={submitting}>{submitting ? 'Submitting...' : 'Submit'}</Button>
    </form>
  );
}
