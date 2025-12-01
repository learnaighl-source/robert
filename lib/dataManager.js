// Single Source of Truth Data Manager
class DataManager {
  constructor() {
    this.cache = new Map();
    this.listeners = new Set();
    this.isRefreshing = false;
  }

  // Get combined data (DB users + GHL API)
  async getCombinedData(forceRefresh = false) {
    const cacheKey = 'combined-data';
    
    if (!forceRefresh && this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    if (this.isRefreshing) {
      // Wait for ongoing refresh
      return new Promise((resolve) => {
        const checkRefresh = () => {
          if (!this.isRefreshing) {
            resolve(this.cache.get(cacheKey));
          } else {
            setTimeout(checkRefresh, 50);
          }
        };
        checkRefresh();
      });
    }

    this.isRefreshing = true;

    try {
      // Fetch users from DB
      const usersResponse = await fetch('/api/get-users');
      const { users } = await usersResponse.json();
      
      // Get only checked users
      const checkedUsers = users.filter(user => user.checked);
      
      // Fetch calendars from GHL API for checked users
      const calendarsResponse = await fetch('/api/get-calendars');
      const { calendars } = await calendarsResponse.json();

      const combinedData = {
        users: checkedUsers,
        calendars: calendars || [],
        timestamp: Date.now()
      };

      this.cache.set(cacheKey, combinedData);
      this.notifyListeners(combinedData);
      
      return combinedData;
    } finally {
      this.isRefreshing = false;
    }
  }

  // Subscribe to data changes
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // Notify all listeners
  notifyListeners(data) {
    this.listeners.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Listener error:', error);
      }
    });
  }

  // Force refresh data
  async refresh() {
    this.cache.clear();
    return this.getCombinedData(true);
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
  }
}

// Singleton instance
const dataManager = new DataManager();
export default dataManager;