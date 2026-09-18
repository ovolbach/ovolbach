import { defineCollection } from 'astro:content';
import { file } from 'astro/loaders';
import {
  candidateSchema, candidacySchema, claimSchema, districtSchema, electionSchema,
  researchCoverageSchema, sourceSchema,
} from './lib/schemas';

const candidates = defineCollection({ loader: file('src/data/candidates.json'), schema: candidateSchema });
const candidacies = defineCollection({ loader: file('src/data/candidacies.json'), schema: candidacySchema });
const claims = defineCollection({ loader: file('src/data/claims.json'), schema: claimSchema });
const sources = defineCollection({ loader: file('src/data/sources.json'), schema: sourceSchema });
const districts = defineCollection({ loader: file('src/data/districts.json'), schema: districtSchema });
const elections = defineCollection({ loader: file('src/data/elections.json'), schema: electionSchema });
const researchCoverage = defineCollection({ loader: file('src/data/research-coverage.json'), schema: researchCoverageSchema });

export const collections = { candidates, candidacies, claims, sources, districts, elections, researchCoverage };
