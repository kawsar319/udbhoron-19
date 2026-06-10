const Components = {
  renderNav(activePage = '') {
    const user = Auth.getCurrentUser();
    const navItems = [
      { href: 'index.html', label: 'Home', id: 'home' },
      { href: 'matches.html', label: 'Matches', id: 'matches' },
      { href: 'leaderboard.html', label: 'Leaderboard', id: 'leaderboard' },
      { href: 'my-predictions.html', label: 'My Predictions', id: 'my-predictions' },
      { href: 'rules.html', label: 'Rules', id: 'rules' }
    ];

    const authHtml = user
      ? `<span class="nav-user">${Utils.escapeHtml(user.name)}</span>
         <button class="btn btn-outline btn-sm" id="logout-btn">Logout</button>`
      : `<a href="register.html" class="btn btn-gold btn-sm">Join / Login</a>`;

    return `
      <nav class="navbar">
        <div class="nav-container">
          <a href="index.html" class="nav-brand">
            <span class="brand-icon">⚽</span>
            <span class="brand-text">Udbhoron '19<br><small>Predictor FWC-26</small></span>
          </a>
          <button class="nav-toggle" id="nav-toggle" aria-label="Toggle menu">
            <span></span><span></span><span></span>
          </button>
          <div class="nav-menu" id="nav-menu">
            ${navItems.map(item => `
              <a href="${item.href}" class="nav-link ${activePage === item.id ? 'active' : ''}">${item.label}</a>
            `).join('')}
            <div class="nav-auth">${authHtml}</div>
          </div>
        </div>
      </nav>
    `;
  },

  renderFooter() {
    return `
      <footer class="footer">
        <div class="footer-container">
          <p>© 2026 Udbhoron '19 Predictor · FIFA World Cup 2026</p>
          <p class="footer-tagline">Predict. Compete. Celebrate.</p>
        </div>
      </footer>
    `;
  },

  initNav(activePage) {
    const navEl = document.getElementById('main-nav');
    if (navEl) navEl.innerHTML = this.renderNav(activePage);

    const footerEl = document.getElementById('main-footer');
    if (footerEl) footerEl.innerHTML = this.renderFooter();

    const toggle = document.getElementById('nav-toggle');
    const menu = document.getElementById('nav-menu');
    if (toggle && menu) {
      toggle.addEventListener('click', () => menu.classList.toggle('open'));
    }

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        Auth.clearSession();
        Utils.showToast('Logged out successfully.');
        setTimeout(() => window.location.href = 'index.html', 500);
      });
    }
  },

  renderHero() {
    return `
      <section class="hero">
        <div class="hero-bg"></div>
        <div class="hero-content">
          <span class="hero-badge">FIFA World Cup 2026</span>
          <h1>Udbhoron '19 Predictor</h1>
          <p>Predict match scores, climb the leaderboard, and win rewards with your friends.</p>
          <div class="hero-actions">
            <a href="matches.html" class="btn btn-gold btn-lg">View Matches</a>
            <a href="register.html" class="btn btn-outline btn-lg">Join Now</a>
          </div>
        </div>
      </section>
    `;
  }
};
