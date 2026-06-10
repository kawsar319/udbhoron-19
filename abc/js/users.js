const Users = {
  async register(name, mobile) {
    const normalizedMobile = Utils.normalizeMobile(mobile);
    if (!name.trim()) throw new Error('Please enter your full name.');
    if (!Utils.validateMobile(normalizedMobile)) throw new Error('Please enter a valid mobile number.');

    const mobileRef = db.collection('mobiles').doc(normalizedMobile);
    const userData = {
      name: name.trim(),
      mobile: normalizedMobile,
      totalPoints: 0,
      joinedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    const docRef = db.collection('users').doc();
    await db.runTransaction(async (transaction) => {
      const mobileSnap = await transaction.get(mobileRef);
      if (mobileSnap.exists) {
        throw new Error('This mobile number is already registered. Please log in instead.');
      }
      transaction.set(docRef, userData);
      transaction.set(mobileRef, { userId: docRef.id, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
    });
    const user = { userId: docRef.id, ...userData, joinedAt: new Date() };
    Auth.setCurrentUser(user);
    return user;
  },

  async login(mobile) {
    const normalizedMobile = Utils.normalizeMobile(mobile);
    if (!Utils.validateMobile(normalizedMobile)) throw new Error('Please enter a valid mobile number.');

    const snapshot = await db.collection('users')
      .where('mobile', '==', normalizedMobile)
      .limit(1)
      .get();

    if (snapshot.empty) {
      throw new Error('No account found with this mobile number. Please register first.');
    }

    const doc = snapshot.docs[0];
    const user = { userId: doc.id, ...doc.data() };
    Auth.setCurrentUser(user);
    return user;
  },

  async getAll() {
    const snapshot = await db.collection('users').orderBy('name').get();
    return snapshot.docs.map(doc => ({ userId: doc.id, ...doc.data() }));
  },

  async getTop(limit = 10) {
    const snapshot = await db.collection('users')
      .orderBy('totalPoints', 'desc')
      .limit(limit)
      .get();
    return snapshot.docs.map(doc => ({ userId: doc.id, ...doc.data() }));
  },

  async getLeaderboard() {
    const snapshot = await db.collection('users')
      .orderBy('totalPoints', 'desc')
      .get();
    return snapshot.docs.map(doc => ({ userId: doc.id, ...doc.data() }));
  },

  subscribeLeaderboard(callback) {
    return db.collection('users')
      .orderBy('totalPoints', 'desc')
      .onSnapshot(snapshot => {
        const users = snapshot.docs.map(doc => ({ userId: doc.id, ...doc.data() }));
        callback(users);
      });
  }
};
