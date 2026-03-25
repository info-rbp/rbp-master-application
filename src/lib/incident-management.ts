
import { firestore } from '@/firebase/server';

export type IncidentStatus = 'detected' | 'triaged' | 'mitigated' | 'resolved';

export interface Incident {
  id: string;
  status: IncidentStatus;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

const db = firestore;
const incidentsCollection = db.collection('incidents');

/**
 * Creates a new incident.
 * @param severity The severity of the incident.
 * @param description A description of the incident.
 * @returns The newly created incident.
 */
export async function createIncident(severity: 'critical' | 'high' | 'medium' | 'low', description: string): Promise<Incident> {
  const id = db.collection('_').doc().id;
  const now = new Date().toISOString();

  const incident: Incident = {
    id,
    status: 'detected',
    severity,
    description,
    createdAt: now,
    updatedAt: now,
  };

  await incidentsCollection.doc(id).set(incident);
  // In a real system, this would also trigger alerts to the on-call team.

  return incident;
}

/**
 * Updates the status of an incident.
 * @param id The ID of the incident to update.
 * @param status The new status of the incident.
 * @returns The updated incident.
 */
export async function updateIncidentStatus(id: string, status: IncidentStatus): Promise<Incident> {
  const incidentRef = incidentsCollection.doc(id);
  const incidentDoc = await incidentRef.get();

  if (!incidentDoc.exists) {
    throw new Error('Incident not found');
  }

  const updateData: any = {
    status,
    updatedAt: new Date().toISOString(),
  };

  if (status === 'resolved') {
    updateData.resolvedAt = new Date().toISOString();
  }

  await incidentRef.update(updateData);

  return { ...incidentDoc.data(), ...updateData } as Incident;
}
