import { useState, useEffect, useCallback } from "react";
import { Play, Pause, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface WorkTimerProps {
  isRunning: boolean;
  startTime?: Date | null;
  onStart: () => void;
  onPause: () => void;
  onEnd: () => void;
  hourlyRate?: string;
}

export function WorkTimer({ isRunning, startTime, onStart, onPause, onEnd, hourlyRate = "25.00" }: WorkTimerProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isRunning && startTime) {
      interval = setInterval(() => {
        const now = new Date();
        const start = new Date(startTime);
        const diff = Math.floor((now.getTime() - start.getTime()) / 1000);
        setElapsedSeconds(diff);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, startTime]);

  const formatTime = useCallback((seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const calculateEarnings = () => {
    const hours = elapsedSeconds / 3600;
    const rate = parseFloat(hourlyRate);
    return (hours * rate).toFixed(2);
  };

  return (
    <Card className="p-6">
      <div className="text-center">
        <p className="text-sm text-muted-foreground mb-2">Work Session</p>
        <div 
          className="text-5xl font-bold tabular-nums font-mono mb-4"
          data-testid="text-work-timer"
        >
          {formatTime(elapsedSeconds)}
        </div>
        <p className="text-lg font-medium text-muted-foreground mb-6">
          Earnings: <span className="text-foreground font-mono">${calculateEarnings()}</span>
        </p>
        
        <div className="flex justify-center gap-3">
          {!isRunning ? (
            <Button 
              size="lg" 
              onClick={onStart}
              className="px-8"
              data-testid="button-start-work"
            >
              <Play className="h-5 w-5 mr-2" />
              Start Work
            </Button>
          ) : (
            <>
              <Button 
                size="lg" 
                variant="secondary"
                onClick={onPause}
                data-testid="button-pause-work"
              >
                <Pause className="h-5 w-5 mr-2" />
                Pause
              </Button>
              <Button 
                size="lg" 
                variant="destructive"
                onClick={onEnd}
                data-testid="button-end-work"
              >
                <Square className="h-5 w-5 mr-2" />
                End Session
              </Button>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}
