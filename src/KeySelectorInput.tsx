import Input from "./Input";

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

export default KeySelectorInput;
