// A CircularPool can
export interface CircularPool<T> {
  // get the next available item in the pool
  nextItem: () => T;
  // run a callback against each item in the pool
  forEach: (callback: (item: T) => void) => void;
}

// To create a Circular pool
export const makeCircularPool = <T>(
  poolSize: number, // how many items in the pool
  itemBuilder: () => T, // a function that will produce a new item
): CircularPool<T> => {
  const size = poolSize;
  const pool: T[] = [];
  let index = 0;

  // build the items and store them in the pool
  for (let i = 0; i < size; i++) {
    pool[i] = itemBuilder();
  }

  const nextItem = (): T => {
    // increment index and wrap if needed
    index = (index + 1) % size;
    // return the item stored at index
    return pool[index];
  };

  const forEach = (callback: (item: T) => void) => {
    // call the provided callback for every item in the pool
    pool.forEach(callback);
  };

  // don't expose size, pool, index ("private")
  // do expose nextItem() and forEach() ("public")
  return {
    nextItem,
    forEach,
  };
};
