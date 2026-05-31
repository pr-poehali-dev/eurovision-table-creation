import { useState, useRef, useCallback, useEffect } from "react";
import AdminPanel from "./AdminPanel";

const VOTE_ORDER = [1, 2, 3, 4, 5, 6, 7, 8, 10, 12];

const FLAG_EMOJIS: Record<string, string> = {
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

interface FlyingHeart {
  id: string;
  points: number;
  targetId: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  active: boolean;
}

const DEFAULT_COUNTRIES: Country[] = [
  "Albania","Armenia","Australia","Austria","Azerbaijan","Belgium","Bulgaria",
  "Croatia","Cyprus","Czech Republic","Denmark","Estonia","Finland","France",
  "Georgia","Germany","Greece","Hungary","Iceland","Ireland","Israel","Italy",
  "Latvia","Lithuania","Malta","Moldova","Netherlands","Norway","Poland",
  "Portugal","Romania","Serbia","Slovenia","Spain","Sweden","Switzerland",
  "Ukraine","United Kingdom"
].map(name => ({ id: name, name, points: 0, receivedFrom: [] }));

const DEFAULT_VOTERS: Voter[] = [
  "Albania","Armenia","Australia","Austria","Azerbaijan","Belgium","Bulgaria",
  "Croatia","Cyprus","Czech Republic","Denmark","Estonia","Finland","France",
  "Georgia","Germany","Greece","Hungary","Iceland","Ireland","Israel","Italy",
  "Latvia","Lithuania","Malta","Moldova","Netherlands","Norway","Poland",
  "Portugal","Romania","Serbia","Slovenia","Spain","Sweden","Switzerland",
  "Ukraine","United Kingdom"
].map(name => ({
  id: name, name,
  votesGiven: [],
  currentVoteIndex: 0,
}));

export default function EurovisionBoard() {
  const [countries, setCountries] = useState<Country[]>(DEFAULT_COUNTRIES);
  const [voters, setVoters] = useState<Voter[]>(DEFAULT_VOTERS);
  const [currentVoter, setCurrentVoter] = useState<Voter>(voters[0]);
  const [showAdmin, setShowAdmin] = useState(false);
  const [flyingHeart, setFlyingHeart] = useState<FlyingHeart | null>(null);
  const [animatingRow, setAnimatingRow] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const rowRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const heartButtonRef = useRef<HTMLDivElement | null>(null);
  const tableRef = useRef<HTMLDivElement | null>(null);

  const sortedCountries = [...countries].sort((a, b) => b.points - a.points || a.name.localeCompare(b.name));

  const leftCol = sortedCountries.slice(0, Math.ceil(sortedCountries.length / 2));
  const rightCol = sortedCountries.slice(Math.ceil(sortedCountries.length / 2));

  const currentPoints = VOTE_ORDER[currentVoter.currentVoteIndex];
  const remainingVotes = VOTE_ORDER.slice(currentVoter.currentVoteIndex);

  const handleVote = useCallback((targetCountryId: string) => {
    if (isAnimating) return;
    if (targetCountryId === currentVoter.id) return;
    if (currentVoter.votesGiven.includes(targetCountryId)) return;
    if (currentVoter.currentVoteIndex >= VOTE_ORDER.length) return;

    const pts = VOTE_ORDER[currentVoter.currentVoteIndex];

    const targetRow = rowRefs.current[targetCountryId];
    const sourceEl = heartButtonRef.current;
    const tableEl = tableRef.current;

    if (!targetRow || !sourceEl || !tableEl) {
      applyVote(targetCountryId, pts);
      return;
    }

    setIsAnimating(true);

    const srcRect = sourceEl.getBoundingClientRect();
    const tgtRect = targetRow.getBoundingClientRect();

    const fromX = srcRect.left + srcRect.width / 2;
    const fromY = srcRect.top + srcRect.height / 2;
    const toX = tgtRect.left + 30;
    const toY = tgtRect.top + tgtRect.height / 2;

    const heartId = `heart-${Date.now()}`;
    setFlyingHeart({ id: heartId, points: pts, targetId: targetCountryId, fromX, fromY, toX, toY, active: true });

    setTimeout(() => {
      setFlyingHeart(null);
      setAnimatingRow(targetCountryId);
      applyVote(targetCountryId, pts);
      setTimeout(() => {
        setAnimatingRow(null);
        setIsAnimating(false);
      }, 800);
    }, 900);
  }, [isAnimating, currentVoter]);

  const applyVote = (targetCountryId: string, pts: number) => {
    setCountries(prev =>
      prev.map(c =>
        c.id === targetCountryId
          ? { ...c, points: c.points + pts, receivedFrom: [...c.receivedFrom, currentVoter.id] }
          : c
      )
    );

    const updatedVoter: Voter = {
      ...currentVoter,
      votesGiven: [...currentVoter.votesGiven, targetCountryId],
      currentVoteIndex: currentVoter.currentVoteIndex + 1,
    };

    setVoters(prev => prev.map(v => v.id === currentVoter.id ? updatedVoter : v));
    setCurrentVoter(updatedVoter);
  };

  const canVoteFor = (countryId: string) => {
    if (isAnimating) return false;
    if (countryId === currentVoter.id) return false;
    if (currentVoter.votesGiven.includes(countryId)) return false;
    if (currentVoter.currentVoteIndex >= VOTE_ORDER.length) return false;
    return true;
  };

  const CountryRow = ({ country }: { country: Country }) => {
    const votable = canVoteFor(country.id);
    const alreadyVoted = currentVoter.votesGiven.includes(country.id);
    const isAnimRow = animatingRow === country.id;

    return (
      <div
        ref={el => { rowRefs.current[country.id] = el; }}
        onClick={() => votable && handleVote(country.id)}
        className={`country-row ${votable ? "votable" : ""} ${alreadyVoted ? "voted" : ""} ${isAnimRow ? "row-flash" : ""} ${country.id === currentVoter.id ? "self-country" : ""}`}
        style={{ transition: "all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)" }}
      >
        <div className="row-flag">
          {FLAG_EMOJIS[country.name] || "🏳️"}
        </div>
        <div className="row-name">{country.name.toUpperCase()}</div>
        <div className="row-points">{country.points}</div>
      </div>
    );
  };

  return (
    <div className="eurovision-root">
      <div className="bg-overlay" />

      {flyingHeart && (
        <div
          className="flying-heart"
          style={{
            left: flyingHeart.fromX,
            top: flyingHeart.fromY,
            "--to-x": `${flyingHeart.toX - flyingHeart.fromX}px`,
            "--to-y": `${flyingHeart.toY - flyingHeart.fromY}px`,
          } as React.CSSProperties}
        >
          <span className="heart-icon">❤️</span>
          <span className="heart-pts">{flyingHeart.points}</span>
        </div>
      )}

      <div className="board-container" ref={tableRef}>
        <div className="board-header">
          <div className="header-title">EUROVISION SONG CONTEST</div>
          <div className="header-year">SCOREBOARD</div>
        </div>

        <div className="board-columns">
          <div className="board-col">
            {leftCol.map(c => <CountryRow key={c.id} country={c} />)}
          </div>
          <div className="board-center">
            <div className="center-heart">❤️</div>
          </div>
          <div className="board-col">
            {rightCol.map(c => <CountryRow key={c.id} country={c} />)}
          </div>
        </div>

        <div className="voter-bar">
          <div ref={heartButtonRef} className="voter-votes">
            {remainingVotes.map((pts, i) => (
              <span key={i} className={`vote-badge ${i === 0 ? "vote-next" : ""}`}>
                <span className="vote-heart">❤️</span>
                <span className="vote-num">{pts}</span>
              </span>
            ))}
          </div>
          <div className="voter-flag">{FLAG_EMOJIS[currentVoter.name] || "🏳️"}</div>
          <div className="voter-name">{currentVoter.name.toUpperCase()}</div>
          {currentVoter.currentVoteIndex >= VOTE_ORDER.length && (
            <div className="voter-done">ГОЛОСОВАНИЕ ЗАВЕРШЕНО</div>
          )}
        </div>

        <div className="voter-switcher">
          <span className="switcher-label">Голосует:</span>
          <div className="switcher-list">
            {voters.map(v => (
              <button
                key={v.id}
                onClick={() => setCurrentVoter(v)}
                className={`switcher-btn ${v.id === currentVoter.id ? "active" : ""}`}
                title={v.name}
              >
                {FLAG_EMOJIS[v.name] || "🏳️"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button className="admin-btn" onClick={() => setShowAdmin(true)}>
        ⚙️ Управление
      </button>

      {showAdmin && (
        <AdminPanel
          countries={countries}
          voters={voters}
          currentVoter={currentVoter}
          onClose={() => setShowAdmin(false)}
          onCountriesChange={setCountries}
          onVotersChange={(v) => { setVoters(v); setCurrentVoter(v[0]); }}
          onReset={() => {
            const fresh = countries.map(c => ({ ...c, points: 0, receivedFrom: [] }));
            const freshVoters = voters.map(v => ({ ...v, votesGiven: [], currentVoteIndex: 0 }));
            setCountries(fresh);
            setVoters(freshVoters);
            setCurrentVoter(freshVoters[0]);
          }}
        />
      )}
    </div>
  );
}
