import { useEffect, useState } from "react";

interface TextScrambleProps {
  text: string;
  className?: string;
  speed?: number;
  delay?: number;
  trigger?: boolean;
  scrambleChars?: string;
}

/**
 * TextScramble — scrambles characters then reveals the final text.
 * Cyberpunk-style decode effect.
 */
export function TextScramble({
  text,
  className = "",
  speed = 30,
  delay = 0,
  trigger = true,
  scrambleChars = "!<>-_\\/[]{}—=+*^?#________",
}: TextScrambleProps) {
  const [displayText, setDisplayText] = useState(text);
  const [isScrambling, setIsScrambling] = useState(false);

  useEffect(() => {
    if (!trigger) return;
    let timeout: ReturnType<typeof setTimeout>;
    let frame: number;
    let queue: { from: string; to: string; start: number; end: number; char?: string }[] = [];

    setIsScrambling(true);
    const from = displayText;
    const to = text;
    const length = Math.max(from.length, to.length);
    queue = [];

    for (let i = 0; i < length; i++) {
      const start = Math.floor(Math.random() * 400);
      const end = start + Math.floor(Math.random() * 400) + 200;
      queue.push({
        from: from[i] ?? "",
        to: to[i] ?? "",
        start,
        end,
      });
    }

    let frame2 = 0;
    const update = () => {
      let output = "";
      let complete = 0;
      for (let i = 0; i < queue.length; i++) {
        const { from, to, start, end } = queue[i];
        if (frame2 >= end) {
          complete++;
          output += to;
        } else if (frame2 >= start) {
          if (!queue[i].char || Math.random() < 0.28) {
            queue[i].char = scrambleChars[Math.floor(Math.random() * scrambleChars.length)];
          }
          output += queue[i].char;
        } else {
          output += from;
        }
      }
      setDisplayText(output);
      if (complete < queue.length) {
        frame2 += speed;
        frame = requestAnimationFrame(update);
      } else {
        setIsScrambling(false);
        setDisplayText(text);
      }
    };

    timeout = setTimeout(() => {
      frame = requestAnimationFrame(update);
    }, delay);

    return () => {
      clearTimeout(timeout);
      cancelAnimationFrame(frame);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, trigger]);

  return (
    <span className={className}>
      {displayText}
      {isScrambling && <span className="scramble-cursor" />}
    </span>
  );
}
