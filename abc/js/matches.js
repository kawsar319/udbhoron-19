const Matches = {
  async getAll() {
    const snapshot = await db.collection('matches')
      .orderBy('kickoffTime', 'asc')
      .get();
    return snapshot.docs.map(doc => ({ matchId: doc.id, ...doc.data() }));
  },

  async getUpcoming(limit = 5) {
    const now = firebase.firestore.Timestamp.now();
    const snapshot = await db.collection('matches')
      .where('status', '==', 'upcoming')
      .where('kickoffTime', '>', now)
      .orderBy('kickoffTime', 'asc')
      .limit(limit)
      .get();
    return snapshot.docs.map(doc => ({ matchId: doc.id, ...doc.data() }));
  },

  async getById(matchId) {
    const doc = await db.collection('matches').doc(matchId).get();
    if (!doc.exists) return null;
    return { matchId: doc.id, ...doc.data() };
  },

  async create(data) {
    return db.collection('matches').add({
      teamA: data.teamA.trim(),
      teamB: data.teamB.trim(),
      kickoffTime: firebase.firestore.Timestamp.fromDate(new Date(data.kickoffTime)),
      status: data.status || 'upcoming',
      result: null
    });
  },

  async update(matchId, data) {
    const update = {};
    if (data.teamA) update.teamA = data.teamA.trim();
    if (data.teamB) update.teamB = data.teamB.trim();
    if (data.kickoffTime) {
      update.kickoffTime = firebase.firestore.Timestamp.fromDate(new Date(data.kickoffTime));
    }
    if (data.status) update.status = data.status;
    if (data.result !== undefined) update.result = data.result;
    return db.collection('matches').doc(matchId).update(update);
  },

  async delete(matchId) {
    return db.collection('matches').doc(matchId).delete();
  },

  async publishResult(matchId, scoreA, scoreB) {
    const scoreAInt = parseInt(scoreA, 10);
    const scoreBInt = parseInt(scoreB, 10);
    if (isNaN(scoreAInt) || isNaN(scoreBInt) || scoreAInt < 0 || scoreBInt < 0) {
      throw new Error('Invalid scores.');
    }
    return db.collection('matches').doc(matchId).update({
      status: 'finished',
      result: { scoreA: scoreAInt, scoreB: scoreBInt }
    });
  },

  subscribeAll(callback) {
    return db.collection('matches')
      .orderBy('kickoffTime', 'asc')
      .onSnapshot(snapshot => {
        const matches = snapshot.docs.map(doc => ({ matchId: doc.id, ...doc.data() }));
        callback(matches);
      });
  },

  renderMatchCard(match, options = {}) {
    const closed = Utils.isPredictionClosed(match.kickoffTime) || match.status !== 'upcoming';
    const countdown = Utils.getCountdown(match.kickoffTime);
    const resultHtml = match.result
      ? `<div class="match-result">${match.teamA} <strong>${match.result.scoreA} - ${match.result.scoreB}</strong> ${match.teamB}</div>`
      : '';

    const predictBtn = options.showPredict && !closed
      ? `<a href="predict.html?id=${match.matchId}" class="btn btn-primary btn-sm">Predict</a>`
      : closed && match.status === 'upcoming'
        ? `<span class="prediction-closed">Prediction Closed</span>`
        : match.status === 'finished'
          ? `<a href="predict.html?id=${match.matchId}" class="btn btn-outline btn-sm">View</a>`
          : '';

    return `
      <div class="match-card" data-match-id="${match.matchId}">
        <div class="match-card-header">
          ${Utils.statusBadge(match.status)}
          ${!countdown.expired && match.status === 'upcoming' ? `<span class="countdown">${countdown.text}</span>` : ''}
        </div>
        <div class="match-teams">
          <span class="team">${Utils.escapeHtml(match.teamA)}</span>
          <span class="vs">VS</span>
          <span class="team">${Utils.escapeHtml(match.teamB)}</span>
        </div>
        ${resultHtml}
        <div class="match-meta">
          <span>${Utils.formatDateTime(match.kickoffTime)}</span>
        </div>
        ${predictBtn ? `<div class="match-actions">${predictBtn}</div>` : ''}
      </div>
    `;
  }
};
