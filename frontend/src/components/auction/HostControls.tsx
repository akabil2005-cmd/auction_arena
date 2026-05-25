'use client';

import Button from '../ui/Button';
import Card from '../ui/Card';

interface HostControlsProps {
  roomCode: string;
  isPaused: boolean;
  onEnd: () => void;
  onSkip: () => void;
  onPause: () => void;
  onResume: () => void;
}

export default function HostControls({
  isPaused,
  onEnd,
  onSkip,
  onPause,
  onResume,
}: HostControlsProps) {
  return (
    <Card className="p-4 bg-amber-500/5 border-amber-500/20">
      <p className="text-[10px] font-orbitron font-bold uppercase tracking-widest text-amber-400 mb-3">
        Host Controls
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="ghost"
          className="text-xs font-orbitron uppercase tracking-wider"
          onClick={onSkip}
        >
          Skip Card
        </Button>
        {isPaused ? (
          <Button
            variant="success"
            className="text-xs font-orbitron uppercase tracking-wider"
            onClick={onResume}
          >
            Resume
          </Button>
        ) : (
          <Button
            variant="ghost"
            className="text-xs font-orbitron uppercase tracking-wider"
            onClick={onPause}
          >
            Pause
          </Button>
        )}
        <Button
          variant="danger"
          className="text-xs font-orbitron uppercase tracking-wider"
          onClick={onEnd}
        >
          End Auction
        </Button>
      </div>
    </Card>
  );
}
