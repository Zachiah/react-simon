import { useState, useEffect } from 'react'

type Color = 'green' | 'red' | 'yellow' | 'blue';
const colors = ['green', 'red', 'yellow', 'blue'] as const;

type State = {tag: 'playing', pattern: Color[], index: number} | {tag: 'receiving', pattern: Color[], index: number} | {tag: 'game-over'} | {tag: 'begin'};
type Action = {tag: 'restart'} | {tag: 'push-button', color: Color} | {tag: 'finished-showing-color'}


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
    return {tag: 'playing', pattern: [generateColor()], index: 0};
  }
  if (a.tag === 'finished-showing-color') {
    if (s.tag !== 'playing') throw invalidStateError;
    
    if (s.index === s.pattern.length - 1) {
      return {tag: 'receiving', pattern: s.pattern, index: 0};
    }
    return {tag: 'playing', pattern: s.pattern, index: s.index+1}
  }
  if (a.tag === 'push-button') {
    if (s.tag === 'playing') {
      return dispatch({tag: 'receiving', pattern: s.pattern, index: 0}, a);
    }
    if (s.tag !== 'receiving') {
      throw invalidStateError;
    }

    if (s.pattern[s.index] !== a.color) {
      return {tag: 'game-over'};
    }
    
    if (s.index === s.pattern.length - 1) {
      return {tag: 'playing', pattern: s.pattern.concat(generateColor()), index: 0};
    }

    return {...s, index: s.index+1};
  }
  const exhaustiveCheck: never = a;
  throw exhaustiveCheck;
}

type PlayingStatus = 'gap' | 'show';

type Settings = {
  gapDuration: number,
  showDuration: number,
  greenKey: string,
  redKey: string,
  yellowKey: string,
  blueKey: string,
  restartKey: string,
  settingsKey: string,
}


function App() {
  const [state, updateState] = useStateReducer<State, Action>(dispatch, {tag: 'begin'});
  const [settings, setSettings] = useLocalStorage<Settings>('settings', {
    gapDuration: 500,
    showDuration: 500,
    greenKey: 'g',
    redKey: 'r',
    yellowKey: 'y',
    blueKey: 'b',
    restartKey: 'Enter',
    settingsKey: 's',
  });

  const [playingStatus, setPlayingStatus] = useState<PlayingStatus>('gap');

  const [pressedColor, setPressedColor] = useState<Color | undefined>(undefined);

  const getBtnClasses = (index: number) => {
    const radiusClasses = ['rounded-tl-full', 'rounded-tr-full', 'rounded-bl-full', 'rounded-br-full'];

    const activeColorClasses =         [       'bg-green-600',        'bg-red-600',        'bg-yellow-200',        'bg-blue-600'];
    const activeCssStateColorClasses = ['active:bg-green-600', 'active:bg-red-600', 'active:bg-yellow-200', 'active:bg-blue-600'];
    const normalColorClasses =         [       'bg-green-400', '       bg-red-400',        'bg-yellow-400',        'bg-blue-400'];

    const isActive = (state.tag === 'playing' && state.pattern[state.index] === colors[index] && playingStatus === 'show') || pressedColor === colors[index];
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
      if (e.key === settings.greenKey) {
        setPressedColor('green');
      }
      if (e.key === settings.redKey) {
        setPressedColor('red');
      }
      if (e.key === settings.yellowKey) {
        setPressedColor('yellow');
      }
      if (e.key === settings.blueKey) {
        setPressedColor('blue');
      }
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
      if (playingStatus === 'gap') {
        setPlayingStatus('show');
      } else {
        setPlayingStatus('gap');
        updateState({tag: 'finished-showing-color'});
      }
    }, playingStatus === 'gap' ? settings.gapDuration : settings.showDuration);
    return () => clearTimeout(timeout);
  });

  const handleClick = (color: Color) => () => {
    updateState({tag: 'push-button', color: color});
  }

  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <>
      <button className="fixed top-4 right-4 text-white" onClick={() => (setSettingsOpen(true))}>Settings</button>
      {settingsOpen ? <div className="fixed overflow-auto z-20 h-screen w-screen top-0 left-0 bg-black bg-opacity-40 p-8" onClick={(e) => {
        if (e.target === e.currentTarget) {
          setSettingsOpen(false);
        }
      }}>
          <form
            className="max-w-prose mx-auto p-4 rounded-md text-white bg-slate-800 mt-16 shadow-lg shadow-white"
            onSubmit={(e) => {
              e.preventDefault();
              setSettingsOpen(false);
            }}
          >
            <Input
              label="Gap duration ms (space after showing color before next)"
              value={settings.gapDuration.toString()}
              type="number"
              onChange={(v) => setSettings({...settings, gapDuration: +v})}
            />

            <Input
              label="Color duration ms (how long to show the color)"
              value={settings.showDuration.toString()}
              type="number"
              onChange={(v) => setSettings({...settings, showDuration: +v})}
            />

            <KeySelectorInput
              label="Green keybind"
              value={settings.greenKey}
              onChange={(v) => setSettings({...settings, greenKey: v})}
            />
            <KeySelectorInput
              label="Red keybind"
              value={settings.redKey}
              onChange={(v) => setSettings({...settings, redKey: v})}
            />
            <KeySelectorInput
              label="Yellow keybind"
              value={settings.yellowKey}
              onChange={(v) => setSettings({...settings, yellowKey: v})}
            />
            <KeySelectorInput
              label="Blue keybind"
              value={settings.blueKey}
              onChange={(v) => setSettings({...settings, blueKey: v})}
            />
            <KeySelectorInput
              label="Restart keybind"
              value={settings.restartKey}
              onChange={(v) => setSettings({...settings, restartKey: v})}
            />
            <KeySelectorInput
              label="Settings keybind"
              value={settings.settingsKey}
              onChange={(v) => setSettings({...settings, settingsKey: v})}
            />

            <div className="flex p-2">
              <button className="ml-auto bg-white py-2 px-4 rounded-md text-slate-800">Continue</button>
            </div>
          </form>
        </div> : <></>}
      <div className="flex h-screen items-center justify-center bg-black">
        <div className="aspect-square rounded-full bg-gray-200 h-[80vmin] flex flex-wrap relative">
          {[0,1,2,3].map(index => (
            <button key={index} onClick={handleClick(colors[index])} className={getBtnClasses(index)}></button>
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

const Input = (p: {
  value: string,
  type: string,
  onChange: (v: string) => void,
  label: string,
}) => {
  return (
    <label className="flex flex-col gap-2 my-6">
      <div>{p.label}</div>
      <input
        className="rounded-md px-4 py-2 bg-transparent text-white border-b border-white focus:outline-none focus-visible:ring"
        value={p.value}
        type={p.type}
        onChange={e => p.onChange(e.target.value)}
      />
    </label>
  )
}

const KeySelectorInput = (p: {
  value: string,
  onChange: (v: string) => void,
  label: string,
}) => {
  return (
    <label className="flex flex-col gap-2 my-6">
      <div>{p.label}</div>
      <input
        className="rounded-md px-4 py-2 bg-transparent text-white border-b border-white focus:outline-none focus-visible:ring"
        value={p.value}
        readOnly
        onKeyDown={e => {
          if (e.key !== "Tab" && e.key !== "Shift") {
            e.preventDefault();
            p.onChange(e.key)}
          }
        }
      />
    </label>
  )
}

export default App
