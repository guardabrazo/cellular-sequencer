import * as Tone from 'tone';
import { useStore } from '../store';

// Import samples
import kickSample from '../assets/samples/kick.wav';
import snareSample from '../assets/samples/snare.wav';
import chSample from '../assets/samples/ch.wav';
import ohSample from '../assets/samples/oh.wav';
import ltSample from '../assets/samples/lt.wav';
import mtSample from '../assets/samples/mt.wav';
import clapSample from '../assets/samples/clap.wav';
import rideSample from '../assets/samples/ride.wav';

// Effects
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

// Sample-based Players - Connect to Delay (Chain: Player -> Delay -> Reverb -> Out)
const kick = new Tone.Player(kickSample).connect(delay);
const snare = new Tone.Player(snareSample).connect(delay);
const hihatClosed = new Tone.Player(chSample).connect(delay);
const hihatOpen = new Tone.Player(ohSample).connect(delay);
const tomLow = new Tone.Player(ltSample).connect(delay);
const tomMid = new Tone.Player(mtSample).connect(delay);
const clap = new Tone.Player(clapSample).connect(delay);
const ride = new Tone.Player(rideSample).connect(delay);

const instruments = [kick, snare, hihatClosed, hihatOpen, tomLow, tomMid, clap, ride];
const midiNotes = [36, 38, 42, 46, 41, 45, 39, 51]; // General MIDI mapping

let midiOutput: MIDIOutput | null = null;

export const initAudio = async () => {
    // Optimize for low latency to improve MIDI sync
    // Tone.context.latencyHint = 'interactive'; // Cannot be set after context creation
    Tone.context.lookAhead = 0.05; // Reduce lookahead (default is 0.1)

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
                    // Players use .start() method with time parameter
                    instrument.start(time);
                }
            }

            // MIDI (Channel 1 / 0x90)
            if (midiEnabled && midiOutput) {
                const note = midiNotes[trackIndex];

                // Calculate precise timestamp
                // Try to use getOutputTimestamp for better synchronization if available
                // Fallback to performance.now() + delta if not supported
                let midiTimestamp;
                const rawContext = Tone.context.rawContext as AudioContext;

                if (typeof rawContext.getOutputTimestamp === 'function') {
                    const timestamp = rawContext.getOutputTimestamp();
                    const performanceTime = timestamp.performanceTime || performance.now();
                    const contextTime = timestamp.contextTime || Tone.now();
                    midiTimestamp = performanceTime + (time - contextTime) * 1000;
                } else {
                    // Fallback
                    const now = Tone.now();
                    midiTimestamp = performance.now() + (time - now) * 1000;
                }

                midiOutput.send([0x90, note, 0x7f], midiTimestamp); // Note On

                // Note Off after 100ms
                midiOutput.send([0x80, note, 0x40], midiTimestamp + 100);
            }
        }
    });

}, "16n");
