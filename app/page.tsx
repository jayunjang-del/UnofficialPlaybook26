"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type SpreadScene = { kind: "spread"; left: number; right: number };
type CutScene = {
  kind: "cut";
  left: number;
  front: number;
  back: number;
  base: number;
  flipped: boolean;
};
type OverlayScene = { kind: "overlay"; left: 12; right: 13; flipped: boolean };
type CoverScene =
  | { kind: "cover"; page: number }
  | { kind: "end"; page: number };
type Scene = SpreadScene | CutScene | OverlayScene | CoverScene;
type Direction = "next" | "prev";
type TurnState = {
  direction: Direction;
  progress: number;
  settling: boolean;
  startX: number;
  moved: number;
};

const DESCRIPTION =
  "Built from intern surveys, photos and drawings, this unofficial playbook captures the awkward questions, small mistakes and shared moments that formal onboarding guides tend to leave out.";

const standardSpreads = (start: number, end: number): SpreadScene[] => {
  const spreads: SpreadScene[] = [];
  for (let page = start; page <= end; page += 2) {
    spreads.push({ kind: "spread", left: page, right: page + 1 });
  }
  return spreads;
};

const SCENES: Scene[] = [
  { kind: "cover", page: 1 },
  { kind: "spread", left: 2, right: 3 },
  { kind: "spread", left: 4, right: 5 },
  { kind: "cut", left: 6, front: 7, back: 8, base: 9, flipped: false },
  { kind: "cut", left: 6, front: 7, back: 8, base: 9, flipped: true },
  { kind: "spread", left: 10, right: 11 },
  { kind: "overlay", left: 12, right: 13, flipped: false },
  { kind: "overlay", left: 12, right: 13, flipped: true },
  ...standardSpreads(14, 23),
  { kind: "cut", left: 24, front: 25, back: 26, base: 27, flipped: false },
  { kind: "cut", left: 24, front: 25, back: 26, base: 27, flipped: true },
  ...standardSpreads(28, 41),
  { kind: "cut", left: 42, front: 43, back: 44, base: 45, flipped: false },
  { kind: "cut", left: 42, front: 43, back: 44, base: 45, flipped: true },
  ...standardSpreads(46, 61),
  { kind: "end", page: 62 },
];

function pageSrc(page: number) {
  if (page === 1) return "/pages/page.png";
  if (page === 12) return "/pages/page12_overlay-base.png";
  return `/pages/page${page}.png`;
}

function PageImage({ page, priority = false }: { page: number; priority?: boolean }) {
  return (
    <img
      alt={`Playbook page ${page}`}
      className="page-image"
      draggable={false}
      loading={priority ? "eager" : "lazy"}
      src={pageSrc(page)}
    />
  );
}

function Vellum({ reverse = false }: { reverse?: boolean }) {
  return (
    <div className={`vellum ${reverse ? "vellum-reverse" : ""}`}>
      <div className="vellum-grain" />
      <img
        alt="A transparent tracing-paper overlay revealing the intern's inner feelings"
        className="vellum-ink"
        draggable={false}
        src="/pages/page12-1_overlay-ink.png"
      />
    </div>
  );
}

function StaticSide({ scene, side }: { scene: Scene; side: "left" | "right" }) {
  if (scene.kind === "cover" || scene.kind === "end") return null;
  if (scene.kind === "spread") {
    return <PageImage page={side === "left" ? scene.left : scene.right} />;
  }

  if (scene.kind === "cut") {
    if (side === "left") {
      return (
        <>
          <PageImage page={scene.left} />
          {scene.flipped ? (
            <img
              alt="Back of the short chapter page"
              className="special-sheet special-sheet-left"
              draggable={false}
              src={pageSrc(scene.back)}
            />
          ) : null}
        </>
      );
    }
    return (
      <>
        <PageImage page={scene.base} />
        {!scene.flipped ? (
          <img
            alt="Short chapter-opening page"
            className="special-sheet special-sheet-right"
            draggable={false}
            src={pageSrc(scene.front)}
          />
        ) : null}
      </>
    );
  }

  if (side === "left") {
    return (
      <>
        <PageImage page={scene.left} />
        {scene.flipped ? <Vellum /> : null}
      </>
    );
  }
  return (
    <>
      <PageImage page={scene.right} />
      {!scene.flipped ? <Vellum reverse /> : null}
    </>
  );
}

function Surface({ children, side }: { children: React.ReactNode; side: "left" | "right" }) {
  return <div className={`page-surface page-surface-${side}`}>{children}</div>;
}

function isForwardSpecial(current: Scene, next: Scene) {
  return (
    (current.kind === "cut" && !current.flipped && next.kind === "cut" && next.flipped) ||
    (current.kind === "overlay" && !current.flipped && next.kind === "overlay" && next.flipped)
  );
}

function isReverseSpecial(current: Scene, previous: Scene) {
  return (
    (current.kind === "cut" && current.flipped && previous.kind === "cut" && !previous.flipped) ||
    (current.kind === "overlay" && current.flipped && previous.kind === "overlay" && !previous.flipped)
  );
}

function WireBinding({ placement }: { placement: "left" | "center" | "right" }) {
  return (
    <div aria-hidden="true" className={`wire-binding wire-binding-${placement}`}>
      <div className="wire-spine" />
      <div className="wire-loops" />
    </div>
  );
}

function Spread({ scene }: { scene: Scene }) {
  if (scene.kind === "cover" || scene.kind === "end") {
    return (
      <div className={`closed-book ${scene.kind === "end" ? "closed-book-back" : ""}`}>
        <Surface side="right">
          <PageImage page={scene.page} priority />
        </Surface>
        <WireBinding placement={scene.kind === "end" ? "right" : "left"} />
      </div>
    );
  }

  return (
    <div className="spread">
      <Surface side="left"><StaticSide scene={scene} side="left" /></Surface>
      <Surface side="right"><StaticSide scene={scene} side="right" /></Surface>
      <WireBinding placement="center" />
    </div>
  );
}

function TurnLayer({ current, target, turn }: { current: Scene; target: Scene; turn: TurnState }) {
  const isNext = turn.direction === "next";
  const forwardSpecial = isNext && isForwardSpecial(current, target);
  const reverseSpecial = !isNext && isReverseSpecial(current, target);

  let underLeft: React.ReactNode;
  let underRight: React.ReactNode;
  let front: React.ReactNode;
  let back: React.ReactNode;
  let specialClass = "";

  if (isNext && current.kind === "cover" && target.kind === "spread") {
    underLeft = <div className="stage-void" />;
    underRight = <StaticSide scene={target} side="right" />;
    front = <PageImage page={current.page} priority />;
    back = <StaticSide scene={target} side="left" />;
  } else if (isNext && target.kind === "end") {
    underLeft = <StaticSide scene={current} side="left" />;
    underRight = <div className="stage-void" />;
    front = <StaticSide scene={current} side="right" />;
    back = <PageImage page={target.page} priority />;
  } else if (!isNext && current.kind === "end") {
    underLeft = <StaticSide scene={target} side="left" />;
    underRight = <div className="stage-void" />;
    front = <PageImage page={current.page} priority />;
    back = <StaticSide scene={target} side="right" />;
  } else if (forwardSpecial && current.kind === "cut") {
    underLeft = <PageImage page={current.left} />;
    underRight = <PageImage page={current.base} />;
    front = <img alt="Chapter page front" className="special-sheet" draggable={false} src={pageSrc(current.front)} />;
    back = <img alt="Chapter page back" className="special-sheet" draggable={false} src={pageSrc(current.back)} />;
    specialClass = "turn-leaf-cut";
  } else if (forwardSpecial && current.kind === "overlay") {
    underLeft = <PageImage page={current.left} />;
    underRight = <PageImage page={current.right} />;
    front = <Vellum reverse />;
    back = <Vellum />;
    specialClass = "turn-leaf-vellum";
  } else if (reverseSpecial && current.kind === "cut") {
    underLeft = <PageImage page={current.left} />;
    underRight = <PageImage page={current.base} />;
    front = <img alt="Chapter page back" className="special-sheet" draggable={false} src={pageSrc(current.back)} />;
    back = <img alt="Chapter page front" className="special-sheet" draggable={false} src={pageSrc(current.front)} />;
    specialClass = "turn-leaf-cut";
  } else if (reverseSpecial && current.kind === "overlay") {
    underLeft = <PageImage page={current.left} />;
    underRight = <PageImage page={current.right} />;
    front = <Vellum />;
    back = <Vellum reverse />;
    specialClass = "turn-leaf-vellum";
  } else if (isNext) {
    underLeft = <StaticSide scene={current} side="left" />;
    underRight = <StaticSide scene={target} side="right" />;
    front = <StaticSide scene={current} side="right" />;
    back = <StaticSide scene={target} side="left" />;
  } else {
    underLeft = <StaticSide scene={target} side="left" />;
    underRight = <StaticSide scene={current} side="right" />;
    front = <StaticSide scene={current} side="left" />;
    back = <StaticSide scene={target} side="right" />;
  }

  const degrees = isNext ? -180 * turn.progress : 180 * turn.progress;
  const turnStyle = {
    transform: `perspective(2200px) rotateY(${degrees}deg)`,
    transition: turn.settling ? "transform 540ms cubic-bezier(.22,.72,.18,1)" : "none",
  };

  return (
    <div className="spread transition-spread">
      <Surface side="left">{underLeft}</Surface>
      <Surface side="right">{underRight}</Surface>
      <div className={`turn-leaf turn-leaf-${turn.direction} ${specialClass}`} style={turnStyle}>
        <div className="turn-face turn-face-front">{front}</div>
        <div className="turn-face turn-face-back">{back}</div>
      </div>
      <WireBinding placement="center" />
    </div>
  );
}

function pageLabel(scene: Scene) {
  if (scene.kind === "cover") return "Cover";
  if (scene.kind === "end") return "Back cover";
  if (scene.kind === "spread") return `${scene.left}–${scene.right}`;
  if (scene.kind === "overlay") return "12–13";
  return `${scene.left}–${scene.base}`;
}

export default function Home() {
  const [sceneIndex, setSceneIndex] = useState(0);
  const [turn, setTurn] = useState<TurnState | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number | null>(null);
  const current = SCENES[sceneIndex];
  const canGoPrevious = sceneIndex > 0;
  const canGoNext = sceneIndex < SCENES.length - 1;

  const finishTurn = useCallback((direction: Direction) => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      setSceneIndex((index) => index + (direction === "next" ? 1 : -1));
      setTurn(null);
    }, 555);
  }, []);

  const animateTurn = useCallback((direction: Direction) => {
    if (turn) return;
    if (direction === "next" && !canGoNext) return;
    if (direction === "prev" && !canGoPrevious) return;
    setTurn({ direction, progress: 0, settling: true, startX: 0, moved: 0 });
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        setTurn((value) => (value ? { ...value, progress: 1 } : value));
      });
    });
    finishTurn(direction);
  }, [canGoNext, canGoPrevious, finishTurn, turn]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") animateTurn("next");
      if (event.key === "ArrowLeft") animateTurn("prev");
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [animateTurn]);

  useEffect(() => () => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
  }, []);

  const target = useMemo(() => {
    if (!turn) return null;
    return SCENES[sceneIndex + (turn.direction === "next" ? 1 : -1)] ?? null;
  }, [sceneIndex, turn]);

  const stageClassName = useMemo(() => {
    const classes = ["book-stage"];
    if (current.kind === "cover") classes.push("book-stage-cover");
    if (current.kind === "end") classes.push("book-stage-end");
    if (turn && target) {
      if (current.kind === "cover") classes.push("book-stage-from-cover");
      if (current.kind === "end") classes.push("book-stage-from-end");
      if (target.kind === "end") classes.push("book-stage-to-end");
    }
    return classes.join(" ");
  }, [current.kind, target, turn]);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (turn || !stageRef.current) return;
    const bounds = stageRef.current.getBoundingClientRect();
    const localX = event.clientX - bounds.left;
    let direction: Direction = localX >= bounds.width / 2 ? "next" : "prev";
    if (current.kind === "cover") direction = "next";
    if (current.kind === "end") direction = "prev";
    if (direction === "next" && !canGoNext) return;
    if (direction === "prev" && !canGoPrevious) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setTurn({ direction, progress: 0, settling: false, startX: event.clientX, moved: 0 });
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!turn || turn.settling || !stageRef.current) return;
    const bounds = stageRef.current.getBoundingClientRect();
    const pageWidth = bounds.width / 2;
    const delta = event.clientX - turn.startX;
    const directionalDelta = turn.direction === "next" ? -delta : delta;
    const progress = Math.max(0, Math.min(1, directionalDelta / Math.max(pageWidth, 1)));
    setTurn({ ...turn, progress, moved: Math.max(turn.moved, Math.abs(delta)) });
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!turn || turn.settling) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    const shouldComplete = turn.progress > 0.18 || turn.moved < 7;
    if (shouldComplete) {
      const direction = turn.direction;
      setTurn({ ...turn, progress: 1, settling: true });
      finishTurn(direction);
    } else {
      setTurn({ ...turn, progress: 0, settling: true });
      timerRef.current = window.setTimeout(() => setTurn(null), 360);
    }
  };

  const handlePointerCancel = () => {
    if (!turn || turn.settling) return;
    setTurn({ ...turn, progress: 0, settling: true });
    timerRef.current = window.setTimeout(() => setTurn(null), 360);
  };

  return (
    <main className="site-shell">
      <header className="site-header">
        <div>
          <p className="eyebrow">NEX · SUMMER INTERNSHIP · 2026</p>
          <h1>2026 UNOFFICIAL PLAYBOOK</h1>
        </div>
        <p className="site-description">{DESCRIPTION}</p>
      </header>

      <section className="reader" aria-label="Interactive digital playbook">
        <div
          ref={stageRef}
          className={stageClassName}
          onPointerCancel={handlePointerCancel}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          {turn && target ? <TurnLayer current={current} target={target} turn={turn} /> : <Spread scene={current} />}
          <div aria-hidden="true" className="book-floor-shadow" />
        </div>

        <div className="reader-controls">
          <button aria-label="Previous page" className="nav-button" disabled={!canGoPrevious || Boolean(turn)} onClick={() => animateTurn("prev")} type="button">←</button>
          <div className="reader-status" aria-live="polite">
            <span>{pageLabel(current)}</span>
            <span className="reader-hint">Click an edge or drag to turn</span>
          </div>
          <button aria-label="Next page" className="nav-button" disabled={!canGoNext || Boolean(turn)} onClick={() => animateTurn("next")} type="button">→</button>
        </div>
      </section>
    </main>
  );
}
