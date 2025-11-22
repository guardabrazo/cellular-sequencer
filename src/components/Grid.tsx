import React from 'react';
import { useStore } from '../store';
import classNames from 'classnames';

interface GridProps {
    data: boolean[][];
    onToggle: (row: number, col: number) => void;
    rowLabels: string[];
    mutes: boolean[];
    solos: boolean[];
    freezes: boolean[];
    onToggleMute: (index: number) => void;
    onToggleSolo: (index: number) => void;
    onToggleFreeze: (index: number) => void;
    title: string;
}

const Grid: React.FC<GridProps> = ({
    data,
    onToggle,
    rowLabels,
    mutes,
    solos,
    freezes,
    onToggleMute,
    onToggleSolo,
    onToggleFreeze,
    title
}) => {
    const { currentStep } = useStore();
    const [isDragging, setIsDragging] = React.useState(false);
    const [paintMode, setPaintMode] = React.useState(false); // true = paint, false = erase

    React.useEffect(() => {
        const handleGlobalMouseUp = () => {
            setIsDragging(false);
        };
        window.addEventListener('mouseup', handleGlobalMouseUp);
        return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
    }, []);

    const handleMouseDown = (row: number, col: number) => {
        setIsDragging(true);
        const newMode = !data[row][col];
        setPaintMode(newMode);
        onToggle(row, col);
    };

    const handleMouseEnter = (row: number, col: number) => {
        if (isDragging) {
            const currentCell = data[row][col];
            if (currentCell !== paintMode) {
                onToggle(row, col);
            }
        }
    };

    return (
        <div className="grid-section">
            {title && <h4 style={{ margin: '0 0 0.5rem 0', opacity: 0.7, letterSpacing: '2px' }}>{title}</h4>}
            <div className="main-layout">
                <div className="track-labels">
                    {rowLabels.map((name, i) => (
                        <div key={i} className="track-row">
                            <button
                                className={classNames('track-btn mute', { active: mutes[i] })}
                                onClick={() => onToggleMute(i)}
                                title="Mute"
                            >M</button>
                            <button
                                className={classNames('track-btn solo', { active: solos[i] })}
                                onClick={() => onToggleSolo(i)}
                                title="Solo"
                            >S</button>
                            <div className="label">{name}</div>
                        </div>
                    ))}
                </div>
                <div className="grid" onMouseLeave={() => setIsDragging(false)}>
                    {data.map((row, rowIndex) => (
                        row.map((isActive, colIndex) => (
                            <div
                                key={`${rowIndex}-${colIndex}`}
                                className={classNames('cell', {
                                    active: isActive,
                                    'current-step': colIndex === currentStep,
                                    'frozen': freezes[rowIndex]
                                })}
                                onMouseDown={() => handleMouseDown(rowIndex, colIndex)}
                                onMouseEnter={() => handleMouseEnter(rowIndex, colIndex)}
                            />
                        ))
                    ))}
                </div>
                <div className="freeze-controls">
                    {rowLabels.map((_, i) => (
                        <div key={i} className="freeze-row">
                            <button
                                className={classNames('freeze-btn', { active: freezes[i] })}
                                onClick={() => onToggleFreeze(i)}
                                title="Freeze Row"
                            >F</button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Grid;
