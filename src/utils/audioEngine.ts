import * as Tone from 'tone';
import { useStore } from '../store';

// Effects
// Effects
// Using Tone.Reverb for better quality
const reverb = new Tone.Reverb({
    decay: 2.5,
    preDelay: 0.2,
    wet: 0
}).toDestination();

const delay = new Tone.FeedbackDelay({
    delayTime: "8n",
    feedback: 0.5,
    wet: 0
}).connect(reverb);

// 909-like Synth setup - Connect to Delay (Chain: Inst -> Delay -> Reverb -> Out)
const kick = new Tone.MembraneSynth({
    pitchDecay: 0.05,
    octaves: 10,
    oscillator: { type: "sine" },
    envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 1.4 }
}).connect(delay);

const snare = new Tone.NoiseSynth({
    noise: { type: "white" },
    envelope: { attack: 0.001, decay: 0.2, sustain: 0 }
}).connect(delay);

const hihatClosed = new Tone.MetalSynth({
    envelope: { attack: 0.001, decay: 0.1, release: 0.01 },
    harmonicity: 5.1,
    modulationIndex: 32,
    resonance: 4000,
    octaves: 1.5
}).connect(delay);

const hihatOpen = new Tone.MetalSynth({
    envelope: { attack: 0.001, decay: 0.5, release: 0.1 },
    harmonicity: 5.1,
    modulationIndex: 32,
    resonance: 4000,
    octaves: 1.5
}).connect(delay);

const tomLow = new Tone.MembraneSynth({
    pitchDecay: 0.05,
    octaves: 4,
    oscillator: { type: "sine" },
    envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 1.4 }
}).connect(delay);

const tomMid = new Tone.MembraneSynth({
    pitchDecay: 0.05,
    octaves: 4,
    oscillator: { type: "sine" },
    envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 1.4 }
}).connect(delay);

const clap = new Tone.NoiseSynth({
    noise: { type: 'pink' },
    envelope: { attack: 0.001, decay: 0.3, sustain: 0 }
}).connect(delay);

const ride = new Tone.MetalSynth({
    envelope: { attack: 0.001, decay: 1, release: 0.1 },
    harmonicity: 5.1,
    modulationIndex: 32,
    resonance: 4000,
    octaves: 1.5
}).connect(delay);

const instruments = [kick, snare, hihatClosed, hihatOpen, tomLow, tomMid, clap, ride];
const midiNotes = [36, 38, 42, 46, 41, 45, 39, 51]; // General MIDI mapping

let midiOutput: MIDIOutput | null = null;

export const initAudio = async () => {
    await Tone.start();
    await reverb.generate(); // Generate impulse response for Reverb
    console.log('Audio ready');

    if (navigator.requestMIDIAccess) {
        try {
            const midiAccess = await navigator.requestMIDIAccess();
            const outputs = Array.from(midiAccess.outputs.values());
            if (outputs.length > 0) {
                midiOutput = outputs[0]; // Use first available output
                console.log('MIDI Output connected:', midiOutput.name);
            }
        } catch (err) {
            console.warn('MIDI Access failed:', err);
        }
    }
};

export const startSequencer = () => {
    Tone.Transport.start();
};

export const stopSequencer = () => {
    Tone.Transport.stop();
};

export const setBpm = (bpm: number) => {
    Tone.Transport.bpm.value = bpm;
};

// Main Loop
Tone.Transport.scheduleRepeat((time) => {
    const state = useStore.getState();

    // Update Effects
    reverb.wet.value = state.effects.reverb.wet;
    // reverb.decay cannot be modulated in real-time without glitches
    delay.wet.value = state.effects.delay.wet;
    delay.delayTime.value = state.effects.delay.time;
    delay.feedback.value = state.effects.delay.feedback;

    // Advance step in store
    state.tick();

    // Get updated state after tick
    const { grid, currentStep, midiEnabled, trackMutes, trackSolos } = useStore.getState();

    const anySolo = trackSolos.some(s => s);

    // Trigger Drums
    grid.forEach((row, trackIndex) => {
        const isMuted = trackMutes[trackIndex];
        const isSoloed = trackSolos[trackIndex];

        const shouldPlay = anySolo ? isSoloed : !isMuted;

        if (shouldPlay && row[currentStep]) {
            // Audio
            if (!midiEnabled) {
                const instrument = instruments[trackIndex];
                if (instrument) {
                    if (instrument instanceof Tone.MembraneSynth) {
                        instrument.triggerAttackRelease(trackIndex === 4 ? "F2" : trackIndex === 5 ? "A2" : "C1", "8n", time);
                    } else if (instrument instanceof Tone.MetalSynth) {
                        // MetalSynth expects (note, duration, time, velocity)
                        // We use different notes to tune the HiHats vs Ride if needed, 
                        // or just rely on their envelope. 
                        // CH/OH are tracks 2 and 3. Ride is track 7.
                        const note = trackIndex === 7 ? "C4" : "200Hz";
                        instrument.triggerAttackRelease(note, "32n", time, 0.3);
                    } else if (instrument instanceof Tone.NoiseSynth) {
                        instrument.triggerAttackRelease("8n", time);
                    }
                }
            }

            // MIDI (Channel 1 / 0x90)
            if (midiEnabled && midiOutput) {
                const note = midiNotes[trackIndex];
                midiOutput.send([0x90, note, 0x7f]); // Note On

                // Note Off after 100ms
                setTimeout(() => {
                    midiOutput?.send([0x80, note, 0x40]);
                }, 100);
            }
        }
    });

}, "16n");
