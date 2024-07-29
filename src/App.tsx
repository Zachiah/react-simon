import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'

type Color = 'green' | 'red' | 'yellow' | 'blue';
type State = {tag: 'playing', pattern: Color[], index: number} | {tag: 'receiving', pattern: Color[], index: number} | {tag: 'game-over'} | {tag: 'begin'};
type Action = {tag: 'restart'} | {tag: ''}

const dispatch = (s: State, a: Action): State => {
  const exhaustiveCheck: never = a;
  throw new Error(`${a}`);
}

function App() {
  const [count, setCount] = useState(0);
  const [pattern, setPattern] = useState<Color[]>([]);
  const [idx, setIdx] = useState(0);
  const [gameState, setGameState] = useState<State>('begin');


  const btnBaseClasses = "w-1/2 aspect-square";

  return (
    <div class="flex h-screen items-center justify-center">
      <div class="aspect-square rounded-full bg-gray-200 h-[80vmin] flex flex-wrap relative">
          <button class={`${btnBaseClasses} rounded-tl-full bg-green-400`}></button>
          <button class={`${btnBaseClasses} rounded-tr-full bg-red-600`}></button>
          <button class={`${btnBaseClasses} rounded-bl-full bg-yellow-400`}></button>
          <button class={`${btnBaseClasses} rounded-br-full bg-blue-800`}></button>

          <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/5 aspect-square rounded-full bg-black text-4xl flex items-center justify-center text-white">
          {gameState === 'playing' ? 'SIMON' : ''}
          </div>
          {gameState === 'begin' 
            ? <button onClick={() => {setGameState('playing')}} class="absolute w-full h-full rounded-full bg-black bg-opacity-40 text-white flex items-center justify-center text-4xl">
              Begin
              </button>
            : <></>}
      </div>
    </div>
  )
}

export default App
