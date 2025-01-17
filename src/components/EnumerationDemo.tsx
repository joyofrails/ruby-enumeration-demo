import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export type EnumerationType = 'eager' | 'lazy';

export type ThemeColors = {
  background?: string;
  text?: string;
  primary?: string;
  secondary?: string;
  accent?: string;
  gridLines?: string;
};

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

interface EnumerationDemoProps extends React.HTMLAttributes<HTMLDivElement> {
  demoType?: EnumerationType;
  isDarkMode?: boolean;
  customColors?: ThemeColors;
  animationSpeed?: number;
}

const EnumerationDemo: React.FC<EnumerationDemoProps> = ({
  demoType,
  isDarkMode = false,
  customColors = {},
  animationSpeed = 0.33,
  className,
  ...props
}) => {
  const [progress, setProgress] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [type, setType] = useState<EnumerationType>(demoType || 'eager');
  const [explosions, setExplosions] = useState<ExplosionParticle[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);

  // Theme configuration
  const theme = {
    background:
      customColors.background || (isDarkMode ? 'rgb(24, 24, 27)' : 'white'),
    text:
      customColors.text ||
      (isDarkMode ? 'rgb(250, 250, 250)' : 'rgb(24, 24, 27)'),
    primary:
      customColors.primary ||
      (isDarkMode ? 'rgb(59, 130, 246)' : 'rgb(59, 130, 246)'),
    secondary:
      customColors.secondary ||
      (isDarkMode ? 'rgb(244, 114, 182)' : 'rgb(249, 115, 22)'),
    accent:
      customColors.accent ||
      (isDarkMode ? 'rgb(168, 85, 247)' : 'rgb(168, 85, 247)'),
    gridLines:
      customColors.gridLines ||
      (isDarkMode ? 'rgb(63, 63, 70)' : 'rgb(229, 231, 235)'),
  };

  const processedStepsRef = useRef<Set<string>>(new Set());
  const animationRef = useRef<number | null>(null);

  const EXPLOSION_DURATION = 500;
  const ANIMATION_STEP = animationSpeed;
  const FRAME_DURATION = 16;
  const MAX_PROGRESS = 150;
  const isEven = (n: number): boolean => n % 2 === 0;

  const columns = ['[ ]', 'map', 'select', 'take'];
  const dots: Dot[] = Array(7)
    .fill(null)
    .map((_, i) => ({ pos: i, column: 0 }));

  const steps: Record<EnumerationType, Step[]> = {
    eager: [
      {
        pos: 0,
        from: 0,
        to: 0,
        progress: 0,
        narrationTitle: 'Start',
        narrationDescription: 'Press Play to begin',
      },
      ...Array(7)
        .fill(null)
        .map((_, i) => ({
          pos: i,
          from: 0,
          to: 1,
          progress: i * 8 + 8,
          narrationTitle: 'map: change color',
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
          narrationTitle: `select: even index?`,
          narrationDescription: `Item ${i}: ${isEven(i) ? 'yes' : 'no'}`,
        })),
      ...[0, 2, 4].map((i, idx) => ({
        pos: i,
        from: 2,
        to: 3,
        progress: 128 + idx * 8,
        narrationTitle: `take: 3`,
        narrationDescription: `Item ${i}`,
      })),
      {
        pos: 6,
        from: 2,
        to: 2,
        progress: 144,
        skipRemaining: true,
        narrationTitle: 'take: 3, done!',
        narrationDescription: '3 items taken',
      },
      {
        pos: 6,
        from: 2,
        to: 2,
        progress: 144,
        skipRemaining: true,
        narrationTitle: 'take: 3, done!',
        narrationDescription: '3 items taken, remaining items not taken',
      },
    ],
    lazy: [
      {
        pos: 0,
        from: 0,
        to: 0,
        progress: 0,
        narrationTitle: 'Start',
        narrationDescription: 'Press Play to begin',
      },
      {
        pos: 0,
        from: 0,
        to: 1,
        progress: 8,
        narrationTitle: 'map: change color',
        narrationDescription: 'Item 0',
      },
      {
        pos: 0,
        from: 1,
        to: 2,
        progress: 16,
        narrationTitle: 'select: even index?',
        narrationDescription: 'Item 0: yes',
      },
      {
        pos: 0,
        from: 2,
        to: 3,
        progress: 24,
        narrationTitle: 'take: 3',
        narrationDescription: 'Item 0',
      },
      {
        pos: 1,
        from: 0,
        to: 1,
        progress: 32,
        narrationTitle: 'map: change color',
        narrationDescription: 'Item 1',
      },
      {
        pos: 1,
        from: 1,
        to: 2,
        progress: 40,
        explode: true,
        narrationTitle: 'select: even index?',
        narrationDescription: 'Item 1: no',
      },
      {
        pos: 2,
        from: 0,
        to: 1,
        progress: 56,
        narrationTitle: 'map: change color',
        narrationDescription: 'Item 2',
      },
      {
        pos: 2,
        from: 1,
        to: 2,
        progress: 64,
        narrationTitle: 'select: even index?',
        narrationDescription: 'Item 2: yes',
      },
      {
        pos: 2,
        from: 2,
        to: 3,
        progress: 72,
        narrationTitle: 'take: 3',
        narrationDescription: 'Item 2',
      },
      {
        pos: 3,
        from: 0,
        to: 1,
        progress: 84,
        narrationTitle: 'map: change color',
        narrationDescription: 'Item 3',
      },
      {
        pos: 3,
        from: 1,
        to: 2,
        progress: 92,
        explode: true,
        narrationTitle: 'select: even index?',
        narrationDescription: 'Item 3: no',
      },
      {
        pos: 4,
        from: 0,
        to: 1,
        progress: 108,
        narrationTitle: 'map: change color',
        narrationDescription: 'Item 4',
      },
      {
        pos: 4,
        from: 1,
        to: 2,
        progress: 116,
        narrationTitle: 'select: even index?',
        narrationDescription: 'Item 4: yes',
      },
      {
        pos: 4,
        from: 2,
        to: 3,
        progress: 124,
        narrationTitle: 'take: 3',
        narrationDescription: 'Item 4',
      },
      {
        pos: 4,
        from: 3,
        to: 3,
        progress: 132,
        narrationTitle: 'take 3, done!',
        narrationDescription: '3 items taken',
      },
      {
        pos: 5,
        from: 0,
        to: 0,
        progress: 140,
        skipRemaining: true,
        narrationTitle: 'take: 3, done!',
        narrationDescription: '3 items taken, remaining items skipped',
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
        if (type === 'eager') {
          const lastStep = currentSteps[currentSteps.length - 1];
          if (lastStep.skipRemaining && progress >= lastStep.progress) {
            skipRemainingItems = isEven(i) && ![0, 2, 4].includes(i);
          }
        } else if (type === 'lazy') {
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
    <Card
      className={`w-full max-w-2xl ${isDarkMode ? 'dark' : ''} ${
        className || ''
      }`}
      style={{
        backgroundColor: theme.background,
        color: theme.text,
      }}
      {...props}
    >
      <CardHeader>
        <CardTitle className='flex items-baseline gap-2'>
          <span style={{ color: theme.text }}>
            {type === 'eager' ? 'Eager' : 'Lazy'} Enumeration
          </span>
          <span
            className='text-sm font-normal'
            style={{ color: `${theme.text}88` }}
          >
            {type === 'eager'
              ? 'Processes all items through each step before moving to next step'
              : 'Processes each needed item through steps before moving to next item'}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <svg
          viewBox='0 0 400 400'
          className='w-full mb-4'
          style={{ maxHeight: '60vh' }}
        >
          {columns.map((col, i) => (
            <text
              key={i}
              x={50 + i * 100}
              y={30}
              style={{ fill: theme.text }}
              className='text-sm font-medium'
              textAnchor='middle'
            >
              {col}
            </text>
          ))}

          {Array(5)
            .fill(null)
            .map((_, i) => (
              <line
                key={i}
                x1={i * 100}
                y1={40}
                x2={i * 100}
                y2={360}
                stroke={theme.gridLines}
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
                  fill={
                    dot.skipped
                      ? theme.gridLines
                      : dot.transformed
                      ? theme.primary
                      : theme.secondary
                  }
                  className='transition-colors duration-500'
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
                fill={theme.accent}
                opacity={opacity}
              />
            );
          })}
        </svg>
        <div
          className='h-12 mb-4 text-lg font-medium text-center'
          style={{ color: theme.text }}
        >
          {narration.title}
          <div
            className='text-sm font-normal'
            style={{ color: `${theme.text}88` }}
          >
            {narration.description}
          </div>
        </div>
        <div className='space-y-4'>
          {!demoType && (
            <div className='flex items-center justify-between mb-4'>
              <div
                className='flex items-center gap-2'
                style={{ color: theme.text }}
              >
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

          {!demoType && (
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
          )}

          <div className='flex gap-2'>
            {progress < MAX_PROGRESS && (
              <button
                onClick={() => setPlaying((prev) => !prev)}
                className='px-4 py-2 rounded hover:opacity-90 transition-opacity'
                style={{ backgroundColor: theme.primary, color: 'white' }}
              >
                {playing ? 'Pause' : 'Play'}
              </button>
            )}
            <button
              onClick={() => {
                cleanup();
                setPlaying(false);
                setProgress(0);
                setExplosions([]);
                processedStepsRef.current.clear();
              }}
              className='px-4 py-2 rounded hover:opacity-90 transition-opacity'
              style={{ backgroundColor: theme.gridLines, color: theme.text }}
            >
              Reset
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EnumerationDemo;
