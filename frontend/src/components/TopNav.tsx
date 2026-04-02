type Props = {
  onNewRun: () => void;
  onToggleSidebar: () => void;
};

export function TopNav({ onNewRun, onToggleSidebar }: Props) {
  return (
    <header className="app-header">
      <div className="app-header-inner">
        <div className="header-left">
          <button className="hamburger-btn" onClick={onToggleSidebar} aria-label="Toggle sidebar">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <rect y="2" width="18" height="2" rx="1" fill="currentColor" />
              <rect y="8" width="18" height="2" rx="1" fill="currentColor" />
              <rect y="14" width="18" height="2" rx="1" fill="currentColor" />
            </svg>
          </button>
          <span className="app-logo">MultiAi</span>
        </div>
        <div className="header-right">
          <button className="ghost-btn header-new-run" onClick={onNewRun}>New Run</button>
        </div>
      </div>
    </header>
  );
}
