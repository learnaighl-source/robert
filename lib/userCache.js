// In-memory cache for user states
let userCache = new Map();
let cacheStats = {
  totalUsers: 0,
  checkedUsers: 0,
  uncheckedUsers: 0,
  lastUpdated: null
};

export function getUserCache() {
  return {
    users: Array.from(userCache.values()),
    stats: { ...cacheStats }
  };
}

export function updateUserInCache(userId, userData) {
  const oldUser = userCache.get(userId);
  userCache.set(userId, userData);
  
  // Update stats
  if (oldUser?.checked !== userData.checked) {
    if (userData.checked) {
      cacheStats.checkedUsers++;
      cacheStats.uncheckedUsers--;
    } else {
      cacheStats.checkedUsers--;
      cacheStats.uncheckedUsers++;
    }
  }
  
  cacheStats.lastUpdated = new Date().toISOString();
  return userData;
}

export function initializeCache(users) {
  userCache.clear();
  cacheStats.totalUsers = users.length;
  cacheStats.checkedUsers = 0;
  cacheStats.uncheckedUsers = 0;
  
  users.forEach(user => {
    userCache.set(user.userId, user);
    if (user.checked) {
      cacheStats.checkedUsers++;
    } else {
      cacheStats.uncheckedUsers++;
    }
  });
  
  cacheStats.lastUpdated = new Date().toISOString();
}

export function getSelectedUsers() {
  return Array.from(userCache.values()).filter(user => user.checked);
}

export function getUserStats() {
  return { ...cacheStats };
}