function TopBar({ title, loading, onRefresh, theme, onToggleTheme, showMenuButton, onToggleMenu }) {
  return (
    <header className="topbar">
      <div className="topbar-title-row">
        {showMenuButton ? (
          <button type="button" className="menu-toggle" onClick={onToggleMenu}>
            Menu
          </button>
        ) : null}
        <h1>{title}</h1>
      </div>
      <div className="topbar-actions">
        <button type="button" onClick={onToggleTheme}>
          {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        </button>
        <button type="button" onClick={onRefresh} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </div>
    </header>
  )
}

export default TopBar
