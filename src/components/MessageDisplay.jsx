export default function MessageDisplay({ message, typed, finished }) {
  return (
    <div
      className="select-none text-[1.25rem] font-semibold leading-[1.9] tracking-[0.3px]"
      role="textbox"
      aria-label="Typing message. Start typing to begin the test."
      aria-readonly="true"
      aria-multiline="true"
    >
      {[...message].map((ch, i) => {
        let className = 'transition-colors duration-[50ms] rounded-sm ';

        if (i < typed.length) {
          className +=
            typed[i] === ch ? 'text-correct' : 'text-wrong bg-wrong/15';
        } else if (i === typed.length) {
          className += 'char-current';
        } else {
          className += 'text-pending';
        }

        return (
          <span key={i} className={className} aria-hidden="true">
            {ch}
          </span>
        );
      })}

      {finished && (
        <p
          className="text-center mt-4 uppercase tracking-[3px] text-[0.7rem]"
          role="status"
          aria-live="polite"
        >
          ✓ Complete
        </p>
      )}
    </div>
  );
}
