const Auth = {
  STORAGE_KEY: 'udbhoron_user',

  getCurrentUser() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  setCurrentUser(user) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
  },

  clearSession() {
    localStorage.removeItem(this.STORAGE_KEY);
  },

  isLoggedIn() {
    return !!this.getCurrentUser();
  },

  requireAuth(redirectUrl = 'register.html') {
    if (!this.isLoggedIn()) {
      const returnTo = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = `${redirectUrl}?return=${returnTo}`;
      return false;
    }
    return true;
  },

  async refreshUser() {
    const session = this.getCurrentUser();
    if (!session) return null;
    const doc = await db.collection('users').doc(session.userId).get();
    if (!doc.exists) {
      this.clearSession();
      return null;
    }
    const user = { userId: doc.id, ...doc.data() };
    this.setCurrentUser(user);
    return user;
  }
};
