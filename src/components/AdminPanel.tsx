import { useState } from "react";
import { Country, Voter } from "./EurovisionBoard";

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

interface Props {
  countries: Country[];
  voters: Voter[];
  currentVoter: Voter;
  onClose: () => void;
  onCountriesChange: (c: Country[]) => void;
  onVotersChange: (v: Voter[]) => void;
  onReset: () => void;
}

export default function AdminPanel({ countries, voters, currentVoter, onClose, onCountriesChange, onVotersChange, onReset }: Props) {
  const [tab, setTab] = useState<"countries" | "voters" | "scores">("scores");
  const [newCountry, setNewCountry] = useState("");
  const [newVoter, setNewVoter] = useState("");

  const addCountry = () => {
    const name = newCountry.trim();
    if (!name || countries.find(c => c.id === name)) return;
    onCountriesChange([...countries, { id: name, name, points: 0, receivedFrom: [] }]);
    setNewCountry("");
  };

  const removeCountry = (id: string) => {
    onCountriesChange(countries.filter(c => c.id !== id));
  };

  const addVoter = () => {
    const name = newVoter.trim();
    if (!name || voters.find(v => v.id === name)) return;
    onVotersChange([...voters, { id: name, name, votesGiven: [], currentVoteIndex: 0 }]);
    setNewVoter("");
  };

  const removeVoter = (id: string) => {
    if (voters.length <= 1) return;
    onVotersChange(voters.filter(v => v.id !== id));
  };

  const setPoints = (countryId: string, val: string) => {
    const pts = parseInt(val) || 0;
    onCountriesChange(countries.map(c => c.id === countryId ? { ...c, points: pts } : c));
  };

  return (
    <div className="admin-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="admin-panel">
        <div className="admin-header">
          <h2 className="admin-title">⚙️ УПРАВЛЕНИЕ</h2>
          <button className="admin-close" onClick={onClose}>✕</button>
        </div>

        <div className="admin-tabs">
          <button className={`admin-tab ${tab === "scores" ? "active" : ""}`} onClick={() => setTab("scores")}>
            Баллы
          </button>
          <button className={`admin-tab ${tab === "countries" ? "active" : ""}`} onClick={() => setTab("countries")}>
            Страны
          </button>
          <button className={`admin-tab ${tab === "voters" ? "active" : ""}`} onClick={() => setTab("voters")}>
            Голосующие
          </button>
        </div>

        <div className="admin-body">
          {tab === "scores" && (
            <div>
              <div className="admin-info">
                Текущий голосующий: <strong>{FLAG_EMOJIS[currentVoter.name] || "🏳️"} {currentVoter.name}</strong>
                {" "}• Голосов отдано: <strong>{currentVoter.votesGiven.length} / 10</strong>
              </div>
              <div className="scores-list">
                {[...countries].sort((a,b) => b.points - a.points).map(c => (
                  <div key={c.id} className="score-row">
                    <span className="score-flag">{FLAG_EMOJIS[c.name] || "🏳️"}</span>
                    <span className="score-name">{c.name}</span>
                    <input
                      type="number"
                      className="score-input"
                      value={c.points}
                      min={0}
                      onChange={e => setPoints(c.id, e.target.value)}
                    />
                  </div>
                ))}
              </div>
              <button className="reset-btn" onClick={onReset}>
                🔄 Сбросить все баллы
              </button>
            </div>
          )}

          {tab === "countries" && (
            <div>
              <div className="add-row">
                <input
                  className="add-input"
                  placeholder="Название страны..."
                  value={newCountry}
                  onChange={e => setNewCountry(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addCountry()}
                />
                <button className="add-btn" onClick={addCountry}>+ Добавить</button>
              </div>
              <div className="list-items">
                {countries.map(c => (
                  <div key={c.id} className="list-item">
                    <span>{FLAG_EMOJIS[c.name] || "🏳️"} {c.name}</span>
                    <button className="remove-btn" onClick={() => removeCountry(c.id)}>✕</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "voters" && (
            <div>
              <div className="add-row">
                <input
                  className="add-input"
                  placeholder="Название страны-голосующего..."
                  value={newVoter}
                  onChange={e => setNewVoter(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addVoter()}
                />
                <button className="add-btn" onClick={addVoter}>+ Добавить</button>
              </div>
              <div className="list-items">
                {voters.map(v => (
                  <div key={v.id} className="list-item">
                    <span>
                      {FLAG_EMOJIS[v.name] || "🏳️"} {v.name}
                      {v.currentVoteIndex >= 10 && <span className="done-badge"> ✓ завершил</span>}
                    </span>
                    <button className="remove-btn" onClick={() => removeVoter(v.id)}>✕</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
