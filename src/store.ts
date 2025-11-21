import { create } from 'zustand';
import { createEmptyGrid, evolveGrid, randomizeGrid, Algorithm, COLS } from './utils/gameOfLife';

interface AppState {
    grid: boolean[][];
    isPlaying: boolean;
    bpm: number;
    currentStep: number;
    evolutionSpeed: number; // Steps per evolution
    stepsSinceLastEvolution: number;
    midiEnabled: boolean;

    // V2 Features
    isEvolutionPaused: boolean;
    algorithm: Algorithm;
    playbackDirection: 'Forward' | 'Reverse' | 'PingPong';
    pingPongDirection: 'Forward' | 'Reverse'; // Internal state for PingPong
    trackMutes: boolean[];
    trackSolos: boolean[];
    effects: {
        reverb: { wet: number; decay: number };
        delay: { wet: number; time: string; feedback: number };
    };

    // Actions
    toggleCell: (row: number, col: number) => void;
    setGrid: (grid: boolean[][]) => void;
    randomize: () => void;
    clear: () => void;
    setIsPlaying: (isPlaying: boolean) => void;
    togglePlay: () => void; // For space bar
    setBpm: (bpm: number) => void;
    setCurrentStep: (step: number) => void;
    toggleMidi: () => void;
    tick: () => void; // Called every sequencer step

    // V2 Actions
    toggleEvolutionPause: () => void;
    setAlgorithm: (algo: Algorithm) => void;
    setPlaybackDirection: (dir: 'Forward' | 'Reverse' | 'PingPong') => void;
    toggleMute: (trackIndex: number) => void;
    toggleSolo: (trackIndex: number) => void;
    setEffectParam: (effect: 'reverb' | 'delay', param: string, value: number | string) => void;
}

export const useStore = create<AppState>((set) => ({
    grid: createEmptyGrid(),
    isPlaying: false,
    bpm: 120,
    currentStep: 0,
    evolutionSpeed: 16, // Evolve every bar (16 steps) by default
    stepsSinceLastEvolution: 0,
    midiEnabled: false,

    isEvolutionPaused: false,
    algorithm: 'GameOfLife',
    playbackDirection: 'Forward',
    pingPongDirection: 'Forward',
    trackMutes: Array(8).fill(false),
    trackSolos: Array(8).fill(false),
    effects: {
        reverb: { wet: 0, decay: 0.6 },
        delay: { wet: 0, time: '8n', feedback: 0.5 }
    },

    toggleCell: (row, col) => set((state) => {
        const newGrid = state.grid.map((r, rIndex) =>
            rIndex === row ? r.map((c, cIndex) => cIndex === col ? !c : c) : r
        );
        return { grid: newGrid };
    }),

    setGrid: (grid) => set({ grid }),

    randomize: () => set(() => ({
        grid: randomizeGrid()
    })),

    clear: () => set(() => ({
        grid: createEmptyGrid()
    })),

    setIsPlaying: (isPlaying) => set({ isPlaying }),

    togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),

    setBpm: (bpm) => set({ bpm }),

    setCurrentStep: (currentStep) => set({ currentStep }),

    toggleMidi: () => set((state) => ({ midiEnabled: !state.midiEnabled })),

    toggleEvolutionPause: () => set((state) => ({ isEvolutionPaused: !state.isEvolutionPaused })),

    setAlgorithm: (algorithm) => set({ algorithm }),

    setPlaybackDirection: (playbackDirection) => set({ playbackDirection }),

    toggleMute: (trackIndex) => set((state) => {
        const newMutes = [...state.trackMutes];
        newMutes[trackIndex] = !newMutes[trackIndex];
        return { trackMutes: newMutes };
    }),

    toggleSolo: (trackIndex) => set((state) => {
        const newSolos = [...state.trackSolos];
        newSolos[trackIndex] = !newSolos[trackIndex];
        return { trackSolos: newSolos };
    }),

    setEffectParam: (effect, param, value) => set((state) => ({
        effects: {
            ...state.effects,
            [effect]: {
                ...state.effects[effect],
                [param]: value
            }
        }
    })),

    tick: () => set((state) => {
        let nextStep = state.currentStep;
        let nextPingPongDir = state.pingPongDirection;

        // Playback Direction Logic
        if (state.playbackDirection === 'Forward') {
            nextStep = (state.currentStep + 1) % COLS;
        } else if (state.playbackDirection === 'Reverse') {
            nextStep = (state.currentStep - 1 + COLS) % COLS;
        } else if (state.playbackDirection === 'PingPong') {
            if (state.pingPongDirection === 'Forward') {
                if (state.currentStep === COLS - 1) {
                    nextStep = COLS - 2;
                    nextPingPongDir = 'Reverse';
                } else {
                    nextStep = state.currentStep + 1;
                }
            } else {
                if (state.currentStep === 0) {
                    nextStep = 1;
                    nextPingPongDir = 'Forward';
                } else {
                    nextStep = state.currentStep - 1;
                }
            }
        }

        let nextGrid = state.grid;
        let nextStepsSinceLastEvolution = state.stepsSinceLastEvolution + 1;

        if (!state.isEvolutionPaused && nextStepsSinceLastEvolution >= state.evolutionSpeed) {
            nextGrid = evolveGrid(state.grid, state.algorithm);
            nextStepsSinceLastEvolution = 0;
        }

        return {
            currentStep: nextStep,
            grid: nextGrid,
            stepsSinceLastEvolution: nextStepsSinceLastEvolution,
            pingPongDirection: nextPingPongDir
        };
    }),
}));
