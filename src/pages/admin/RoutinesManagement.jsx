import React, { useState } from 'react';
import RoutineBuilder from '../../components/admin/RoutineBuilder';
import RoutineAssigner from '../../components/admin/RoutineAssigner';

export default function RoutinesManagement() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  return (
    <div className="w-full p-space-lg flex flex-col gap-space-lg bg-surface text-on-surface min-h-screen">
      <RoutineBuilder onRoutineSaved={() => setRefreshTrigger((prev) => prev + 1)} />
      <RoutineAssigner refreshTrigger={refreshTrigger} />
    </div>
  );
}
