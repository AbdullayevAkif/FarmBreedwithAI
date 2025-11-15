import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { animalsAPI, breedingAPI, scheduleAPI } from '../services/api';
import toast from 'react-hot-toast';

const Breeding = () => {
  const [selectedAnimal, setSelectedAnimal] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGender, setFilterGender] = useState('ALL');
  const [orderedRecs, setOrderedRecs] = useState([]);
  const [dragIndex, setDragIndex] = useState(null);
  const [offspringPrediction, setOffspringPrediction] = useState(null);
  const [prefSize, setPrefSize] = useState('ANY');
  const [prefFocus, setPrefFocus] = useState('ANY');
  const [smartLoading, setSmartLoading] = useState(false);
  const [showPrefModal, setShowPrefModal] = useState(false);
  const [tempSize, setTempSize] = useState('ANY');
  const [tempFocus, setTempFocus] = useState('ANY');

  const queryClient = useQueryClient();
  const EMPTY = React.useMemo(() => [], []);
  const { data: animals } = useQuery({
    queryKey: ['animals'],
    queryFn: animalsAPI.getAll,
    initialData: EMPTY
  });

  useEffect(() => {
    if (selectedAnimal) {
      setTempSize('ANY');
      setTempFocus('ANY');
      setShowPrefModal(true);
    }
  }, [selectedAnimal]);
  const { data: recommendations } = useQuery({
    queryKey: ['recommendations', selectedAnimal?.id],
    queryFn: () => selectedAnimal ? breedingAPI.getRecommendations(selectedAnimal.id) : [],
    enabled: !!selectedAnimal,
    initialData: EMPTY
  });

  const pairKey = (rec) => `${rec.animal1Id || rec.animal1Name}-${rec.animal2Id || rec.animal2Name}`;
  const loadDismissed = () => {
    try { return JSON.parse(localStorage.getItem('breeding_dismissed') || '[]'); } catch { return []; }
  };

  const getAnimalById = (id) => (animals || []).find(a => a.id === id);
  const normalizeSpecies = (t) => (t || '').toLowerCase();

  const scheduleLocalNotification = async (title, when) => {
    try {
      if (!('Notification' in window)) return;
      if (Notification.permission !== 'granted') {
        await Notification.requestPermission();
      }
      const delay = Math.max(0, new Date(when).getTime() - Date.now());
      if (delay > 0 && delay <= 7 * 24 * 60 * 60 * 1000) {
        setTimeout(() => {
          try { new Notification(title); } catch {}
          toast(title);
        }, delay);
      }
    } catch {}
  };

  const handleScheduleBreeding = async (rec) => {
    try {
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 1);
      const input = window.prompt('Enter breeding date/time (YYYY-MM-DDTHH:mm)', defaultDate.toISOString().slice(0,16));
      if (!input) return;
      const date = new Date(input);
      if (isNaN(date.getTime())) { toast.error('Invalid date'); return; }

      const a1 = rec.animal1Id ? getAnimalById(rec.animal1Id) : null;
      const a2 = rec.animal2Id ? getAnimalById(rec.animal2Id) : null;
      const title = `Breeding: ${rec.animal1Name} × ${rec.animal2Name}`;
      await scheduleAPI.create({
        title,
        type: 'BREEDING',
        scheduledDate: date.toISOString(),
        metadata: {
          animal1Id: rec.animal1Id, animal2Id: rec.animal2Id,
          animal1Name: rec.animal1Name, animal2Name: rec.animal2Name,
          species: a1?.type || a2?.type || selectedAnimal?.type
        }
      });
      scheduleLocalNotification(title, date.toISOString());

      if (a1?.id) await animalsAPI.update(a1.id, { ...a1, breedingStatus: 'BREEDING' });
      if (a2?.id) await animalsAPI.update(a2.id, { ...a2, breedingStatus: 'BREEDING' });
      queryClient.invalidateQueries(['animals']);
      queryClient.invalidateQueries(['upcomingTasks']);

      const sp = normalizeSpecies(a1?.type || a2?.type || selectedAnimal?.type);
      if (sp && (sp.includes('chicken') || sp.includes('hen') || sp.includes('rooster'))) {
        const hatch = new Date(date);
        hatch.setDate(hatch.getDate() + 21);
        await scheduleAPI.create({
          title: `Hatching expected: ${rec.animal1Name} × ${rec.animal2Name}`,
          type: 'HATCHING',
          scheduledDate: hatch.toISOString(),
          metadata: { fromSchedule: title }
        });
        scheduleLocalNotification(`Hatching expected for ${rec.animal1Name} × ${rec.animal2Name}`, hatch.toISOString());
        queryClient.invalidateQueries(['upcomingTasks']);
      }

      toast.success('Breeding scheduled');
    } catch {
      toast.error('Failed to schedule');
    }
  };
  const saveDismissed = (list) => {
    try { localStorage.setItem('breeding_dismissed', JSON.stringify(list)); } catch {}
  };

  useEffect(() => {
    const base = Array.isArray(recommendations) ? recommendations : [];
    const dismissed = new Set(loadDismissed());
    let filtered = base.filter(r => !dismissed.has(pairKey(r)));

    try {
      const saved = JSON.parse(localStorage.getItem('bb_pairs') || '[]');
      if (selectedAnimal && Array.isArray(saved)) {
        const saId = selectedAnimal.id;
        const saName = selectedAnimal.name;
        const matches = saved.filter(p =>
          (!dismissed.has(`${p.animal1Id || p.animal1Name}-${p.animal2Id || p.animal2Name}`)) &&
          (
            p.animal1Id === saId || p.animal2Id === saId ||
            p.animal1Name === saName || p.animal2Name === saName
          )
        ).map(p => ({
          animal1Id: p.animal1Id,
          animal2Id: p.animal2Id,
          animal1Name: p.animal1Name,
          animal2Name: p.animal2Name,
          compatibilityScore: p.compatibilityScore ?? 0,
          reasoning: p.offspringPrediction?.predictedBreed ? `Saved pair • Predicted: ${p.offspringPrediction.predictedBreed}` : 'Saved pair',
          offspringPrediction: p.offspringPrediction || null
        }));

        const byKey = new Map(filtered.map(r => [pairKey(r), r]));
        for (const m of matches) {
          const k = pairKey(m);
          if (!byKey.has(k)) byKey.set(k, m);
        }
        filtered = Array.from(byKey.values());
      }
    } catch {}

    const rank = (rec) => {
      let s = rec.compatibilityScore ?? 0;
      const pred = rec.offspringPrediction || {};
      if (prefFocus !== 'ANY') {
        if (prefFocus === 'WOOL') s += (parseFloat(pred.predictedWoolYield) || 0);
        if (prefFocus === 'MEAT') s += (Number(pred.predictedMeatScore) || 0) * 2;
        if (prefFocus === 'MILK') s += (Number(pred.expectedMilkYield) || 0) * 2;
      }
      if (prefSize !== 'ANY') {
        const w = Number(pred.expectedWeight) || 0;
        if (prefSize === 'SMALL') s += w < 50 ? 15 : w < 70 ? 5 : -10;
        if (prefSize === 'MEDIUM') s += w >= 50 && w <= 80 ? 15 : -5;
        if (prefSize === 'LARGE') s += w > 80 ? 15 : w > 65 ? 8 : -10;
      }
      return s;
    };
    const ranked = filtered.slice().sort((a,b) => rank(b) - rank(a));
    setOrderedRecs(ranked);
    let prediction = null;
    if (ranked.length > 0 && ranked[0].offspringPrediction) {
      prediction = ranked[0].offspringPrediction;
    } else {
      try {
        const saved = JSON.parse(localStorage.getItem('bb_pairs') || '[]');
        if (selectedAnimal && Array.isArray(saved)) {
          const saId = selectedAnimal.id;
          const saName = selectedAnimal.name;
          const hit = saved.find(p => (
            p.animal1Id === saId || p.animal2Id === saId ||
            p.animal1Name === saName || p.animal2Name === saName
          ) && p.offspringPrediction);
          prediction = hit?.offspringPrediction || null;
        }
      } catch {}
    }
    setOffspringPrediction(prediction);
  }, [recommendations, selectedAnimal, prefSize, prefFocus]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!selectedAnimal) return;
      if (prefSize === 'ANY' && prefFocus === 'ANY') return;
      try {
        setSmartLoading(true);
        const payload = {
          animalId: selectedAnimal.id,
          species: selectedAnimal.type,
          size: prefSize,
          focus: prefFocus
        };
        const data = await breedingAPI.getSmartRecommendations(payload);
        if (cancelled) return;
        if (Array.isArray(data) && data.length) {
          setOrderedRecs(data);
          const first = data[0];
          setOffspringPrediction(first?.offspringPrediction || null);
        }
      } catch {}
      finally {
        if (!cancelled) setSmartLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [selectedAnimal, prefSize, prefFocus]);

  const filteredAnimals = (animals || []).filter(animal => {
    const matchesSearch = animal.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         animal.type?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGender = filterGender === 'ALL' || animal.gender === filterGender;
    
    return matchesSearch && matchesGender;
  });

  const getScoreClass = (score) => {
    if (score >= 80) return 'score-excellent';
    if (score >= 60) return 'score-good';
    if (score >= 40) return 'score-fair';
    return 'score-poor';
  };

  const getCompatibilityClass = (score) => {
    if (score >= 80) return 'score-excellent';
    if (score >= 60) return 'score-good';
    if (score >= 40) return 'score-fair';
    return 'score-poor';
  };

  const onDragStart = (index) => setDragIndex(index);
  const onDragOver = (e) => e.preventDefault();
  const onDrop = (index) => {
    if (dragIndex === null || dragIndex === index) return;
    const list = [...orderedRecs];
    const [moved] = list.splice(dragIndex, 1);
    list.splice(index, 0, moved);
    setOrderedRecs(list);
    setDragIndex(null);
  };

  const onDeleteRec = (index) => {
    setOrderedRecs((prev) => {
      const rec = prev[index];
      if (rec) {
        const list = loadDismissed();
        const key = pairKey(rec);
        if (!list.includes(key)) list.push(key);
        saveDismissed(list);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  return (
    <div className="main-content">
      <div className="page-header">
        <h1>
          <span className="emoji">💕</span>
          Breeding Management
        </h1>
        <p>Find the best breeding pairs and manage your breeding program.</p>
      </div>

      <div className="d-flex justify-between align-center mb-4">
        <button className="btn btn-primary">
          <span className="emoji">📅</span>
          Schedule Breeding
        </button>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div className="card-header">
            <h3>
              <span className="emoji">🐑</span>
              Select Animal
            </h3>
          </div>
          
          <div className="form-group">
            <input
              type="text"
              placeholder="Search animals..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-control"
            />
          </div>

          <div className="form-group">
            <select
              value={filterGender}
              onChange={(e) => setFilterGender(e.target.value)}
              className="form-control"
            >
              <option value="ALL">All Genders</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
            </select>
          </div>

          <div className="d-flex flex-column gap-2" style={{maxHeight: '400px', overflowY: 'auto'}}>
            {filteredAnimals.map((animal) => (
              <div
                key={animal.id}
                className={`p-3 ${selectedAnimal?.id === animal.id ? 'selected' : ''}`}
                onClick={() => setSelectedAnimal(animal)}
                style={{
                  border: selectedAnimal?.id === animal.id ? '2px solid var(--farm-green)' : '1px solid #e0e0e0',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                <div className="d-flex justify-between align-center">
                  <div>
                    <div className="font-weight-bold">{animal.name}</div>
                    <div className="text-muted">
                      {animal.type} • {animal.gender} • Score: {animal.breedingScore || 0}
                    </div>
                  </div>
                  <div className={`animal-status status-ready`}>
                    {animal.breedingScore || 0}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          {selectedAnimal ? (
            <>
              <div className="card-header">
                <h3>
                  <span className="emoji">🎯</span>
                  Breeding Recommendations for {selectedAnimal.name}
                </h3>
              </div>
              <div className="p-3 mb-4" style={{background: 'var(--farm-cream)', borderRadius: 'var(--radius-md)'}}>
                <div className="d-flex justify-between align-center">
                  <div>
                    <div className="font-weight-bold">{selectedAnimal.name}</div>
                    <div className="text-muted">
                      {selectedAnimal.type} • {selectedAnimal.gender} • {selectedAnimal.healthStatus}
                    </div>
                  </div>
                  <div className="animal-status status-ready">
                    Score: {selectedAnimal.breedingScore || 0}
                  </div>
                </div>
              </div>

              <div className="d-flex gap-2 mb-3">
                <div className="form-group" style={{minWidth:180}}>
                  <select value={prefSize} onChange={(e)=>setPrefSize(e.target.value)} className="form-control">
                    <option value="ANY">Size: Any</option>
                    <option value="SMALL">Small</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LARGE">Large</option>
                  </select>
                </div>
                <div className="form-group" style={{minWidth:220}}>
                  <select value={prefFocus} onChange={(e)=>setPrefFocus(e.target.value)} className="form-control">
                    <option value="ANY">Objective: Overall Match</option>
                    <option value="WOOL">Wool Yield</option>
                    <option value="MEAT">Meat Yield</option>
                    <option value="MILK">Milk Yield</option>
                  </select>
                </div>
                {smartLoading && <div className="text-muted" style={{alignSelf:'center'}}>Loading AI suggestions…</div>}
              </div>

              {orderedRecs.length > 0 && (
                <div className="rec-scroll-row">
                  {orderedRecs.map((rec, index) => (
                    <div
                      key={`${rec.animal1Id}-${rec.animal2Id}-${index}`}
                      className="rec-card"
                      draggable
                      onDragStart={() => onDragStart(index)}
                      onDragOver={onDragOver}
                      onDrop={() => onDrop(index)}
                    >
                      <div className="d-flex justify-between align-center mb-3">
                        <div className="font-weight-bold">
                          <span className="emoji">💕</span>
                          {rec.animal1Name} × {rec.animal2Name}
                        </div>
                        <div className="d-flex align-center" style={{gap:8}}>
                          <div className="animal-status status-ready">
                            {rec.compatibilityScore}% Match
                          </div>
                          <button className="btn btn-outline btn-sm" style={{cursor:'grab'}} draggable onDragStart={() => onDragStart(index)}>⇅</button>
                        </div>
                      </div>
                      <div className="d-flex gap-2">
                        <button className="btn btn-primary btn-sm" onClick={() => handleScheduleBreeding(rec)}>
                          <span className="emoji">📅</span>
                          Schedule Breeding
                        </button>
                        <button className="btn btn-secondary btn-sm">
                          <span className="emoji">📊</span>
                          View Details
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => onDeleteRec(index)}>
                          ✖ Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {orderedRecs.length === 0 && !offspringPrediction && (
                <div className="text-center">
                  <span className="emoji" style={{fontSize: '3rem'}}>🎯</span>
                  <h3>No Recommendations</h3>
                  <p>No suitable breeding partners found for this animal.</p>
                </div>
              )}

              {offspringPrediction && (
                <div className="p-3 mt-4 prediction-table-card" style={{background: 'var(--farm-cream)', borderRadius: 'var(--radius-md)'}}>
                  <h4 className="prediction-title">
                    <span className="emoji">🐑</span>
                    Offspring Prediction
                  </h4>
                  <div className="prediction-table-wrapper">
                    <table className="offspring-prediction-table compact-table">
                      <colgroup>
                        <col style={{width: '24%'}} />
                        <col style={{width: '12%'}} />
                        <col style={{width: '16%'}} />
                        <col style={{width: '20%'}} />
                        <col style={{width: '16%'}} />
                        <col style={{width: '12%'}} />
                      </colgroup>
                      <thead>
                        <tr>
                          <th>🐏 Predicted Breed</th>
                          <th>⭐ Score</th>
                          <th>⚖️ Expected Weight</th>
                          <th>🧶 Wool Yield</th>
                          <th>🥩 Meat Score</th>
                          <th>🩺 Health Risks</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>
                            <span role="img" aria-label="sheep" style={{marginRight:6}}>🐑</span>
                            {offspringPrediction.predictedBreed || '—'}
                          </td>
                          <td className="table-center">
                            {offspringPrediction.predictedScore != null ? (
                              <span className="score-badge">{offspringPrediction.predictedScore}</span>
                            ) : '—'}
                          </td>
                          <td className="metric">{offspringPrediction.expectedWeight ?? '—'}</td>
                          <td>{offspringPrediction.predictedWoolYield || '—'}</td>
                          <td className="metric">{offspringPrediction.predictedMeatScore ?? '—'}</td>
                          <td>{offspringPrediction.inheritableHealthRisks || '—'}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center">
              <span className="emoji" style={{fontSize: '3rem'}}>💕</span>
              <h3>Select an Animal</h3>
              <p>Choose an animal from the list to see breeding recommendations.</p>
            </div>
          )}
        </div>
      </div>

      {showPrefModal && (
        <div className="modal-backdrop">
          <div className="modal" style={{maxWidth: 520}}>
            <div className="modal-header">
              <h3>Select Your Preferences</h3>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Size</label>
                <select value={tempSize} onChange={(e)=>setTempSize(e.target.value)} className="form-control">
                  <option value="ANY">Any</option>
                  <option value="SMALL">Small</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LARGE">Large</option>
                </select>
              </div>
              <div className="form-group">
                <label>Objective</label>
                <select value={tempFocus} onChange={(e)=>setTempFocus(e.target.value)} className="form-control">
                  <option value="ANY">Overall Match</option>
                  <option value="WOOL">Wool Yield</option>
                  <option value="MEAT">Meat Yield</option>
                  <option value="MILK">Milk Yield</option>
                </select>
              </div>
            </div>
            <div className="modal-footer d-flex justify-between">
              <button className="btn btn-outline" onClick={()=>setShowPrefModal(false)}>Cancel</button>
              <div className="d-flex" style={{gap:8}}>
                <button className="btn" onClick={()=>{ setPrefSize('ANY'); setPrefFocus('ANY'); setShowPrefModal(false); }}>Skip</button>
                <button className="btn btn-primary" onClick={()=>{ setPrefSize(tempSize); setPrefFocus(tempFocus); setShowPrefModal(false); }}>Apply</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Breeding;

