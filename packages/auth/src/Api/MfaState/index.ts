import { createAction } from '@reduxjs/toolkit';
import { IDisableMfa, IVerifyMfa } from '@frontegg/rest-api';
import { MFAState, MFAStep } from './interfaces';
import { storeName, typeReducerForKey } from '../utils';

export * from './interfaces';

export const mfaState: MFAState = {
  step: MFAStep.verify,
  loading: false,
};

export const mfaStateReducers = {
  setMfaState: typeReducerForKey<MFAState>('mfaState'),
};

export const mfaActions = {
  resetMfaState: createAction(`${storeName}/resetMfaState`),
  enrollMfa: createAction(`${storeName}/enrollMfa`, (payload = {}) => ({ payload })),
  verifyMfa: createAction(`${storeName}/verifyMfa`, (payload: IVerifyMfa) => ({ payload })),
  disableMfa: createAction(`${storeName}/disableMfa`, (payload: IDisableMfa, callback?: () => void) => ({
    payload: { ...payload, callback },
  })),
};
