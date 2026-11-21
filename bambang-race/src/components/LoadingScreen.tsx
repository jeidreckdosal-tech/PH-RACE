import React from 'react';
import { BambangLogo } from './BambangLogo';

interface LoadingScreenProps {
  mapName: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ mapName }) => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 text-white px-6">
      <BambangLogo size="lg" />
      <div className="mt-8 w-full max-w-md space-y-3 text-center">
        <p className="text-sm font-medium text-amber-400 tracking-wide uppercase">
          Loading Circuit: {mapName}
        </p>
        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full w-3/4 bg-amber-500 rounded-full transition-all duration-300" />
        </div>
        <p className="text-xs text-slate-400">
          Preparing 3D streets, racers, and Philippine landmarks...
        </p>
      </div>
    </div>
  );
};
