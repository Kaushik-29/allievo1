import React, { createContext, useContext, useReducer, useCallback } from 'react';
import api from '../utils/api';

const AppContext = createContext(null);

// Determine initial tab based on auth state
const storedWorker = JSON.parse(localStorage.getItem('gs_worker') || 'null');
const storedToken = localStorage.getItem('gs_token') || null;

const initialState = {
  // Auth
  worker: storedWorker,
  token: storedToken,
  isLoading: false,

  // Policy
  activePolicy: null,
  claimHistory: [],

  // Disruption monitor
  disruptionStates: {
    'Heavy Rain': { status: 'NORMAL', currentValue: '12mm/hr', lastUpdated: null },
    'Extreme Heat': { status: 'NORMAL', currentValue: '38°C', lastUpdated: null },
    'Severe AQI': { status: 'NORMAL', currentValue: 'AQI 145', lastUpdated: null },
    'Curfew/Strike': { status: 'NORMAL', currentValue: 'All clear', lastUpdated: null },
    'Platform Outage': { status: 'NORMAL', currentValue: '8% drop', lastUpdated: null },
  },

  // AI content
  workerInsight: null,
  riskProfile: null,
  predictions: [],

  // UI — if worker is logged in, start on dashboard instead of onboarding
  currentTab: storedWorker ? 'dashboard' : 'onboarding',
  processingClaim: null,
  paymentAnimation: null,
  aiDebugData: {},
  adminUnlocked: false,
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_AUTH':
      return { ...state, worker: action.payload.worker, token: action.payload.token };
    case 'LOGOUT':
      return { ...state, worker: null, token: null, activePolicy: null, claimHistory: [], currentTab: 'onboarding', adminUnlocked: false };
    case 'SET_TAB':
      return { ...state, currentTab: action.payload };
    case 'SET_RISK_PROFILE':
      return { ...state, riskProfile: action.payload };
    case 'SET_ACTIVE_POLICY':
      return { ...state, activePolicy: action.payload };
    case 'SET_CLAIM_HISTORY':
      return { ...state, claimHistory: action.payload };
    case 'ADD_CLAIM':
      return { ...state, claimHistory: [action.payload, ...state.claimHistory] };
    case 'SET_DISRUPTION_STATE':
      return {
        ...state,
        disruptionStates: {
          ...state.disruptionStates,
          [action.payload.type]: action.payload.state,
        },
      };
    case 'SET_WORKER_INSIGHT':
      return { ...state, workerInsight: action.payload };
    case 'SET_PREDICTIONS':
      return { ...state, predictions: action.payload };
    case 'SET_PROCESSING_CLAIM':
      return { ...state, processingClaim: action.payload };
    case 'SET_PAYMENT_ANIMATION':
      return { ...state, paymentAnimation: action.payload };
    case 'SET_AI_DEBUG':
      return { ...state, aiDebugData: { ...state.aiDebugData, [action.payload.key]: action.payload.data } };
    case 'SET_ADMIN_UNLOCKED':
      return { ...state, adminUnlocked: true };
    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const login = useCallback(async (phone, password) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const res = await api.post('/auth/login', { phone, password });
      const { worker, token } = res.data;
      localStorage.setItem('gs_token', token);
      localStorage.setItem('gs_worker', JSON.stringify(worker));
      dispatch({ type: 'SET_AUTH', payload: { worker, token } });
      dispatch({ type: 'SET_TAB', payload: 'dashboard' });
      return res.data;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const register = useCallback(async (formData) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const res = await api.post('/auth/register', formData);
      const { worker, token, riskProfile, aiDebug } = res.data;
      localStorage.setItem('gs_token', token);
      localStorage.setItem('gs_worker', JSON.stringify(worker));
      dispatch({ type: 'SET_AUTH', payload: { worker, token } });
      dispatch({ type: 'SET_RISK_PROFILE', payload: riskProfile });
      if (aiDebug) dispatch({ type: 'SET_AI_DEBUG', payload: { key: 'riskScoring', data: aiDebug } });
      return res.data;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('gs_token');
    localStorage.removeItem('gs_worker');
    dispatch({ type: 'LOGOUT' });
  }, []);

  const value = { state, dispatch, login, register, logout };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
