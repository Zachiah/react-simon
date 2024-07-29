import Input from "./Input";
import KeySelectorInput from "./KeySelectorInput";

const SettingsDialog = (p: {
  settings: Settings,
  setSettings: (v: Settings) => void,
  setSettingsOpen: (v: boolean) => void,
  settingsOpen: boolean,
}) => {
  return (
    <>
      <button className="fixed top-4 right-4 text-white" onClick={() => (p.setSettingsOpen(true))}>Settings</button>
      {p.settingsOpen &&
        <div className="fixed overflow-auto z-20 h-screen w-screen top-0 left-0 bg-black bg-opacity-40 p-8" onClick={(e) => {
          if (e.target === e.currentTarget) {
            p.setSettingsOpen(false);
          }
        }}>
          <form
            className="max-w-prose mx-auto p-4 rounded-md text-white bg-slate-800 mt-16 shadow-lg shadow-white"
            onSubmit={(e) => {
              e.preventDefault();
              p.setSettingsOpen(false);
            }}
          >
            <Input
              label="Gap duration ms (space after showing color before next)"
              value={p.settings.gapDuration.toString()}
              type="number"
              onChange={(v) => p.setSettings({...p.settings, gapDuration: +v})}
            />

            <Input
              label="Color duration ms (how long to show the color)"
              value={p.settings.showDuration.toString()}
              type="number"
              onChange={(v) => p.setSettings({...p.settings, showDuration: +v})}
            />

            <KeySelectorInput
              label="Green keybind"
              value={p.settings.greenKey}
              onChange={(v) => p.setSettings({...p.settings, greenKey: v})}
            />
            <KeySelectorInput
              label="Red keybind"
              value={p.settings.redKey}
              onChange={(v) => p.setSettings({...p.settings, redKey: v})}
            />
            <KeySelectorInput
              label="Yellow keybind"
              value={p.settings.yellowKey}
              onChange={(v) => p.setSettings({...p.settings, yellowKey: v})}
            />
            <KeySelectorInput
              label="Blue keybind"
              value={p.settings.blueKey}
              onChange={(v) => p.setSettings({...p.settings, blueKey: v})}
            />
            <KeySelectorInput
              label="Restart keybind"
              value={p.settings.restartKey}
              onChange={(v) => p.setSettings({...p.settings, restartKey: v})}
            />
            <KeySelectorInput
              label="Settings keybind"
              value={p.settings.settingsKey}
              onChange={(v) => p.setSettings({...p.settings, settingsKey: v})}
            />

            <div className="flex p-2">
              <button className="ml-auto bg-white py-2 px-4 rounded-md text-slate-800">Continue</button>
            </div>
          </form>
        </div> 
      }
    </>
  )
}

export default SettingsDialog;
