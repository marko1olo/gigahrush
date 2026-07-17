import { performance } from 'perf_hooks';
import { EntityIndex, ENTITY_MASK_ITEM_DROP } from './src/systems/entity_index.ts';
import { Entity, EntityType } from './src/core/types.ts';

const BUCKETS_PER_AXIS = 64; // Assuming 64, we will need to mock some things if we can't run it easily.
