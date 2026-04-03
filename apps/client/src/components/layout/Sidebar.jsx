function Sidebar({ user, tabs, activeTab, onTabChange, onLogout, mobileOpen, onCloseMobile }) {
  return (
    <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
      <div className="sidebar-mobile-head">
        <strong>Navigation</strong>
        <button type="button" className="ghost-close" onClick={onCloseMobile}>Close</button>
      </div>
      <h2>Vuzima Pharma Go</h2>
      <div className="sub">{user?.email}</div>
      <div className="sub role">Role: {user?.role}</div>

      <nav>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={activeTab === tab.id ? 'active' : ''}
            onClick={() => {
              onTabChange(tab.id)
              onCloseMobile()
            }}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <button type="button" className="logout" onClick={onLogout}>
        Logout
      </button>
    </aside>
  )
}

export default Sidebar
