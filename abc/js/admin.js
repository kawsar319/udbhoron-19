const Admin = {
  async login(email, password) {
    const credential = await auth.signInWithEmailAndPassword(email, password);
    const adminDoc = await db.collection('admins').doc(credential.user.uid).get();
    if (!adminDoc.exists) {
      await auth.signOut();
      throw new Error('You do not have admin access.');
    }
    return credential.user;
  },

  async logout() {
    await auth.signOut();
  },

  async checkAuth() {
    const user = auth.currentUser;
    if (!user) return null;
    const adminDoc = await db.collection('admins').doc(user.uid).get();
    if (!adminDoc.exists) {
      await auth.signOut();
      return null;
    }
    return user;
  },

  onAuthChange(callback) {
    return auth.onAuthStateChanged(async (user) => {
      if (!user) return callback(null);
      const adminDoc = await db.collection('admins').doc(user.uid).get();
      callback(adminDoc.exists ? user : null);
    });
  },

  async addMatch(formData) {
    if (!formData.teamA || !formData.teamB || !formData.kickoffTime) {
      throw new Error('All match fields are required.');
    }
    return Matches.create(formData);
  },

  async editMatch(matchId, formData) {
    return Matches.update(matchId, formData);
  },

  async deleteMatch(matchId) {
    const predictions = await Predictions.getByMatch(matchId);
    const batch = db.batch();
    predictions.forEach(p => batch.delete(db.collection('predictions').doc(p.predictionId)));
    batch.delete(db.collection('matches').doc(matchId));
    await batch.commit();
  },

  async publishResultAndScore(matchId, scoreA, scoreB) {
    await Matches.publishResult(matchId, scoreA, scoreB);
    return Predictions.calculatePointsForMatch(matchId);
  },

  async recalculatePoints(matchId) {
    return Predictions.calculatePointsForMatch(matchId);
  },

  renderMatchTable(matches) {
    if (!matches.length) return '<p class="empty-state">No matches yet. Add your first match above.</p>';

    return `
      <table class="admin-table">
        <thead>
          <tr>
            <th>Teams</th>
            <th>Kickoff</th>
            <th>Status</th>
            <th>Result</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${matches.map(m => `
            <tr data-match-id="${m.matchId}">
              <td><strong>${Utils.escapeHtml(m.teamA)}</strong> vs <strong>${Utils.escapeHtml(m.teamB)}</strong></td>
              <td>${Utils.formatDateTime(m.kickoffTime)}</td>
              <td>${Utils.statusBadge(m.status)}</td>
              <td>${m.result ? `${m.result.scoreA} - ${m.result.scoreB}` : '—'}</td>
              <td class="admin-actions">
                <button class="btn btn-sm btn-outline edit-match-btn" data-id="${m.matchId}">Edit</button>
                <button class="btn btn-sm btn-primary result-match-btn" data-id="${m.matchId}">Result</button>
                <button class="btn btn-sm btn-gold recalc-btn" data-id="${m.matchId}">Recalc</button>
                <button class="btn btn-sm btn-danger delete-match-btn" data-id="${m.matchId}">Delete</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  },

  renderUsersTable(users) {
    if (!users.length) return '<p class="empty-state">No users registered yet.</p>';

    return `
      <table class="admin-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Mobile</th>
            <th>Points</th>
            <th>Joined</th>
          </tr>
        </thead>
        <tbody>
          ${users.map(u => `
            <tr>
              <td>${Utils.escapeHtml(u.name)}</td>
              <td>${Utils.escapeHtml(u.mobile)}</td>
              <td><strong>${u.totalPoints || 0}</strong></td>
              <td>${Utils.formatDate(u.joinedAt)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  },

  renderPredictionsTable(predictions, usersMap, matchesMap) {
    if (!predictions.length) return '<p class="empty-state">No predictions yet.</p>';

    return `
      <table class="admin-table">
        <thead>
          <tr>
            <th>User</th>
            <th>Match</th>
            <th>Prediction</th>
            <th>Points</th>
          </tr>
        </thead>
        <tbody>
          ${predictions.map(p => {
            const user = usersMap[p.userId] || { name: 'Unknown' };
            const match = matchesMap[p.matchId] || { teamA: '?', teamB: '?' };
            return `
              <tr>
                <td>${Utils.escapeHtml(user.name)}</td>
                <td>${Utils.escapeHtml(match.teamA)} vs ${Utils.escapeHtml(match.teamB)}</td>
                <td>${p.scoreA} - ${p.scoreB} (${Utils.winnerLabel(p.predictedWinner, match.teamA, match.teamB)})</td>
                <td>${p.points ?? 0}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;
  }
};
