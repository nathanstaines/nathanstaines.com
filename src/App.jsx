import ReactGA from 'react-ga4';
import MessageDisplay from './components/MessageDisplay';
import SocialIcons from './components/SocialIcons';
import StatBox from './components/StatBox';
import { MESSAGE } from './constants';
import useTypingGame from './hooks/useTypingGame';

export default function App() {
  const game = useTypingGame({
    onEvent: (event) => {
      if (event.type === 'completed') {
        ReactGA.event({
          category: 'game',
          action: 'completed',
          label: `${event.payload.wpm} wpm`,
        });
      }
    },
  });

  const { state, isMobile, handleKeyDown, inputRef, focus } = game;

  // ── Mobile view: plain readable text, no game UI ──
  if (isMobile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-text">
        <div className="w-full max-w-xl relative z-10">
          <header className="mb-10">
            <div className="font-extrabold text-white text-5xl tracking-tight">
              Nathan <span className="text-accent">Staines</span>
            </div>
          </header>
          <p className="text-lg font-semibold leading-[1.9] text-text">
            {MESSAGE}
          </p>
        </div>
        <SocialIcons />
      </div>
    );
  }

  // ── Desktop view: full typing game ──
  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen p-8 text-text cursor-text"
      onClick={focus}
    >
      <div className="w-full max-w-3xl relative z-10">
        <header className="flex items-baseline gap-2 mb-12">
          <div className="font-extrabold text-white text-6xl tracking-tight">
            Nathan <span className="text-accent">Staines</span>
          </div>
        </header>

        {/* Typing area */}
        <div
          ref={inputRef}
          tabIndex={0}
          role="application"
          aria-label="Typing test. Press any key to start. Tab to restart."
          onKeyDown={handleKeyDown}
          className="cursor-text mb-8 outline-none"
        >
          <MessageDisplay
            message={state.message}
            typed={state.typed}
            finished={state.finished}
          />
        </div>

        {/* Progress bar */}
        <div
          className="w-full mb-6 overflow-hidden rounded-full bg-border h-progress"
          aria-hidden="true"
        >
          <div
            className="h-full rounded-full transition-all duration-300 ease-out bg-gradient-to-r from-accent to-correct"
            style={{ width: `${state.progress}%` }}
          />
        </div>

        {/* Stats row */}
        <div
          className="flex items-start gap-6"
          role="region"
          aria-label="Typing statistics"
        >
          <StatBox label="WPM" value={state.wpm ?? '—'} highlight={state.wpm > 60} />
          <StatBox
            label="Time"
            value={state.started ? state.elapsed.toFixed(1) : '—'}
            unit={state.started ? 's' : undefined}
          />
          <StatBox
            label="Accuracy"
            value={state.accuracy != null ? `${state.accuracy}%` : '—'}
          />
          <StatBox label="Errors" value={state.started ? state.errors : '—'} />
          <span
            className="text-muted text-[0.65rem] ml-auto"
            aria-label="Press Tab to restart"
          >
            Tab → restart
          </span>
        </div>
      </div>
      <SocialIcons />
    </div>
  );
}
