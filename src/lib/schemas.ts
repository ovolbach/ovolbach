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
export type ElectionHistoryOffice =
  | 'mayor'
  | 'municipal_council'
  | 'regional_chair'
  | 'regional_council'
  | 'national_council'
  | 'european_parliament'
  | 'president';
export type ElectionHistoryOutcome = 'elected' | 'not_elected' | 'substitute' | 'withdrawn';

export interface ElectionHistoryRecord {
  contestId: string;
  office: ElectionHistoryOffice;
  outcome: ElectionHistoryOutcome;
}

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
  contestId: string;
  districtId?: string;
  ballotNumber: number;
  ageAtElection: number;
  occupationOfficial: string;
  displayNameOfficial?: string;
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
  election?: ElectionHistoryRecord;
  sourceIds: string[];
  checkedAt: string;
}

export interface Source {
  id: string;
  url: string;
  title: string;
  publisher: string;
  author?: string | undefined;
  publishedAt?: string | undefined;
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
  contestId: string;
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
  campaignFinance: CampaignFinance[];
  financeParties: FinanceParty[];
}

export interface ValidationIssue {
  code: string;
  recordId: string;
  referenceId?: string;
}

const requiredString = z.string().trim().min(1);
export const isoDate = requiredString.refine(
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

export const electionHistoryRecordSchema = z.object({
  contestId: id,
  office: z.enum([
    'mayor',
    'municipal_council',
    'regional_chair',
    'regional_council',
    'national_council',
    'european_parliament',
    'president',
  ]),
  outcome: z.enum(['elected', 'not_elected', 'substitute', 'withdrawn']),
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
  contestId: id,
  districtId: id.optional(),
  ballotNumber: z.number().int().positive(),
  ageAtElection: z.number().int().nonnegative(),
  occupationOfficial: requiredString,
  displayNameOfficial: requiredString.optional(),
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
  election: electionHistoryRecordSchema.optional(),
  sourceIds,
  checkedAt: isoDate,
}).strict();

export const sourceSchema = z.object({
  id,
  url: requiredString.refine((value) => isSafeOutboundSourceUrl(value) && new URL(value).protocol === 'https:', 'Expected absolute HTTPS URL without credentials'),
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
  contestId: id,
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

const financeIdentitySchema = z.object({
  attribute: z.enum(['municipality', 'office', 'election', 'occupation', 'campaign']),
  value: requiredString,
  sourceIds,
}).strict();
const financeUrl = requiredString.refine((value) => isSafeOutboundSourceUrl(value) && new URL(value).protocol === 'https:', 'Expected safe HTTPS account URL');
const financeAccountSchema = z.discriminatedUnion('status', [
  z.object({ status: z.literal('verified'), url: financeUrl, sourceIds, identity: z.array(financeIdentitySchema).min(2) }).strict(),
  z.object({ status: z.literal('not_listed'), sourceIds }).strict(),
  z.object({ status: z.literal('unverified'), sourceIds, reason: requiredString }).strict(),
]);
export const campaignFinanceSchema = z.object({
  id, candidateId: id, electionDate: isoDate, checkedAt: isoDate, sourceIds,
  legalSourceIds: sourceIds,
  ownExpenses: z.enum(['unknown', 'yes', 'no']),
  expenseSourceIds: z.array(id),
  campaignOperator: z.enum(['unknown', 'candidate', 'party', 'both', 'none']),
  operatorSourceIds: z.array(id),
  otherCandidacies: z.enum(['not_exhaustive', 'exhaustive']),
  candidacySearchNote: requiredString,
  headCandidacies: z.array(z.object({
    office: z.enum(['mayor', 'region-chair']), locality: requiredString,
    population: z.number().int().nonnegative().optional(), independent: z.boolean(), sourceIds,
  }).strict().superRefine((head, ctx) => {
    if (head.office === 'mayor' && head.population === undefined) ctx.addIssue({ code: 'custom', message: 'Mayor duty needs verified population' });
  })),
  partyIds: z.array(id),
  account: financeAccountSchema,
  reportSourceId: id.optional(),
}).strict().superRefine((record, ctx) => {
  if (record.ownExpenses !== 'unknown' && record.expenseSourceIds.length === 0) ctx.addIssue({ code: 'custom', message: 'Established expenses need evidence' });
  if (record.campaignOperator !== 'unknown' && record.operatorSourceIds.length === 0) ctx.addIssue({ code: 'custom', message: 'Established campaign operator needs evidence' });
  if (record.account.status === 'verified' && new Set(record.account.identity.map((item) => item.attribute)).size < 2) ctx.addIssue({ code: 'custom', message: 'Identity needs two distinct attributes beyond the name' });
});
export const financePartySchema = z.object({
  id, name: requiredString, electionDate: isoDate, checkedAt: isoDate, sourceIds,
  account: z.discriminatedUnion('status', [
    z.object({ status: z.literal('registered'), url: financeUrl }).strict(),
    z.object({ status: z.literal('not_listed') }).strict(),
  ]),
  reportSourceId: id.optional(),
}).strict();
export type CampaignFinance = z.infer<typeof campaignFinanceSchema>;
export type FinanceParty = z.infer<typeof financePartySchema>;
