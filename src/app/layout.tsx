import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dejoiner | Design Resource Manager",
  description: "Find what you need, when you need it. Context-aware design resource search.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Roboto+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div className="app-container">
          <aside className="sidebar">
            <div className="logo">
              <span className="logo-icon">▲</span>
              <span className="logo-text">DEJOINER</span>
            </div>

            <nav className="nav-menu">
              <div className="nav-section">
                <span className="nav-label">Main</span>
                <a href="/" className="nav-item active">
                  <span className="nav-icon">⊞</span>
                  <span>Feed</span>
                </a>
                <a href="#" className="nav-item">
                  <span className="nav-icon">📁</span>
                  <span>Projects</span>
                </a>
              </div>

              <div className="nav-section">
                <span className="nav-label">Platforms</span>
                <a href="#" className="nav-item">
                  <span className="nav-icon figma">❖</span>
                  <span>Figma</span>
                </a>
                <a href="#" className="nav-item">
                  <span className="nav-icon github">⪧</span>
                  <span>GitHub</span>
                </a>
                <a href="#" className="nav-item">
                  <span className="nav-icon drive">▲</span>
                  <span>Drive</span>
                </a>
              </div>

              <div className="nav-section">
                <span className="nav-label">Admin</span>
                <a href="/admin" className="nav-item">
                  <span className="nav-icon">⚙️</span>
                  <span>Settings</span>
                </a>
              </div>
            </nav>

            <div className="sidebar-footer">
              {/* Reserved for future actions */}
            </div>
          </aside>

          <main className="main-content">
            <header className="top-bar">
              <div className="search-wrapper" style={{ visibility: 'hidden' }}>
                {/* Search removed to avoid duplication with page-level search */}
              </div>

              <div className="user-profile">
                <div className="status-indicator">
                  <span className="status-dot"></span>
                  <span className="status-text">Live</span>
                </div>
                <div className="avatar">JD</div>
              </div>
            </header>

            <div className="content-area">
              {children}
            </div>
          </main>
        </div>

        <style dangerouslySetInnerHTML={{
          __html: `
          /* App Container */
          .app-container {
            display: flex;
            min-height: 100vh;
          }
          
          /* Sidebar - Wider & Bolder */
          .sidebar {
            width: 280px;
            height: 100vh;
            position: fixed;
            left: 0;
            top: 0;
            display: flex;
            flex-direction: column;
            padding: var(--space-xl);
            z-index: var(--z-sticky);
            background: var(--bg-secondary);
            border-right: 2px solid var(--border-default);
          }
          
          /* Logo - Larger */
          .logo {
            display: flex;
            align-items: center;
            gap: var(--space-md);
            margin-bottom: var(--space-3xl);
          }
          
          .logo-icon {
            font-size: 32px;
            color: var(--color-blue);
          }
          
          .logo-text {
            font-size: var(--text-heading-lg);
            font-weight: var(--weight-bold);
            letter-spacing: 3px;
            color: var(--text-primary);
          }
          
          /* Navigation */
          .nav-section {
            margin-bottom: var(--space-xl);
          }
          
          .nav-label {
            display: block;
            font-size: var(--text-micro);
            font-weight: var(--weight-medium);
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: var(--text-tertiary);
            margin-bottom: var(--space-md);
            padding-left: var(--space-md);
          }
          
          .nav-item {
            display: flex;
            align-items: center;
            gap: var(--space-md);
            padding: var(--space-md) var(--space-md);
            border-radius: var(--radius-md);
            margin-bottom: var(--space-xs);
            font-size: var(--text-body);
            font-weight: var(--weight-medium);
            color: var(--text-secondary);
            transition: all var(--transition-default);
            text-decoration: none;
          }
          
          .nav-item:hover {
            background: var(--bg-tertiary);
            color: var(--text-primary);
          }
          
          .nav-item.active {
            background: var(--color-blue);
            color: var(--text-primary);
            box-shadow: var(--shadow-blue);
          }
          
          .nav-icon {
            font-size: 18px;
            width: 24px;
            text-align: center;
          }
          
          .nav-icon.figma { color: var(--color-blue); }
          .nav-icon.github { color: var(--color-pink); }
          .nav-icon.drive { color: var(--color-orange); }
          
          .nav-item.active .nav-icon {
            color: var(--text-primary);
          }
          
          .sidebar-footer {
            margin-top: auto;
          }
          
          /* Main Content */
          .main-content {
            margin-left: 280px;
            flex: 1;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
          }
          
          /* Top Bar - Taller */
          .top-bar {
            height: 88px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 var(--space-2xl);
            position: sticky;
            top: 0;
            z-index: var(--z-sticky);
            background: var(--bg-primary);
            border-bottom: 2px solid var(--border-default);
          }
          
          /* Search - Larger */
          .search-wrapper {
            flex: 0 0 640px;
            position: relative;
            display: flex;
            align-items: center;
          }
          
          .search-wrapper .search-icon {
            position: absolute;
            left: var(--space-lg);
            font-size: 20px;
            color: var(--text-tertiary);
            pointer-events: none;
            transition: color var(--transition-fast);
          }
          
          .search-wrapper:focus-within .search-icon {
            color: var(--color-blue);
          }
          
          .search-input {
            width: 100%;
            height: var(--input-height);
            padding: var(--space-md) var(--space-lg);
            padding-left: 56px;
            background: var(--bg-tertiary);
            border: 2px solid var(--border-default);
            border-radius: var(--radius-lg);
            font-family: var(--font-sans);
            font-size: var(--text-body);
            color: var(--text-primary);
            transition: all var(--transition-default);
          }
          
          .search-input::placeholder {
            color: var(--text-tertiary);
          }
          
          .search-input:focus {
            outline: none;
            border-color: var(--color-blue);
            background: var(--bg-secondary);
            box-shadow: 0 0 0 4px rgba(0, 102, 255, 0.15);
          }
          
          /* User Profile */
          .user-profile {
            display: flex;
            align-items: center;
            gap: var(--space-lg);
          }
          
          .status-indicator {
            display: flex;
            align-items: center;
            gap: var(--space-sm);
            padding: 8px var(--space-md);
            background: var(--color-neon-green);
            border-radius: var(--radius-sm);
          }
          
          .status-dot {
            width: 8px;
            height: 8px;
            background: var(--text-on-color);
            border-radius: 50%;
            animation: pulse 2s ease-in-out infinite;
          }
          
          @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.7; transform: scale(0.9); }
          }
          
          .status-text {
            font-size: var(--text-micro);
            font-weight: var(--weight-bold);
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: var(--text-on-color);
          }
          
          .avatar {
            width: 44px;
            height: 44px;
            border-radius: var(--radius-md);
            background: var(--color-blue);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: var(--text-body-sm);
            font-weight: var(--weight-bold);
            color: var(--text-primary);
            box-shadow: var(--shadow-blue);
          }
          
          /* Content Area - More Padding */
          .content-area {
            flex: 1;
            padding: var(--space-2xl);
          }
          
          /* Responsive */
          @media (max-width: 1024px) {
            .search-wrapper {
              flex: 1;
              max-width: 480px;
            }
          }
          
          @media (max-width: 768px) {
            .sidebar {
              transform: translateX(-100%);
              transition: transform var(--transition-moderate);
            }
            
            .sidebar.open {
              transform: translateX(0);
            }
            
            .main-content {
              margin-left: 0;
            }
            
            .top-bar {
              padding: 0 var(--space-lg);
            }
            
            .content-area {
              padding: var(--space-lg);
            }
          }
        ` }} />
      </body>
    </html>
  );
}
