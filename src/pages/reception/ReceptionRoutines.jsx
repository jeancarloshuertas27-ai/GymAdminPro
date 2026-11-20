import React from 'react';
import RoutineAssigner from '../../components/admin/RoutineAssigner';
import RoutineViewer from '../../components/admin/RoutineViewer';

export default function ReceptionRoutines() {
  return (
    <div className="w-full p-space-lg flex flex-col gap-space-lg bg-surface text-on-surface min-h-screen">
      <RoutineAssigner />
      <RoutineViewer />
    </div>
  );
}
