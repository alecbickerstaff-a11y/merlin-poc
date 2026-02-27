'use client';

import {
  createContext,
  useContext,
  useReducer,
  type Dispatch,
  type ReactNode,
} from 'react';
import type {
  CampaignConfig,
  ContentType,
  FlashcardConfig,
  WorkspaceState,
  WorkspaceView,
  Asset,
  Artifact,
  AssetFilters,
  GenerationJob,
  TrackerData,
} from '../../lib/types';
import { DEFAULT_CAMPAIGN_CONFIG } from '../../lib/brand-data';

// =============================================================================
// Default flashcard config
// =============================================================================

export const DEFAULT_FLASHCARD_CONFIG: FlashcardConfig = {
  pageSize: 'letter-landscape',
  brand: DEFAULT_CAMPAIGN_CONFIG.brand,
  systemGraphic: 'balanced',
  pages: [
    {
      id: 'page-1',
      label: 'Front',
      sections: [],
    },
  ],
  isi: DEFAULT_CAMPAIGN_CONFIG.isi,
  references: [],
};

// =============================================================================
// Actions
// =============================================================================

export type WorkspaceAction =
  | { type: 'SET_VIEW'; view: WorkspaceView }
  | { type: 'SET_CONTENT_TYPE'; contentType: ContentType }
  | { type: 'SET_EDITOR_CONFIG'; config: CampaignConfig }
  | { type: 'RESET_EDITOR_CONFIG' }
  | { type: 'SET_FLASHCARD_CONFIG'; config: FlashcardConfig }
  | { type: 'RESET_FLASHCARD_CONFIG' }
  | { type: 'SET_GENERATION_JOBS'; jobs: GenerationJob[] }
  | { type: 'UPDATE_GENERATION_JOB'; job: GenerationJob }
  | { type: 'SET_IS_GENERATING'; value: boolean }
  | { type: 'SET_ASSETS'; assets: Asset[] }
  | { type: 'ADD_ASSET'; asset: Asset }
  | { type: 'UPDATE_ASSET'; asset: Asset }
  | { type: 'REMOVE_ASSET'; id: string }
  | { type: 'SET_ARTIFACTS'; artifacts: Artifact[] }
  | { type: 'ADD_ARTIFACT'; artifact: Artifact }
  | { type: 'REMOVE_ARTIFACT'; id: string }
  | { type: 'SET_ASSET_FILTERS'; filters: AssetFilters }
  | { type: 'SET_TRACKER_DATA'; data: TrackerData | null };

// =============================================================================
// Initial state
// =============================================================================

const INITIAL_FILTERS: AssetFilters = {
  search: '',
  size: null,
  visualTone: null,
  messagingType: null,
  dateRange: { from: null, to: null },
};

export const INITIAL_STATE: WorkspaceState = {
  activeView: 'editor',
  activeContentType: 'banner',
  editorConfig: DEFAULT_CAMPAIGN_CONFIG,
  flashcardConfig: DEFAULT_FLASHCARD_CONFIG,
  generationJobs: [],
  isGenerating: false,
  assets: [],
  artifacts: [],
  assetFilters: INITIAL_FILTERS,
  trackerData: null,
};

// =============================================================================
// Reducer
// =============================================================================

function workspaceReducer(
  state: WorkspaceState,
  action: WorkspaceAction,
): WorkspaceState {
  switch (action.type) {
    case 'SET_VIEW':
      return { ...state, activeView: action.view };

    case 'SET_CONTENT_TYPE':
      return { ...state, activeContentType: action.contentType };

    case 'SET_EDITOR_CONFIG':
      return { ...state, editorConfig: action.config };

    case 'RESET_EDITOR_CONFIG':
      return { ...state, editorConfig: DEFAULT_CAMPAIGN_CONFIG };

    case 'SET_FLASHCARD_CONFIG':
      return { ...state, flashcardConfig: action.config };

    case 'RESET_FLASHCARD_CONFIG':
      return { ...state, flashcardConfig: DEFAULT_FLASHCARD_CONFIG };

    case 'SET_GENERATION_JOBS':
      return { ...state, generationJobs: action.jobs };

    case 'UPDATE_GENERATION_JOB':
      return {
        ...state,
        generationJobs: state.generationJobs.map((j) =>
          j.id === action.job.id ? action.job : j,
        ),
      };

    case 'SET_IS_GENERATING':
      return { ...state, isGenerating: action.value };

    case 'SET_ASSETS':
      return { ...state, assets: action.assets };

    case 'ADD_ASSET':
      return { ...state, assets: [action.asset, ...state.assets] };

    case 'UPDATE_ASSET':
      return {
        ...state,
        assets: state.assets.map((a) =>
          a.id === action.asset.id ? action.asset : a,
        ),
      };

    case 'REMOVE_ASSET':
      return {
        ...state,
        assets: state.assets.filter((a) => a.id !== action.id),
      };

    case 'SET_ARTIFACTS':
      return { ...state, artifacts: action.artifacts };

    case 'ADD_ARTIFACT':
      return { ...state, artifacts: [action.artifact, ...state.artifacts] };

    case 'REMOVE_ARTIFACT':
      return {
        ...state,
        artifacts: state.artifacts.filter((a) => a.id !== action.id),
      };

    case 'SET_ASSET_FILTERS':
      return { ...state, assetFilters: action.filters };

    case 'SET_TRACKER_DATA':
      return { ...state, trackerData: action.data };

    default:
      return state;
  }
}

// =============================================================================
// Context
// =============================================================================

interface WorkspaceContextValue {
  state: WorkspaceState;
  dispatch: Dispatch<WorkspaceAction>;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

// =============================================================================
// Provider
// =============================================================================

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(workspaceReducer, INITIAL_STATE);

  return (
    <WorkspaceContext.Provider value={{ state, dispatch }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

// =============================================================================
// Hook
// =============================================================================

export function useWorkspace(): WorkspaceContextValue {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return ctx;
}
