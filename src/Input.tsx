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

export default Input;
