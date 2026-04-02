function Sidebar({ user, tabs, activeTab, onTabChange, onLogout }) {
  return (
    <aside className="sidebar">
      <h2>Vuzima Pharma Go</h2>
      <div className="sub">{user?.email}</div>
      <div className="sub role">Role: {user?.role}</div>

      <nav>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={activeTab === tab.id ? 'active' : ''}
            onClick={() => onTabChange(tab.id)}
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
