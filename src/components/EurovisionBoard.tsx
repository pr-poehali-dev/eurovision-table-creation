import { useState, useRef, useCallback } from "react";
import AdminPanel from "./AdminPanel";

const VOTE_ORDER = [1, 2, 3, 4, 5, 6, 7, 8, 10, 12];

export const FLAG_EMOJIS: Record<string, string> = {
  "Albania": "🇦🇱", "Andorra": "🇦🇩", "Armenia": "🇦🇲", "Australia": "🇦🇺",
  "Austria": "🇦🇹", "Azerbaijan": "🇦🇿", "Belarus": "🇧🇾", "Belgium": "🇧🇪",
  "Bosnia": "🇧🇦", "Bulgaria": "🇧🇬", "Croatia": "🇭🇷", "Cyprus": "🇨🇾",
  "Czech Republic": "🇨🇿", "Denmark": "🇩🇰", "Estonia": "🇪🇪", "Finland": "🇫🇮",
  "France": "🇫🇷", "Georgia": "🇬🇪", "Germany": "🇩🇪", "Greece": "🇬🇷",
  "Hungary": "🇭🇺", "Iceland": "🇮🇸", "Ireland": "🇮🇪", "Israel": "🇮🇱",
  "Italy": "🇮🇹", "Latvia": "🇱🇻", "Lithuania": "🇱🇹", "Luxembourg": "🇱🇺",
  "Malta": "🇲🇹", "Moldova": "🇲🇩", "Montenegro": "🇲🇪", "Netherlands": "🇳🇱",
  "North Macedonia": "🇲🇰", "Norway": "🇳🇴", "Poland": "🇵🇱", "Portugal": "🇵🇹",
  "Romania": "🇷🇴", "Russia": "🇷🇺", "San Marino": "🇸🇲", "Serbia": "🇷🇸",
  "Slovakia": "🇸🇰", "Slovenia": "🇸🇮", "Spain": "🇪🇸", "Sweden": "🇸🇪",
  "Switzerland": "🇨🇭", "Turkey": "🇹🇷", "Ukraine": "🇺🇦", "United Kingdom": "🇬🇧",
};

export interface Country {
  id: string;
  name: string;
  points: number;
  receivedFrom: string[];
}

export interface Voter {
  id: string;
  name: string;
  votesGiven: string[];
  currentVoteIndex: number;
}

interface FlyingBadge {
  id: string;
  points: number;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
}

interface PointBadge {
  countryId: string;
  points: number;
}

const DEFAULT_NAMES = [
  "Albania","Armenia","Australia","Austria","Azerbaijan","Belgium","Bulgaria",
  "Croatia","Cyprus","Czech Republic","Denmark","Estonia","Finland","France",
  "Georgia","Germany","Greece","Hungary","Iceland","Ireland","Israel","Italy",
  "Latvia","Lithuania","Malta","Moldova","Netherlands","Norway","Poland",
  "Portugal","Romania","Serbia","Slovenia","Spain","Sweden","Switzerland",
  "Ukraine","United Kingdom"
];

const makeCountries = (): Country[] =>
  DEFAULT_NAMES.map(name => ({ id: name, name, points: 0, receivedFrom: [] }));

const makeVoters = (): Voter[] =>
  DEFAULT_NAMES.map(name => ({ id: name, name, votesGiven: [], currentVoteIndex: 0 }));

export default function EurovisionBoard() {
  const [countries, setCountries] = useState<Country[]>(makeCountries());
  const [voters, setVoters] = useState<Voter[]>(makeVoters());
  const [currentVoter, setCurrentVoter] = useState<Voter>(() => makeVoters()[0]);
  const [showAdmin, setShowAdmin] = useState(false);
  const [flyingBadge, setFlyingBadge] = useState<FlyingBadge | null>(null);
  const [pointBadges, setPointBadges] = useState<PointBadge[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [flashRowId, setFlashRowId] = useState<string | null>(null);

  const rowRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const prevPositions = useRef<Record<string, DOMRect>>({});
  const badgeSourceRef = useRef<HTMLDivElement | null>(null);

  const sorted = [...countries].sort((a, b) => b.points - a.points || a.name.localeCompare(b.name));
  const half = Math.ceil(sorted.length / 2);
  const leftCol = sorted.slice(0, half);
  const rightCol = sorted.slice(half);
  const remainingVotes = VOTE_ORDER.slice(currentVoter.currentVoteIndex);

  const canVoteFor = useCallback((id: string) => {
    if (isAnimating) return false;
    if (id === currentVoter.id) return false;
    if (currentVoter.votesGiven.includes(id)) return false;
    if (currentVoter.currentVoteIndex >= VOTE_ORDER.length) return false;
    return true;
  }, [isAnimating, currentVoter]);

  const snapshotPositions = () => {
    const snap: Record<string, DOMRect> = {};
    for (const [id, el] of Object.entries(rowRefs.current)) {
      if (el) snap[id] = el.getBoundingClientRect();
    }
    prevPositions.current = snap;
  };

  const runFlipAnimation = () => {
    for (const [id, el] of Object.entries(rowRefs.current)) {
      if (!el) continue;
      const prev = prevPositions.current[id];
      if (!prev) continue;
      const curr = el.getBoundingClientRect();
      const dx = prev.left - curr.left;
      const dy = prev.top - curr.top;
      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) continue;

      el.style.transition = "none";
      el.style.transform = `translate(${dx}px, ${dy}px)`;
      el.style.zIndex = "20";

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          el.style.transition = "transform 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94)";
          el.style.transform = "translate(0,0)";
          setTimeout(() => {
            if (el) {
              el.style.transition = "";
              el.style.transform = "";
              el.style.zIndex = "";
            }
          }, 720);
        });
      });
    }
  };

  const handleVote = useCallback((targetId: string) => {
    if (!canVoteFor(targetId)) return;

    const pts = VOTE_ORDER[currentVoter.currentVoteIndex];
    const targetEl = rowRefs.current[targetId];
    const srcEl = badgeSourceRef.current;

    if (!targetEl || !srcEl) {
      doApplyVote(targetId, pts, currentVoter);
      return;
    }

    setIsAnimating(true);
    const srcRect = srcEl.getBoundingClientRect();
    const tgtRect = targetEl.getBoundingClientRect();

    setFlyingBadge({
      id: `fly-${Date.now()}`,
      points: pts,
      fromX: srcRect.left + srcRect.width / 2,
      fromY: srcRect.top + srcRect.height / 2,
      toX: tgtRect.left + 14,
      toY: tgtRect.top + tgtRect.height / 2,
    });

    setTimeout(() => {
      setFlyingBadge(null);
      setFlashRowId(targetId);

      setPointBadges(prev => {
        const without = prev.filter(b => b.countryId !== targetId);
        return [...without, { countryId: targetId, points: pts }];
      });

      snapshotPositions();

      const updatedVoter: Voter = {
        ...currentVoter,
        votesGiven: [...currentVoter.votesGiven, targetId],
        currentVoteIndex: currentVoter.currentVoteIndex + 1,
      };

      setCountries(prev =>
        prev.map(c => c.id === targetId
          ? { ...c, points: c.points + pts, receivedFrom: [...c.receivedFrom, currentVoter.id] }
          : c
        )
      );
      setVoters(prev => prev.map(v => v.id === currentVoter.id ? updatedVoter : v));
      setCurrentVoter(updatedVoter);

      setTimeout(runFlipAnimation, 20);

      setTimeout(() => {
        setFlashRowId(null);
        setIsAnimating(false);
      }, 800);
    }, 950);
  }, [canVoteFor, currentVoter]);

  const doApplyVote = (targetId: string, pts: number, voter: Voter) => {
    setCountries(prev =>
      prev.map(c => c.id === targetId
        ? { ...c, points: c.points + pts, receivedFrom: [...c.receivedFrom, voter.id] }
        : c
      )
    );
    const updated: Voter = {
      ...voter,
      votesGiven: [...voter.votesGiven, targetId],
      currentVoteIndex: voter.currentVoteIndex + 1,
    };
    setVoters(prev => prev.map(v => v.id === voter.id ? updated : v));
    setCurrentVoter(updated);
  };

  const switchVoter = (voter: Voter) => {
    setPointBadges([]);
    setCurrentVoter(voter);
  };

  const getBadge = (countryId: string) =>
    pointBadges.find(b => b.countryId === countryId);

  const HeartFlag = ({ name, badge, isTop3 }: { name: string; badge?: PointBadge; isTop3: boolean }) => (
    <div className={`ev-heart-flag-wrap ${isTop3 ? "ev-heart-flag-wrap--wave" : ""}`}>
      <svg viewBox="0 0 100 90" className="ev-heart-svg" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <clipPath id={`hclip-${name.replace(/\s/g, "")}`}>
            <path d="M50 85 C50 85 5 55 5 28 C5 12 17 2 30 2 C38 2 45 7 50 13 C55 7 62 2 70 2 C83 2 95 12 95 28 C95 55 50 85 50 85Z" />
          </clipPath>
        </defs>
        <path
          d="M50 85 C50 85 5 55 5 28 C5 12 17 2 30 2 C38 2 45 7 50 13 C55 7 62 2 70 2 C83 2 95 12 95 28 C95 55 50 85 50 85Z"
          fill={badge ? "rgba(180,10,0,0.92)" : "rgba(160,20,0,0.75)"}
          stroke="rgba(255,140,80,0.5)"
          strokeWidth="2"
        />
        <foreignObject
          x="10" y="8" width="80" height="70"
          clipPath={`url(#hclip-${name.replace(/\s/g, "")})`}
        >
          <div
            style={{
              width: "100%", height: "100%",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "38px", lineHeight: 1,
            }}
          >
            {badge
              ? <span style={{ fontFamily: "'Oswald',sans-serif", fontSize: "28px", fontWeight: 700, color: "#fff", textShadow: "0 1px 4px rgba(0,0,0,0.9)" }}>{badge.points}</span>
              : FLAG_EMOJIS[name] || "🏳️"
            }
          </div>
        </foreignObject>
        {!badge && (
          <path
            d="M50 85 C50 85 5 55 5 28 C5 12 17 2 30 2 C38 2 45 7 50 13 C55 7 62 2 70 2 C83 2 95 12 95 28 C95 55 50 85 50 85Z"
            fill="none"
            stroke="rgba(255,200,120,0.3)"
            strokeWidth="1.5"
          />
        )}
      </svg>
    </div>
  );

  const CountryRow = ({ country, rank, side, arcIndex, arcTotal }: {
    country: Country; rank: number; side: "left" | "right"; arcIndex: number; arcTotal: number;
  }) => {
    const votable = canVoteFor(country.id);
    const isSelf = country.id === currentVoter.id;
    const badge = getBadge(country.id);
    const isTop3 = rank < 3 && country.points > 0;
    const isFlash = flashRowId === country.id;

    const t = arcTotal <= 1 ? 0 : arcIndex / (arcTotal - 1);
    const arc = Math.sin(t * Math.PI) * 38;
    const indent = side === "left"
      ? { marginLeft: `${arc}px`, marginRight: 0 }
      : { marginRight: `${arc}px`, marginLeft: 0 };

    return (
      <div
        ref={el => { rowRefs.current[country.id] = el; }}
        className={[
          "ev-row",
          `ev-row--${side}`,
          votable ? "ev-row--votable" : "",
          isSelf ? "ev-row--self" : "",
          isFlash ? "ev-row--flash" : "",
        ].join(" ")}
        style={indent}
        onClick={() => votable && handleVote(country.id)}
      >
        {side === "left" ? (
          <>
            <HeartFlag name={country.name} badge={badge} isTop3={isTop3} />
            <span className="ev-name">{country.name.toUpperCase()}</span>
            <span className="ev-points">{country.points}</span>
          </>
        ) : (
          <>
            <HeartFlag name={country.name} badge={badge} isTop3={isTop3} />
            <span className="ev-name">{country.name.toUpperCase()}</span>
            <span className="ev-points">{country.points}</span>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="ev-root">
      <div className="ev-bg" />

      {flyingBadge && (
        <div
          className="ev-flying"
          style={{
            left: flyingBadge.fromX,
            top: flyingBadge.fromY,
            "--dx": `${flyingBadge.toX - flyingBadge.fromX}px`,
            "--dy": `${flyingBadge.toY - flyingBadge.fromY}px`,
          } as React.CSSProperties}
        >
          <span className="ev-flying-heart">❤</span>
          <span className="ev-flying-num">{flyingBadge.points}</span>
        </div>
      )}

      <div className="ev-board">
        <div className="ev-header">
          <div className="ev-header-sub">EUROVISION SONG CONTEST</div>
          <div className="ev-header-title">SCOREBOARD</div>
        </div>

        <div className="ev-columns">
          <div className="ev-col ev-col--left">
            {leftCol.map((c, i) => (
              <CountryRow key={c.id} country={c} rank={i} side="left" arcIndex={i} arcTotal={leftCol.length} />
            ))}
          </div>
          <div className="ev-divider">
            <div className="ev-heart-center">❤</div>
          </div>
          <div className="ev-col ev-col--right">
            {rightCol.map((c, i) => (
              <CountryRow key={c.id} country={c} rank={half + i} side="right" arcIndex={i} arcTotal={rightCol.length} />
            ))}
          </div>
        </div>

        <div className="ev-voter-bar">
          <div className="ev-voter-hearts" ref={badgeSourceRef}>
            {remainingVotes.map((pts, i) => (
              <div key={i} className={`ev-heart-badge ${i === 0 ? "ev-heart-badge--next" : ""}`}>
                <span className="ev-hb-heart">❤</span>
                <span className="ev-hb-num">{pts}</span>
              </div>
            ))}
            {remainingVotes.length === 0 && (
              <span className="ev-done-label">ГОЛОСОВАНИЕ ЗАВЕРШЕНО</span>
            )}
          </div>
          <div className="ev-voter-flag-wrap">
            <span className="ev-voter-flag">{FLAG_EMOJIS[currentVoter.name] || "🏳️"}</span>
          </div>
          <div className="ev-voter-name">{currentVoter.name.toUpperCase()}</div>
        </div>

        <div className="ev-switcher">
          <span className="ev-switcher-label">Голосует:</span>
          <div className="ev-switcher-flags">
            {voters.map(v => (
              <button
                key={v.id}
                className={`ev-sflag ${v.id === currentVoter.id ? "ev-sflag--active" : ""}`}
                onClick={() => switchVoter(v)}
                title={v.name}
              >
                {FLAG_EMOJIS[v.name] || "🏳️"}
                {v.currentVoteIndex >= VOTE_ORDER.length && <span className="ev-sflag-done">✓</span>}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button className="ev-admin-btn" onClick={() => setShowAdmin(true)}>
        ⚙ Управление
      </button>

      {showAdmin && (
        <AdminPanel
          countries={countries}
          voters={voters}
          currentVoter={currentVoter}
          onClose={() => setShowAdmin(false)}
          onCountriesChange={setCountries}
          onVotersChange={(v) => { setVoters(v); setCurrentVoter(v[0]); setPointBadges([]); }}
          onReset={() => {
            setCountries(makeCountries());
            const fv = makeVoters();
            setVoters(fv);
            setCurrentVoter(fv[0]);
            setPointBadges([]);
          }}
        />
      )}
    </div>
  );
}