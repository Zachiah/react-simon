import { useState, useEffect } from 'react'
import SettingsDialog from './SettingsDialog';
import * as Tone from "tone";

type Color = 'green' | 'red' | 'yellow' | 'blue';
const colors = ['green', 'red', 'yellow', 'blue'] as const;
const notes = ['C4', 'E4', 'G4', 'C5'];

type State = 
  | {tag: 'playing', pattern: Color[], index: number, gap: boolean, score: number}
  | {tag: 'receiving', pattern: Color[], index: number, score: number}
  | {tag: 'game-over', playedSound: boolean, score: number}
  | {tag: 'begin'};

type Action = 
  | {tag: 'restart'}
  | {tag: 'push-button', color: Color}
  | {tag: 'finished-showing-section'}
  | {tag: 'played-game-over-sound'};


const DEBUG = true;

const useStateReducer = <S, A>(dispatch: (s: S, a: A) => S, initial: S) => {
  const [state, setState] = useState<S>(initial);

  return [state, (action: A) => {
    if (DEBUG) console.log(state, action, dispatch(state,action))
    setState(dispatch(state, action));
  }] as const;
}

const generateColor = (): Color => {
  const idx = Math.floor(Math.random() * 4);
  return colors[idx]!;
}

const useLocalStorage = <T,>(key: string, defaultValue: T, version = 1) => {
  const localS = localStorage.getItem(key);
  const parsed = localS ? JSON.parse(localS) : undefined;
  const retrieved = parsed?.version === version ? parsed.value : undefined;
  const [s, setS] = useState(retrieved ?? defaultValue);

  return [s, (value: T) => {
    localStorage.setItem(key, JSON.stringify({version, value}));
    setS(value);
  }] as const;
}

const dispatch = (s: State, a: Action): State => {
  const invalidStateError = Error(`Invalid state transition:\n\nState:\n${JSON.stringify(s)}\n\nAction:\n${JSON.stringify(a)}`);
  if (a.tag === 'restart') {
    return {tag: 'playing', pattern: [generateColor()], index: 0, gap: true, score: 0};
  }
  if (a.tag === 'finished-showing-section') {
    if (s.tag !== 'playing') throw invalidStateError;

    if (s.gap === true) {
      return {...s, gap: false};
    }
    
    if (s.index === s.pattern.length - 1) {
      return {tag: 'receiving', pattern: s.pattern, index: 0, score: s.score};
    }
    return {tag: 'playing', pattern: s.pattern, index: s.index+1, gap: true, score: s.score};
  }
  if (a.tag === 'push-button') {
    if (s.tag === 'playing') {
      return dispatch({tag: 'receiving', pattern: s.pattern, index: 0, score: s.score}, a);
    }
    if (s.tag !== 'receiving') {
      throw invalidStateError;
    }

    if (s.pattern[s.index] !== a.color) {
      return {tag: 'game-over', playedSound: false, score: s.score};
    }
    
    if (s.index === s.pattern.length - 1) {
      return {tag: 'playing', pattern: s.pattern.concat(generateColor()), index: 0, gap: true, score: s.score+1};
    }

    return {...s, index: s.index+1};
  }
  if (a.tag === 'played-game-over-sound') {
    if (s.tag !== 'game-over') throw invalidStateError;
    return {tag: 'game-over', playedSound: true, score: s.score};
  }
  const exhaustiveCheck: never = a;
  throw exhaustiveCheck;
}

export type Settings = {
  firstGapDuration: number,
  gapDuration: number,
  showDuration: number,
  greenKey: string,
  redKey: string,
  yellowKey: string,
  blueKey: string,
  restartKey: string,
  settingsKey: string,
}


const synth = new Tone.Synth().toDestination();

function App() {
  const [state, updateState] = useStateReducer<State, Action>(dispatch, {tag: 'begin'});
  const [settings, setSettings] = useLocalStorage<Settings>('settings', {
    firstGapDuration: 1000,
    gapDuration: 500,
    showDuration: 500,
    greenKey: 'g',
    redKey: 'r',
    yellowKey: 'y',
    blueKey: 'b',
    restartKey: 'Enter',
    settingsKey: 's',
  }, 2);
  const [highScore, setHighScore] = useLocalStorage<number>('highScore', 0);

  const [pressedColor, setPressedColor] = useState<Color | undefined>(undefined);

  const getBtnClasses = (index: number) => {
    const radiusClasses = ['rounded-tl-full', 'rounded-tr-full', 'rounded-bl-full', 'rounded-br-full'];

    const activeColorClasses =         [       'bg-green-600',        'bg-red-600',        'bg-yellow-200',        'bg-blue-600'];
    const activeCssStateColorClasses = ['active:bg-green-600', 'active:bg-red-600', 'active:bg-yellow-200', 'active:bg-blue-600'];
    const normalColorClasses =         [       'bg-green-400', '       bg-red-400',        'bg-yellow-400',        'bg-blue-400'];

    const isActive = (state.tag === 'playing' && state.pattern[state.index] === colors[index] && !state.gap) || pressedColor === colors[index];
    return `w-1/2 aspect-square active ${activeCssStateColorClasses[index]} ${radiusClasses[index]} ${isActive ? activeColorClasses[index] : normalColorClasses[index]}`;
  };

  useEffect(() => {
    const keyupHandler = (e: {key: string}) => {
      if (e.key === settings.restartKey) {
        updateState({tag: 'restart'});
      }
      if (e.key === settings.settingsKey) {
        setSettingsOpen(true);
      }
      if (pressedColor) {
        if (state.tag === 'receiving') {
          updateState({tag: 'push-button', color: pressedColor});
        }
        setPressedColor(undefined);
      }
    }
    const keydownHandler = (e: {key: string}) => {
      const keys = [settings.greenKey, settings.redKey, settings.yellowKey, settings.blueKey];
      const keyIndex = keys.indexOf(e.key);
      if (keyIndex === -1) {
        return;
      }
      synth.triggerAttackRelease(notes[keyIndex], "8n");
      setPressedColor(colors[keyIndex]);
    }
    document.addEventListener('keyup', keyupHandler);
    document.addEventListener('keydown', keydownHandler);
    return () => {
      document.removeEventListener('keyup', keyupHandler);
      document.removeEventListener('keydown', keydownHandler);
    }
  });

  useEffect(() => {
    if (state.tag !== 'playing') return;

    const timeout = setTimeout(() => {
      if (state.tag !== 'playing') return;
      if (state.gap) {
        synth.triggerAttackRelease(notes[colors.indexOf(state.pattern[state.index])], "8n");
      }
      updateState({tag: 'finished-showing-section'});
    }, state.gap ? (state.index === 0 ? settings.firstGapDuration : settings.gapDuration) : settings.showDuration);
    return () => clearTimeout(timeout);
  });

  useEffect(() => {
    if (state.tag === 'game-over' && !state.playedSound) {
      const timeout = setTimeout(() => {
        setHighScore(state.score);
        const now = Tone.now();
        synth.triggerAttackRelease("A3", "8n", now);
        synth.triggerAttackRelease("C3", "8n", now);
        synth.triggerAttackRelease("Eb3", "8n", now);
        synth.triggerAttackRelease("Gb3", "8n", now);
        updateState({tag: 'played-game-over-sound'});
      }, 100);
      return () => clearTimeout(timeout);
    }
  })

  const handleClick = (color: Color) => () => {
    updateState({tag: 'push-button', color: color});
  }

  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleMouseDown = (index: number) => () => {
    synth.triggerAttackRelease(notes[index], "8n");
  }

  const score = state.tag === 'begin' ? 0 : state.score;

  return (
    <>
      <SettingsDialog settings={settings} setSettings={setSettings} setSettingsOpen={setSettingsOpen} settingsOpen={settingsOpen} />
      <div className="flex h-screen items-center justify-center bg-black">
        <div className="fixed bottom-4 left-4 text-white flex flex-col">
          <div>Score: {score}</div>
          <div>High Score: {highScore}</div>
        </div>
        <div className="aspect-square rounded-full bg-gray-200 h-[80vmin] flex flex-wrap relative">
          {[0,1,2,3].map(index => (
            <button onMouseDown={handleMouseDown(index)} key={index} onClick={handleClick(colors[index])} className={getBtnClasses(index)}></button>
          ))}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/5 aspect-square rounded-full bg-black text-4xl flex items-center justify-center text-white">
            {state.tag === 'playing' || state.tag === 'receiving' ? 'SIMON' : ''}
            </div>
            {state.tag === 'begin' || state.tag === 'game-over'
              ? <button onClick={() => {updateState({tag: 'restart'})}} className="absolute w-full h-full rounded-full bg-black bg-opacity-40 text-white flex items-center justify-center text-4xl">
                {state.tag === 'begin' ? 'Begin' : 'Game Over'}
                </button>
              : <></>}
        </div>
      </div>
    </>
  )
}

export default App
