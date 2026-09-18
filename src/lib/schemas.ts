import { z } from 'zod';
import { isSafeOutboundSourceUrl } from './source-url';

export type LocalizedText = { sk: string; en?: string };
export type ElectionId = 'mayor' | 'city-council' | 'region-chair' | 'region-council';
export type ClaimCategory =
  | 'basic'
  | 'employment_business'
  | 'public_office'
  | 'previous_elections'
  | 'programme_statements'
  | 'asset_declarations'
  | 'media'
  | 'controversies';

export interface Candidate {
  id: string;
  slug: string;
  displayName: string;
  givenName: string;
  familyName: string;
  titlesBefore?: string;
  titlesAfter?: string;
  sourceIds: string[];
  images?: CandidateImage[];
}

export interface CandidateImage {
  url: string;
  license: 'CC0-1.0' | 'CC-BY-4.0' | 'permission';
  licenseSourceId: string;
  permissionSourceId?: string;
}

export interface Candidacy {
  id: string;
  candidateId: string;
  electionId: ElectionId;
  districtId?: string;
  ballotNumber: number;
  ageAtElection: number;
  occupationOfficial: string;
  affiliations: string[];
  independent: boolean;
  sourceIds: string[];
}

export interface Claim {
  id: string;
  candidateId: string;
  category: ClaimCategory;
  kind: 'fact' | 'quote' | 'election_result' | 'declaration' | 'media_report' | 'response' | 'official_outcome';
  label: LocalizedText;
  text: LocalizedText;
  period?: string;
  sourceIds: string[];
  checkedAt: string;
}

export interface Source {
  id: string;
  url: string;
  title: string;
  publisher: string;
  author?: string;
  publishedAt?: string;
  checkedAt: string;
  language: 'sk' | 'cs' | 'en';
  type: 'official' | 'candidate' | 'media';
}

export interface District {
  id: string;
  kind: 'city' | 'region';
  number: number;
  name: string;
  seats: number;
  areas: string[];
  pollingStations: Array<{ number: number; coverage: string; address: string; sourceId: string }>;
  sourceIds: string[];
}

export interface Election {
  id: ElectionId;
  title: LocalizedText;
  level: 'city' | 'region';
  maxSelections: number | 'district_seats';
  electionDate: string;
  sourceIds: string[];
}

export interface ResearchCoverage {
  id: string;
  candidateId: string;
  category: ClaimCategory;
  status: 'pending' | 'found' | 'searched_none' | 'not_applicable';
  checkedAt?: string;
  sourceIds: string[];
}

export interface GuideData {
  candidates: Candidate[];
  candidacies: Candidacy[];
  claims: Claim[];
  sources: Source[];
  districts: District[];
  elections: Election[];
  researchCoverage: ResearchCoverage[];
}

export interface ValidationIssue {
  code: string;
  recordId: string;
  referenceId?: string;
}

const requiredString = z.string().trim().min(1);
const isoDate = requiredString.refine(
  (value) => {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) return false;
    const [, year, month, day] = match;
    const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
    return date.getUTCFullYear() === Number(year)
      && date.getUTCMonth() === Number(month) - 1
      && date.getUTCDate() === Number(day);
  },
  'Expected ISO YYYY-MM-DD date',
);
const id = requiredString;
const sourceIds = z.array(id).min(1);
const candidateImageSchema = z.object({
  url: requiredString,
  license: z.enum(['CC0-1.0', 'CC-BY-4.0', 'permission']),
  licenseSourceId: id,
  permissionSourceId: id.optional(),
}).strict().superRefine((image, context) => {
  if (image.license === 'permission' && !image.permissionSourceId) {
    context.addIssue({ code: 'custom', path: ['permissionSourceId'], message: 'Permission images need permissionSourceId' });
  }
});

export const localizedTextSchema = z.object({
  sk: requiredString,
  en: requiredString.optional(),
}).strict();

export const candidateSchema = z.object({
  id,
  slug: requiredString,
  displayName: requiredString,
  givenName: requiredString,
  familyName: requiredString,
  titlesBefore: requiredString.optional(),
  titlesAfter: requiredString.optional(),
  sourceIds,
  images: z.array(candidateImageSchema).optional(),
}).strict();

export const candidacySchema = z.object({
  id,
  candidateId: id,
  electionId: z.enum(['mayor', 'city-council', 'region-chair', 'region-council']),
  districtId: id.optional(),
  ballotNumber: z.number().int().positive(),
  ageAtElection: z.number().int().nonnegative(),
  occupationOfficial: requiredString,
  affiliations: z.array(requiredString),
  independent: z.boolean(),
  sourceIds,
}).strict();

export const claimSchema = z.object({
  id,
  candidateId: id,
  category: z.enum(['basic', 'employment_business', 'public_office', 'previous_elections', 'programme_statements', 'asset_declarations', 'media', 'controversies']),
  kind: z.enum(['fact', 'quote', 'election_result', 'declaration', 'media_report', 'response', 'official_outcome']),
  label: localizedTextSchema,
  text: localizedTextSchema,
  period: requiredString.optional(),
  sourceIds,
  checkedAt: isoDate,
}).strict();

export const sourceSchema = z.object({
  id,
  url: requiredString.refine(isSafeOutboundSourceUrl, 'Expected absolute HTTP or HTTPS URL without credentials'),
  title: requiredString,
  publisher: requiredString,
  author: requiredString.optional(),
  publishedAt: isoDate.optional(),
  checkedAt: isoDate,
  language: z.enum(['sk', 'cs', 'en']),
  type: z.enum(['official', 'candidate', 'media']),
}).strict();

export const districtSchema = z.object({
  id,
  kind: z.enum(['city', 'region']),
  number: z.number().int().positive(),
  name: requiredString,
  seats: z.number().int().positive(),
  areas: z.array(requiredString),
  pollingStations: z.array(z.object({
    number: z.number().int().positive(),
    coverage: requiredString,
    address: requiredString,
    sourceId: id,
  }).strict()),
  sourceIds,
}).strict();

export const electionSchema = z.object({
  id: z.enum(['mayor', 'city-council', 'region-chair', 'region-council']),
  title: localizedTextSchema,
  level: z.enum(['city', 'region']),
  maxSelections: z.union([z.number().int().positive(), z.literal('district_seats')]),
  electionDate: isoDate,
  sourceIds,
}).strict();

export const researchCoverageSchema = z.object({
  id,
  candidateId: id,
  category: z.enum(['basic', 'employment_business', 'public_office', 'previous_elections', 'programme_statements', 'asset_declarations', 'media', 'controversies']),
  status: z.enum(['pending', 'found', 'searched_none', 'not_applicable']),
  checkedAt: isoDate.optional(),
  sourceIds: z.array(id),
}).strict();
