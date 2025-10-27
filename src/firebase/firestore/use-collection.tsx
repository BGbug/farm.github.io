
'use client';

import { useState, useEffect } from 'react';
import type { Query, DocumentData, onSnapshot, QuerySnapshot } from 'firebase/firestore';

// A placeholder for the onSnapshot function if it's not available
const mockOnSnapshot: typeof onSnapshot = (query, onNext) => {
  if (process.env.NODE_ENV === 'development') {
    console.warn(
      'Firebase onSnapshot is not available. Returning mock data.'
    );
  }
  // Immediately call onNext with an empty snapshot
  onNext({
    docs: [],
    empty: true,
    size: 0,
    docChanges: () => [],
    forEach: () => {},
    metadata: { hasPendingWrites: false, fromCache: true },
  } as QuerySnapshot<DocumentData>);
  // Return an empty unsubscribe function
  return () => {};
};

// Dynamically import onSnapshot from 'firebase/firestore'
let onSnapshotFn: typeof onSnapshot = mockOnSnapshot;
import('firebase/firestore').then(firestore => {
  if (firestore.onSnapshot) {
    onSnapshotFn = firestore.onSnapshot;
  }
});

export function useCollection<T>(query: Query<DocumentData> | null) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!query) {
      setData([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubscribe = onSnapshotFn(
      query,
      (snapshot) => {
        try {
          const result: T[] = [];
          snapshot.forEach((doc) => {
            result.push({ id: doc.id, ...doc.data() } as T);
          });
          setData(result);
          setError(null);
        } catch (e: any) {
            setError(e);
        } finally {
            setLoading(false);
        }
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [query]);

  return { data, loading, error };
}
