const Utils = {
  formatDate(timestamp) {
    if (!timestamp) return '—';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  },

  formatTime(timestamp) {
    if (!timestamp) return '—';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  },

  formatDateTime(timestamp) {
    return `${this.formatDate(timestamp)} · ${this.formatTime(timestamp)}`;
  },

  getKickoffMs(timestamp) {
    if (!timestamp) return 0;
    return timestamp.toDate ? timestamp.toDate().getTime() : new Date(timestamp).getTime();
  },

  isPredictionClosed(kickoffTime) {
    return Date.now() >= this.getKickoffMs(kickoffTime);
  },

  getCountdown(kickoffTime) {
    const diff = this.getKickoffMs(kickoffTime) - Date.now();
    if (diff <= 0) return { expired: true, text: 'Kickoff!' };

    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    const secs = Math.floor((diff % 60000) / 1000);

    if (days > 0) return { expired: false, text: `${days}d ${hours}h ${mins}m` };
    if (hours > 0) return { expired: false, text: `${hours}h ${mins}m ${secs}s` };
    return { expired: false, text: `${mins}m ${secs}s` };
  },

  deriveWinner(scoreA, scoreB) {
    if (scoreA > scoreB) return 'teamA';
    if (scoreB > scoreA) return 'teamB';
    return 'draw';
  },

  calculatePoints(predScoreA, predScoreB, predWinner, result) {
    if (!result) return 0;
    const actualWinner = this.deriveWinner(result.scoreA, result.scoreB);
    if (predWinner !== actualWinner) return 0;
    if (predScoreA === result.scoreA && predScoreB === result.scoreB) return 5;
    return 3;
  },

  normalizeMobile(mobile) {
    return mobile.replace(/[\s\-]/g, '').trim();
  },

  validateMobile(mobile) {
    const normalized = this.normalizeMobile(mobile);
    return /^\+?[0-9]{10,15}$/.test(normalized);
  },

  showToast(message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  },

  showLoading(element, text = 'Loading...') {
    if (element) {
      element.innerHTML = `<div class="loading-state"><div class="spinner"></div><p>${text}</p></div>`;
    }
  },

  showError(element, message) {
    if (element) {
      element.innerHTML = `<div class="error-state"><p>${message}</p></div>`;
    }
  },

  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },

  statusBadge(status) {
    const labels = { upcoming: 'Upcoming', live: 'Live', finished: 'Finished' };
    return `<span class="badge badge-${status}">${labels[status] || status}</span>`;
  },

  winnerLabel(winner, teamA, teamB) {
    if (winner === 'teamA') return teamA;
    if (winner === 'teamB') return teamB;
    return 'Draw';
  }
};
