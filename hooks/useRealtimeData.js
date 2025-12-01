import { useState, useEffect, useCallback, useRef } from 'react';
import dataManager from '../lib/dataManager';
import IframeManager from '../lib/iframeManager';

export function useRealtimeData() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const eventSourceRef = useRef(null);
  const mountedRef = useRef(true);

  // Force complete refresh
  const forceRefresh = useCallback(async () => {
    if (!mountedRef.current) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const newData = await dataManager.refresh();
      if (mountedRef.current) {
        setData(newData);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err.message);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  // Initial data load
  useEffect(() => {
    let mounted = true;
    
    const loadInitialData = async () => {
      try {
        const initialData = await dataManager.getCombinedData();
        if (mounted) {
          setData(initialData);
          setLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setError(err.message);
          setLoading(false);
        }
      }
    };

    loadInitialData();
    
    return () => {
      mounted = false;
    };
  }, []);

  // SSE connection for real-time updates
  useEffect(() => {
    const connectSSE = () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      const eventSource = new EventSource('/api/websocket');
      eventSourceRef.current = eventSource;

      eventSource.onmessage = async (event) => {
        if (!mountedRef.current) return;
        
        try {
          const eventData = JSON.parse(event.data);
          
          if (eventData.type === 'userUpdate') {
            // Force complete data refresh on any user update
            await forceRefresh();
          }
        } catch (err) {
          console.error('SSE message error:', err);
        }
      };

      eventSource.onerror = (error) => {
        console.error('SSE error:', error);
        // Reconnect after 3 seconds
        setTimeout(connectSSE, 3000);
      };

      eventSource.onopen = () => {
        console.log('SSE connected');
      };
    };

    connectSSE();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [forceRefresh]);

  // Subscribe to data manager changes
  useEffect(() => {
    const unsubscribe = dataManager.subscribe((newData) => {
      if (mountedRef.current) {
        setData(newData);
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  return {
    data,
    loading,
    error,
    forceRefresh,
    checkedUsers: data?.users || [],
    calendars: data?.calendars || []
  };
}