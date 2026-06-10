const Predictions = {
  getPredictionId(userId, matchId) {
    return `${userId}_${matchId}`;
  },

  async getByUserAndMatch(userId, matchId) {
    const doc = await db.collection('predictions')
      .doc(this.getPredictionId(userId, matchId))
      .get();
    if (!doc.exists) return null;
    return { predictionId: doc.id, ...doc.data() };
  },

  async getByUser(userId) {
    const snapshot = await db.collection('predictions')
      .where('userId', '==', userId)
      .get();
    const predictions = snapshot.docs.map(doc => ({ predictionId: doc.id, ...doc.data() }));

    const matchIds = [...new Set(predictions.map(p => p.matchId))];
    const matches = {};
    await Promise.all(matchIds.map(async (id) => {
      const m = await Matches.getById(id);
      if (m) matches[id] = m;
    }));

    return predictions
      .map(p => ({ ...p, match: matches[p.matchId] }))
      .filter(p => p.match)
      .sort((a, b) => Utils.getKickoffMs(b.match.kickoffTime) - Utils.getKickoffMs(a.match.kickoffTime));
  },

  async getByMatch(matchId) {
    const snapshot = await db.collection('predictions')
      .where('matchId', '==', matchId)
      .get();
    return snapshot.docs.map(doc => ({ predictionId: doc.id, ...doc.data() }));
  },

  async submit(userId, matchId, scoreA, scoreB) {
    const match = await Matches.getById(matchId);
    if (!match) throw new Error('Match not found.');
    if (match.status !== 'upcoming') throw new Error('Predictions are closed for this match.');
    if (Utils.isPredictionClosed(match.kickoffTime)) {
      throw new Error('Prediction closed — kickoff time has passed.');
    }

    const existing = await this.getByUserAndMatch(userId, matchId);
    if (existing) throw new Error('You have already submitted a prediction for this match.');

    const scoreAInt = parseInt(scoreA, 10);
    const scoreBInt = parseInt(scoreB, 10);
    if (isNaN(scoreAInt) || isNaN(scoreBInt) || scoreAInt < 0 || scoreAInt > 20 || scoreBInt < 0 || scoreBInt > 20) {
      throw new Error('Please enter valid scores (0–20).');
    }

    const predictedWinner = Utils.deriveWinner(scoreAInt, scoreBInt);
    const predictionId = this.getPredictionId(userId, matchId);

    await db.collection('predictions').doc(predictionId).set({
      userId,
      matchId,
      scoreA: scoreAInt,
      scoreB: scoreBInt,
      predictedWinner,
      points: 0,
      submittedAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    return predictionId;
  },

  async calculatePointsForMatch(matchId) {
    const match = await Matches.getById(matchId);
    if (!match || !match.result) {
      throw new Error('Match result must be published before calculating points.');
    }

    const predictions = await this.getByMatch(matchId);
    const batch = db.batch();
    const userPointDeltas = {};

    predictions.forEach(pred => {
      const points = Utils.calculatePoints(
        pred.scoreA, pred.scoreB, pred.predictedWinner, match.result
      );
      const oldPoints = pred.points || 0;
      const delta = points - oldPoints;

      batch.update(db.collection('predictions').doc(pred.predictionId), { points });

      if (delta !== 0) {
        userPointDeltas[pred.userId] = (userPointDeltas[pred.userId] || 0) + delta;
      }
    });

    await batch.commit();

    const userBatch = db.batch();
    for (const [userId, delta] of Object.entries(userPointDeltas)) {
      const userRef = db.collection('users').doc(userId);
      const userDoc = await userRef.get();
      if (userDoc.exists) {
        const current = userDoc.data().totalPoints || 0;
        userBatch.update(userRef, { totalPoints: Math.max(0, current + delta) });
      }
    }
    await userBatch.commit();

    return { predictionsUpdated: predictions.length, usersUpdated: Object.keys(userPointDeltas).length };
  },

  renderPredictionRow(pred, match) {
    const pointsClass = pred.points === 5 ? 'points-perfect' : pred.points === 3 ? 'points-partial' : pred.points > 0 ? 'points-partial' : 'points-zero';
    const resultHtml = match.result
      ? `${match.teamA} ${match.result.scoreA} - ${match.result.scoreB} ${match.teamB}`
      : 'Pending';

    return `
      <div class="prediction-row">
        <div class="prediction-match">
          <strong>${Utils.escapeHtml(match.teamA)} vs ${Utils.escapeHtml(match.teamB)}</strong>
          <span class="prediction-date">${Utils.formatDateTime(match.kickoffTime)}</span>
        </div>
        <div class="prediction-scores">
          <span>Your pick: <strong>${pred.scoreA} - ${pred.scoreB}</strong> (${Utils.winnerLabel(pred.predictedWinner, match.teamA, match.teamB)})</span>
          <span>Result: ${resultHtml}</span>
        </div>
        <div class="prediction-points ${pointsClass}">
          ${match.result ? `${pred.points} pts` : '—'}
        </div>
      </div>
    `;
  }
};
