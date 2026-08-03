import React from 'react';
import AnimePage from '../templates/anime/AnimePage';

/**
 * Standalone sanity check for the engine + one template. Swap AnimePage for
 * any other templates/* page — same Prism underneath, different dataset.
 */
export default function App() {
  return <AnimePage />;
}
