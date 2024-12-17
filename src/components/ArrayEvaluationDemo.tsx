import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

type EvaluationType = 'eager' | 'lazy';

interface Dot {
  pos: number;
  column: number;
}

interface Position extends Dot {
  transformed: boolean;
  exploded: boolean;
  skipped: boolean;
}

interface Step {
  pos: number;
  from: number;
  to: number;
  progress: number;
  narrationTitle: string;
  narrationDescription: string;
  explode?: boolean;
  skipRemaining?: boolean;
  untaken?: boolean;
}

interface ExplosionParticle {
  id: string;
  x: number;
  y: number;
  angle: number;
  progress: number;
  startTime: number;
}

interface Narration {
  title: string;
  description: string;
}

type ArrayEvaluationDemoProps = {
  demoType?: EvaluationType | undefined;
};

const ArrayEvaluationDemo: React.FC = ({
  demoType,
}: ArrayEvaluationDemoProps) => {
  const [progress, setProgress] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [type, setType] = useState<EvaluationType>(demoType || 'eager');
  const [explosions, setExplosions] = useState<ExplosionParticle[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const processedStepsRef = useRef<Set<string>>(new Set());
  const animationRef = useRef<number | null>(null);

  const EXPLOSION_DURATION = 500;
  // const ANIMATION_STEP = 0.2;
  const ANIMATION_STEP = 0.15; // Reduced from 0.2 to slow down animation
  const FRAME_DURATION = 16; // roughly 60fps

  const MAX_PROGRESS = 150;
  const isEven = (n: number): boolean => n % 2 === 0;

  const columns = ['[ ]', 'map', 'select', 'take'];
  const dots: Dot[] = Array(7)
    .fill(null)
    .map((_, i) => ({ pos: i, column: 0 }));

  const steps: Record<EvaluationType, Step[]> = {
    eager: [
      ...Array(7)
        .fill(null)
        .map((_, i) => ({
          pos: i,
          from: 0,
          to: 1,
          progress: i * 8 + 8,
          narrationTitle: 'Map to blue',
          narrationDescription: `Item ${i}`,
        })),
      ...Array(7)
        .fill(null)
        .map((_, i) => ({
          pos: i,
          from: 1,
          to: 2,
          progress: 64 + i * 8,
          explode: !isEven(i),
          narrationTitle: `Select even?`,
          narrationDescription: `Item ${i}: ${isEven(i) ? 'yes' : 'no'}`,
        })),
      ...[0, 2, 4].map((i, idx) => ({
        pos: i,
        from: 2,
        to: 3,
        progress: 128 + idx * 8,
        narrationTitle: `Take 3`,
        narrationDescription: `Item ${i}`,
      })),
      {
        pos: 6,
        from: 2,
        to: 2,
        progress: 144,
        untaken: true,
        narrationTitle: 'Done!',
        narrationDescription: '3 items taken',
      },
    ],
    lazy: [
      {
        pos: 0,
        from: 0,
        to: 1,
        progress: 8,
        narrationTitle: 'Map to blue',
        narrationDescription: 'Item 0',
      },
      {
        pos: 0,
        from: 1,
        to: 2,
        progress: 16,
        narrationTitle: 'Select even?',
        narrationDescription: 'Item 0: yes',
      },
      {
        pos: 0,
        from: 2,
        to: 3,
        progress: 24,
        narrationTitle: 'Take 1',
        narrationDescription: 'Item 0',
      },
      {
        pos: 1,
        from: 0,
        to: 1,
        progress: 32,
        narrationTitle: 'Map to blue',
        narrationDescription: 'Item 1',
      },
      {
        pos: 1,
        from: 1,
        to: 2,
        progress: 40,
        explode: true,
        narrationTitle: 'Select even?',
        narrationDescription: 'Item 1: no',
      },
      {
        pos: 2,
        from: 0,
        to: 1,
        progress: 56,
        narrationTitle: 'Map to blue',
        narrationDescription: 'Item 2',
      },
      {
        pos: 2,
        from: 1,
        to: 2,
        progress: 64,
        narrationTitle: 'Select even?',
        narrationDescription: 'Item 2: yes',
      },
      {
        pos: 2,
        from: 2,
        to: 3,
        progress: 72,
        narrationTitle: 'Take 3',
        narrationDescription: 'Item 2',
      },
      {
        pos: 3,
        from: 0,
        to: 1,
        progress: 84,
        narrationTitle: 'Map to blue',
        narrationDescription: 'Item 3',
      },
      {
        pos: 3,
        from: 1,
        to: 2,
        progress: 92,
        explode: true,
        narrationTitle: 'Select even?',
        narrationDescription: 'Item 3: no',
      },
      {
        pos: 4,
        from: 0,
        to: 1,
        progress: 108,
        narrationTitle: 'Map to blue',
        narrationDescription: 'Item 4',
      },
      {
        pos: 4,
        from: 1,
        to: 2,
        progress: 116,
        narrationTitle: 'Select even?',
        narrationDescription: 'Item 4: yes',
      },
      {
        pos: 4,
        from: 2,
        to: 3,
        progress: 124,
        narrationTitle: 'Take 3',
        narrationDescription: 'Item 4',
      },
      {
        pos: 4,
        from: 3,
        to: 3,
        progress: 132,
        narrationTitle: 'Done!',
        narrationDescription: '3 items taken',
      },
      {
        pos: 5,
        from: 0,
        to: 0,
        progress: 140,
        skipRemaining: true,
        narrationTitle: 'Done!',
        narrationDescription: 'Remaining items skipped',
      },
    ],
  };

  const stepsRef = useRef(steps);

  const easeInOutCubic = (t: number): number => {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  };

  const createExplosion = useCallback(
    (x: number, y: number): ExplosionParticle[] => {
      return Array(8)
        .fill(null)
        .map((_, i) => ({
          id: `${x}-${y}-${i}-${Date.now()}`,
          x,
          y,
          angle: (i * Math.PI * 2) / 8,
          progress: 0,
          startTime: Date.now(),
        }));
    },
    [],
  );

  const cleanup = useCallback(() => {
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current);
    }
  }, []);

  const getNarration = useCallback((): Narration => {
    const currentSteps = stepsRef.current[type];

    // Find any currently animating step
    const animatingStep = currentSteps.find((step) => {
      const stepStart = step.progress - 8;
      const stepEnd = step.progress;
      return progress >= stepStart && progress <= stepEnd;
    });

    if (animatingStep) {
      return {
        title: animatingStep.narrationTitle,
        description: animatingStep.narrationDescription,
      };
    }

    // If no step is currently animating, find the last completed step
    for (let i = currentSteps.length - 1; i >= 0; i--) {
      if (progress > currentSteps[i].progress) {
        return {
          title: currentSteps[i].narrationTitle,
          description: currentSteps[i].narrationDescription,
        };
      }
    }

    return {
      title: 'Ready to start',
      description: 'Press play to start the animation',
    };
  }, [progress, type]);

  const getLatestStepForItem = useCallback(
    (steps: Step[], progress: number, pos: number): Step | null => {
      const itemSteps = steps.filter((s) => s.pos === pos);
      for (let i = itemSteps.length - 1; i >= 0; i--) {
        if (progress >= itemSteps[i].progress) {
          return itemSteps[i];
        }
      }
      return null;
    },
    [],
  );

  const getCurrentAnimation = useCallback(
    (steps: Step[], progress: number, pos: number): Step | undefined => {
      const itemSteps = steps.filter((s) => s.pos === pos);
      return itemSteps.find(
        (s) => progress >= s.progress - 8 && progress <= s.progress,
      );
    },
    [],
  );

  useEffect(() => {
    const updatePositions = () => {
      const currentSteps = stepsRef.current[type];
      let skipRemainingItems = false;

      const newPositions = dots.map((dot, i) => {
        if (type === 'lazy') {
          const skipStep = currentSteps.find(
            (s) => s.skipRemaining && progress >= s.progress,
          );
          if (skipStep && i >= 5) {
            skipRemainingItems = true;
          }
        }

        const currentAnimation = getCurrentAnimation(currentSteps, progress, i);
        const latestStep = getLatestStepForItem(currentSteps, progress, i);

        let column = 0;
        let exploded = false;

        if (currentAnimation) {
          const stepProgress = (progress - (currentAnimation.progress - 8)) / 8;
          const easedProgress = easeInOutCubic(stepProgress);
          column =
            currentAnimation.from +
            (currentAnimation.to - currentAnimation.from) * easedProgress;

          if (
            currentAnimation.explode &&
            stepProgress > 0.9 &&
            !processedStepsRef.current.has(`explode-${i}`)
          ) {
            exploded = true;
            const x = 50 + 2 * 100;
            const y = 80 + i * 40;
            setExplosions((prev) => [...prev, ...createExplosion(x, y)]);
            processedStepsRef.current.add(`explode-${i}`);
          }
        } else if (latestStep) {
          column = latestStep.to;
          exploded = latestStep.explode || false;
        }

        return {
          ...dot,
          column,
          transformed: column >= 1,
          exploded,
          skipped: skipRemainingItems || (latestStep?.skipRemaining && i !== 4),
        } as Position;
      });

      setPositions(newPositions);
    };

    updatePositions();
  }, [
    progress,
    type,
    getCurrentAnimation,
    getLatestStepForItem,
    createExplosion,
  ]);

  useEffect(() => {
    if (explosions.length === 0) return;

    const animate = () => {
      const currentTime = Date.now();
      setExplosions((prev) =>
        prev
          .filter((particle) => {
            const elapsed = currentTime - particle.startTime;
            return elapsed < EXPLOSION_DURATION;
          })
          .map((particle) => {
            const elapsed = currentTime - particle.startTime;
            const progress = elapsed / EXPLOSION_DURATION;
            return {
              ...particle,
              progress,
            };
          }),
      );

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return cleanup;
  }, [explosions, cleanup]);

  useEffect(() => {
    cleanup();
    if (playing) {
      let lastTime = performance.now();

      const animate = (currentTime: number) => {
        const deltaTime = currentTime - lastTime;

        if (deltaTime >= FRAME_DURATION) {
          // Only update if enough time has passed
          setProgress((prev) => {
            const next = Math.min(prev + ANIMATION_STEP, MAX_PROGRESS);
            if (next >= MAX_PROGRESS) {
              setPlaying(false);
              return next;
            }
            return next;
          });
          lastTime = currentTime;
        }

        if (playing) {
          animationRef.current = requestAnimationFrame(animate);
        }
      };

      animationRef.current = requestAnimationFrame(animate);
    }
    return cleanup;
  }, [playing, cleanup]);

  const narration = getNarration();

  return (
    <Card className='w-full max-w-2xl'>
      <CardHeader>
        <CardTitle className='flex items-baseline gap-2'>
          <span>{type === 'eager' ? 'Eager' : 'Lazy'} Evaluation</span>
          <span className='text-sm text-gray-500 font-normal'>
            {type === 'eager'
              ? 'Processes all items through each step before moving to next step'
              : 'Processes each needed item through all steps before moving to next item'}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className='h-12 mb-4 text-lg font-medium text-center'>
          {narration.title}
          <div className='text-sm text-gray-500 font-normal'>
            {narration.description}
          </div>
        </div>
        <svg viewBox='0 0 400 400' className='w-full h-80 mb-4'>
          {columns.map((col, i) => (
            <text
              key={i}
              x={50 + i * 100}
              y={30}
              className='text-sm font-medium'
              textAnchor='middle'
            >
              {col}
            </text>
          ))}

          {Array(4)
            .fill(null)
            .map((_, i) => (
              <line
                key={i}
                x1={100 + i * 100}
                y1={40}
                x2={100 + i * 100}
                y2={360}
                stroke='#ddd'
                strokeDasharray='4,4'
              />
            ))}

          {positions.map(
            (dot, i) =>
              !dot.exploded && (
                <circle
                  key={i}
                  cx={50 + dot.column * 100}
                  cy={80 + i * 40}
                  r={8}
                  className={`
                ${
                  dot.skipped
                    ? 'fill-gray-300'
                    : dot.transformed
                    ? 'fill-blue-500'
                    : 'fill-orange-500'
                }
                transition-colors duration-500
              `}
                />
              ),
          )}

          {explosions.map((particle) => {
            const distance = particle.progress * 30;
            const x = particle.x + Math.cos(particle.angle) * distance;
            const y = particle.y + Math.sin(particle.angle) * distance;
            const opacity = 1 - particle.progress;
            const radius = 4 * (1 - particle.progress);

            return (
              <circle
                key={particle.id}
                cx={x}
                cy={y}
                r={radius}
                fill='red'
                opacity={opacity}
              />
            );
          })}
        </svg>

        <div className='space-y-4'>
          {demoType || (
            <div className='flex items-center justify-between mb-4'>
              <div className='flex items-center gap-2'>
                <span>Eager</span>
                <Switch
                  checked={type === 'lazy'}
                  onCheckedChange={(checked: boolean) => {
                    cleanup();
                    setPlaying(false);
                    setProgress(0);
                    setType(checked ? 'lazy' : 'eager');
                    setExplosions([]);
                    processedStepsRef.current.clear();
                  }}
                />
                <span>Lazy</span>
              </div>
            </div>
          )}

          <Slider
            value={[progress]}
            onValueChange={([value]) => {
              setPlaying(false);
              setProgress(value);
            }}
            max={MAX_PROGRESS}
            step={ANIMATION_STEP}
            className='w-full'
          />

          <div className='flex gap-2'>
            <button
              onClick={() => setPlaying((prev) => !prev)}
              className='px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600'
            >
              {playing ? 'Pause' : 'Play'}
            </button>

            <button
              onClick={() => {
                cleanup();
                setPlaying(false);
                setProgress(0);
                setExplosions([]);
                processedStepsRef.current.clear();
              }}
              className='px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300'
            >
              Reset
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ArrayEvaluationDemo;
