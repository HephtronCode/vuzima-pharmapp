function SortButton({ label, sortState, sortKey, onToggle }) {
  const indicator = sortState.key === sortKey ? (sortState.direction === 'asc' ? ' ▲' : ' ▼') : ''
  return (
    <button type="button" onClick={() => onToggle(sortKey)}>
      {label}{indicator}
    </button>
  )
}

export default SortButton
