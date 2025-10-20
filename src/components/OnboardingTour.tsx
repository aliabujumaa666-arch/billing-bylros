import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Check } from 'lucide-react';

interface TourStep {
  target: string;
  title: string;
  content: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
}

interface OnboardingTourProps {
  steps: TourStep[];
  onComplete: () => void;
  storageKey?: string;
}

export function OnboardingTour({ steps, onComplete, storageKey = 'onboarding-completed' }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    const completed = localStorage.getItem(storageKey);
    if (!completed) {
      setTimeout(() => setIsActive(true), 1000);
    }
  }, [storageKey]);

  useEffect(() => {
    if (isActive && steps[currentStep]) {
      updatePosition();
      window.addEventListener('resize', updatePosition);
      return () => window.removeEventListener('resize', updatePosition);
    }
  }, [isActive, currentStep, steps]);

  const updatePosition = () => {
    const step = steps[currentStep];
    if (!step) return;

    const element = document.querySelector(step.target);
    if (!element) return;

    const rect = element.getBoundingClientRect();
    const placement = step.placement || 'bottom';

    let top = 0;
    let left = 0;

    switch (placement) {
      case 'bottom':
        top = rect.bottom + 10;
        left = rect.left + rect.width / 2;
        break;
      case 'top':
        top = rect.top - 10;
        left = rect.left + rect.width / 2;
        break;
      case 'left':
        top = rect.top + rect.height / 2;
        left = rect.left - 10;
        break;
      case 'right':
        top = rect.top + rect.height / 2;
        left = rect.right + 10;
        break;
    }

    setPosition({ top, left });

    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem(storageKey, 'true');
    setIsActive(false);
    onComplete();
  };

  const handleSkip = () => {
    localStorage.setItem(storageKey, 'true');
    setIsActive(false);
  };

  if (!isActive || !steps[currentStep]) {
    return null;
  }

  const step = steps[currentStep];
  const element = document.querySelector(step.target);

  if (!element) {
    return null;
  }

  const rect = element.getBoundingClientRect();

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-[9998]" onClick={handleSkip} />

      <div
        className="fixed z-[9999] pointer-events-none"
        style={{
          top: `${rect.top - 8}px`,
          left: `${rect.left - 8}px`,
          width: `${rect.width + 16}px`,
          height: `${rect.height + 16}px`,
        }}
      >
        <div className="absolute inset-0 border-2 border-[#bb2738] rounded-lg animate-pulse" />
        <div className="absolute inset-0 bg-[#bb2738]/10 rounded-lg" />
      </div>

      <div
        className="fixed z-[9999] bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in fade-in duration-300"
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
          transform: step.placement === 'bottom' || step.placement === 'top'
            ? 'translateX(-50%)'
            : step.placement === 'left'
            ? 'translate(-100%, -50%)'
            : 'translateY(-50%)'
        }}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-medium text-slate-500">
                Step {currentStep + 1} of {steps.length}
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-800">{step.title}</h3>
          </div>
          <button
            onClick={handleSkip}
            className="p-1 hover:bg-slate-100 rounded transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <p className="text-slate-600 mb-6">{step.content}</p>

        <div className="flex items-center gap-2 mb-4">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`h-1 flex-1 rounded-full transition-colors ${
                index === currentStep
                  ? 'bg-[#bb2738]'
                  : index < currentStep
                  ? 'bg-green-500'
                  : 'bg-slate-200'
              }`}
            />
          ))}
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={handleSkip}
            className="text-sm text-slate-600 hover:text-slate-800 transition-colors"
          >
            Skip Tour
          </button>
          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                onClick={handlePrevious}
                className="flex items-center gap-1 px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
            )}
            <button
              onClick={handleNext}
              className="flex items-center gap-1 px-4 py-2 bg-[#bb2738] hover:bg-[#a01f2f] text-white rounded-lg transition-colors"
            >
              {currentStep === steps.length - 1 ? (
                <>
                  <Check className="w-4 h-4" />
                  Finish
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
