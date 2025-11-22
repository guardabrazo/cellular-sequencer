import { useEffect } from 'react';
import Grid from './components/Grid';
import Controls from './components/Controls';
import { useStore } from './store';
import { startSequencer, stopSequencer, initAudio } from './utils/audioEngine';

function App() {
    const { isPlaying, setIsPlaying } = useStore();

    useEffect(() => {
        const handleKeyDown = async (e: KeyboardEvent) => {
            if (e.code === 'Space') {
                e.preventDefault(); // Prevent scrolling

                // Logic to handle audio init if not started
                if (!isPlaying) {
                    await initAudio();
                    startSequencer();
                    setIsPlaying(true);
                } else {
                    stopSequencer();
                    setIsPlaying(false);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isPlaying, setIsPlaying]);

    const {
        grid, toggleCell, trackMutes, trackSolos, trackFreezes, toggleMute, toggleSolo, toggleFreeze
    } = useStore();

    const drumLabels = ['KICK', 'SNARE', 'CH', 'OH', 'LT', 'MT', 'CLAP', 'RIDE'];

    return (
        <div className="sequencer-container">
            <div className="header">
                <div className="header-left">
                    <div className="crosshair"></div>
                    <h1>CELLULAR SEQUENCER</h1>
                </div>
                <div className="header-right">
                    <div className="badge">CELL2AUDIO</div>
                    <div className="version">V 1.0</div>
                </div>
            </div>

            <div className="decorative-line"></div>

            <Grid
                data={grid}
                onToggle={toggleCell}
                rowLabels={drumLabels}
                mutes={trackMutes}
                solos={trackSolos}
                freezes={trackFreezes}
                onToggleMute={toggleMute}
                onToggleSolo={toggleSolo}
                onToggleFreeze={toggleFreeze}
                title=""
            />

            <Controls />

            <div className="aesthetic-footer">
                <div className="footer-block left">
                    <div className="box-border">
                        <span>© GUARDABRAZO</span>
                    </div>
                    <div className="text-group">
                        <p>ALGORITHMICALLY GENERATED</p>
                        <p>ORCHESTRATED BY GOOGLE ANTIGRAVITY</p>
                    </div>
                </div>
                <div className="footer-block right">
                    <div className="dimensions">
                        <span>1. &lt;2 N: DIE</span>
                        <span>2. 2-3 N: LIVE</span>
                        <span>3. &gt;3 N: DIE</span>
                        <span>4. 3 N: BORN</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default App;
