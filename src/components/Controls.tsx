import React, { useEffect } from 'react';
import { useStore } from '../store';
import { startSequencer, stopSequencer, setBpm as setToneBpm, initAudio } from '../utils/audioEngine';
import { Play, Square, Trash2, Shuffle, Music, Radio, Pause } from 'lucide-react';

const Controls: React.FC = () => {
    const {
        isPlaying,
        setIsPlaying,
        bpm,
        setBpm,
        randomize,
        clear,
        midiEnabled,
        toggleMidi,
        evolutionSpeed,
        isEvolutionPaused,
        toggleEvolutionPause,
        algorithm,
        setAlgorithm,
        playbackDirection,
        setPlaybackDirection,
        effects,
        setEffectParam,
        theme,
        setTheme
    } = useStore();

    useEffect(() => {
        setToneBpm(bpm);
    }, [bpm]);

    const handlePlayToggle = async () => {
        if (!isPlaying) {
            await initAudio();
            startSequencer();
            setIsPlaying(true);
        } else {
            stopSequencer();
            setIsPlaying(false);
        }
    };

    return (
        <div className="controls">
            <div className="section">
                <h3>TRANSPORT</h3>
                <div className="row">
                    <button onClick={handlePlayToggle} className={isPlaying ? 'active' : ''}>
                        {isPlaying ? <Square size={14} /> : <Play size={14} />}
                    </button>
                    <div className="slider-group">
                        <label>BPM: {bpm}</label>
                        <input
                            type="range"
                            min="60"
                            max="200"
                            value={bpm}
                            onChange={(e) => setBpm(Number(e.target.value))}
                        />
                    </div>
                    <select
                        value={playbackDirection}
                        onChange={(e) => setPlaybackDirection(e.target.value as any)}
                        title="Playback Direction"
                    >
                        <option value="Forward">FWD</option>
                        <option value="Reverse">REV</option>
                        <option value="PingPong">PING</option>
                    </select>
                </div>
            </div>

            <div className="section">
                <h3>EVOLUTION</h3>
                <div className="row">
                    <button onClick={toggleEvolutionPause} className={isEvolutionPaused ? 'active' : ''} title="Freeze Evolution">
                        <Pause size={14} />
                    </button>
                    <select
                        value={algorithm}
                        onChange={(e) => setAlgorithm(e.target.value as any)}
                        title="Algorithm"
                    >
                        <option value="GameOfLife">GOL</option>
                        <option value="HighLife">HIGH</option>
                    </select>
                    <div className="slider-group">
                        <label>SPEED: {evolutionSpeed}</label>
                        <input
                            type="range"
                            min="4"
                            max="64"
                            step="4"
                            value={evolutionSpeed}
                            onChange={(e) => useStore.setState({ evolutionSpeed: Number(e.target.value) })}
                        />
                    </div>
                </div>
            </div>

            <div className="section">
                <h3>GRID</h3>
                <div className="row">
                    <button onClick={randomize} title="Randomize">
                        <Shuffle size={14} />
                    </button>
                    <button onClick={clear} title="Clear">
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>

            <div className="section">
                <h3>EFFECTS</h3>
                <div className="row">
                    <div className="slider-group">
                        <label>REV WET</label>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={effects.reverb.wet}
                            onChange={(e) => setEffectParam('reverb', 'wet', Number(e.target.value))}
                        />
                    </div>
                    <div className="slider-group">
                        <label>REV SIZE</label>
                        <input
                            type="range"
                            min="0"
                            max="0.95"
                            step="0.05"
                            value={effects.reverb.decay}
                            onChange={(e) => setEffectParam('reverb', 'decay', Number(e.target.value))}
                        />
                    </div>
                    <div className="slider-group">
                        <label>DLY WET</label>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={effects.delay.wet}
                            onChange={(e) => setEffectParam('delay', 'wet', Number(e.target.value))}
                        />
                    </div>
                </div>
            </div>

            <div className="section">
                <h3>OUTPUT</h3>
                <div className="row">
                    <button onClick={toggleMidi} className={midiEnabled ? 'active' : ''} title="Toggle MIDI">
                        {midiEnabled ? <Radio size={14} /> : <Music size={14} />}
                    </button>
                </div>
            </div>

            <div className="section">
                <h3>THEME</h3>
                <div className="row">
                    <select
                        value={theme}
                        onChange={(e) => setTheme(e.target.value as any)}
                        title="Theme"
                    >
                        <option value="dark">DARK</option>
                        <option value="light">LIGHT</option>
                    </select>
                </div>
            </div>
        </div>
    );
};

export default Controls;
