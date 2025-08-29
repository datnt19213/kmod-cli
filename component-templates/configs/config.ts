"use client";
import {
  createFeatureDefaults,
  FeatureConfig,
  FlagMap,
} from './feature-config';
import { FeatureKey } from './keys';

const disableFlags: FlagMap<FeatureKey> = {
  [FeatureKey.HomeCreateProduct]: true,
  [FeatureKey.HomeCreateCustomer]: true,
  [FeatureKey.HomeCreateOrder]: false,
  [FeatureKey.HomeCreateInvoice]: true,
  [FeatureKey.HomeCreatePayment]: true,
}



const defaultFlags = createFeatureDefaults(FeatureKey);

export const {
  Feature,
  FeatureLock,
  FeatureProvider,
  useFeature,
  useFlags,
  refresh,
  setFlags,
  sources,
} = FeatureConfig({
  keys: { ...FeatureKey },
  initialFlags: {...defaultFlags, ...disableFlags},
});
