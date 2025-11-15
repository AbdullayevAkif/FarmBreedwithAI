import React, { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Box, CheckCircle, TrendingUp } from 'lucide-react';
import { animalsAPI, breedingBoxAPI, breedingAPI, scheduleAPI, statsAPI, aiBreedingAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const BreedingBox = () => {
  const [sessionName, setSessionName] = useState('');
  const [species, setSpecies] = useState('Cattle');
  const [selectedIds, setSelectedIds] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [hybridInfo, setHybridInfo] = useState(null);
  const [chosenPairs, setChosenPairs] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [savedAnalyses, setSavedAnalyses] = useState(() => {
    try { return JSON.parse(localStorage.getItem('bb_saved') || '[]'); } catch { return []; }
  });
  const [sessions, setSessions] = useState([]);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [autoScheduled, setAutoScheduled] = useState(false);
  const [prefSize, setPrefSize] = useState('Medium');
  const [prefObjective, setPrefObjective] = useState('Meat');
  const [prefClimate, setPrefClimate] = useState('Moderate');
  const [selectedOptionsBySpecies, setSelectedOptionsBySpecies] = useState({});
  const [breedingHistory, setBreedingHistory] = useState([]);
  const [deepMode, setDeepMode] = useState(true);

  useEffect(() => {
    const fetchBreedingHistory = async () => {
      try {
        const history = await breedingAPI.getBreedingHistory();
        setBreedingHistory(history || []);
      } catch (error) {
        console.error("Failed to fetch breeding history:", error);
      }
    };
    fetchBreedingHistory();
  }, []);

  useEffect(() => {
    try { localStorage.setItem('bb_saved', JSON.stringify(savedAnalyses)); } catch {}
  }, [savedAnalyses]);
  

  const loadSessions = async () => {
    try { const data = await breedingBoxAPI.getAllSessions(); setSessions(data || []); } catch {}
  };

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

  const getOffspringFieldDefs = (sp) => {
    const base = [
      { key: 'predictedBreed', label: 'Predicted Cross' },
      { key: 'predictedSpecies', label: 'Species' },
      { key: 'predictedScore', label: 'Success Score', format: (v) => v != null ? `${v}/100` : v },
      { key: 'expectedWeight', label: '⚖️ Expected Weight' },
      { key: 'expectedSize', label: 'Expected Size' },
      { key: 'predictedMeatScore', label: '🥩 Meat Quality Score' },
      { key: 'expectedColor', label: '🌈 Coat/Color' },
      { key: 'expectedTemperament', label: '🧘 Temperament' },
      { key: 'inheritableHealthRisks', label: '⚠️ Inheritable Health Risks' },
      { key: 'breedingRecommendation', label: 'Recommendation' },
      { key: 'notes', label: 'Notes' },
      { key: 'rationale', label: 'Rationale' },
      { key: 'sources', label: 'Sources', format: (v) => Array.isArray(v) ? v.map(s => (s.title?`${s.title}`:s.url||s).toString()).join(', ') : v }
    ];
    if ((sp || '').toLowerCase().includes('sheep')) {
      base.splice(3, 0, { key: 'predictedWoolYield', label: '🧶 Wool Yield & Quality' });
    }
    const s = (sp || '').toLowerCase();
    if (s.includes('chicken') || s.includes('duck') || s.includes('goose') || s.includes('geese') || s.includes('turkey')) {
      base.splice(3, 0, { key: 'expectedEggsPerWeek', label: '🥚 Eggs per Week' });
    }
    return base;
  };

  
  useEffect(() => { loadSessions(); }, []);

  const { data: animals = [], isLoading } = useQuery(['animals'], animalsAPI.getAll);

  const speciesEnums = [
    'Cattle','Sheep','Goats','Pigs','Horses','Donkeys','Mules','Chickens','Ducks','Geese','Turkeys','Rabbits','Llamas','Alpacas','Bees'
  ];

  const objectivesBySpecies = (sp) => {
    const s = (sp || '').toLowerCase();
    if (s.includes('sheep')) return ['Meat','Wool'];
    if (s.includes('cattle')) return ['Meat','Milk'];
    if (s.includes('goat')) return ['Meat','Milk'];
    if (s.includes('pig')) return ['Meat'];
    if (s.includes('chicken') || s.includes('duck') || s.includes('geese') || s.includes('turkey')) return ['Meat','Eggs'];
    return ['Meat'];
  };

  useEffect(() => {
    const allowed = objectivesBySpecies(species);
    if (!allowed.includes(prefObjective)) setPrefObjective(allowed[0]);
  }, [species]);

  const speciesConfig = {
    Cattle: {
      icon: '🐄',
      gradient: 'linear-gradient(135deg,#f0f9ff 0%,#e0f2fe 50%,#dbeafe 100%)',
      fields: [
        { key: 'milkYield', label: 'Milk Yield (L/day)', type: 'number' },
        { key: 'meatScore', label: 'Meat Score (0-100)', type: 'number' },
        { key: 'heightCm', label: 'Height (cm)', type: 'number' },
        { key: 'size', label: 'Size', type: 'select', options: ['Small','Medium','Large'] },
        { key: 'weightKg', label: 'Weight (kg)', type: 'number' },
        { key: 'color', label: 'Color', type: 'text' },
        { key: 'temperament', label: 'Temperament', type: 'text' },
        { key: 'fertilityScore', label: 'Fertility Score (0-100)', type: 'number' }
      ]
    },
    Sheep: {
      icon: '🐑',
      gradient: 'linear-gradient(135deg,#fff7ed 0%,#ffedd5 50%,#ffe4e6 100%)',
      fields: [
        { key: 'woolYield', label: 'Wool Yield (kg/year)', type: 'number' },
        { key: 'meatScore', label: 'Meat Score (0-100)', type: 'number' },
        { key: 'size', label: 'Size', type: 'select', options: ['Small','Medium','Large'] },
        { key: 'weightKg', label: 'Weight (kg)', type: 'number' },
        { key: 'color', label: 'Color', type: 'text' },
        { key: 'fertilityScore', label: 'Fertility Score (0-100)', type: 'number' }
      ]
    },
    Goats: {
      icon: '🐐',
      gradient: 'linear-gradient(135deg,#f0fdf4 0%,#dcfce7 50%,#d1fae5 100%)',
      fields: [
        { key: 'milkYield', label: 'Milk Yield (L/day)', type: 'number' },
        { key: 'meatScore', label: 'Meat Score (0-100)', type: 'number' },
        { key: 'size', label: 'Size', type: 'select', options: ['Small','Medium','Large'] },
        { key: 'weightKg', label: 'Weight (kg)', type: 'number' },
        { key: 'color', label: 'Color', type: 'text' }
      ]
    },
    Pigs: {
      icon: '🐖',
      gradient: 'linear-gradient(135deg,#fdf2f8 0%,#fce7f3 50%,#fae8ff 100%)',
      fields: [
        { key: 'meatScore', label: 'Meat Score (0-100)', type: 'number' },
        { key: 'growthRate', label: 'Growth Rate', type: 'text' },
        { key: 'size', label: 'Size', type: 'select', options: ['Small','Medium','Large'] },
        { key: 'weightKg', label: 'Weight (kg)', type: 'number' },
        { key: 'color', label: 'Color', type: 'text' }
      ]
    },
    Horses: {
      icon: '🐎',
      gradient: 'linear-gradient(135deg,#eff6ff 0%,#e0e7ff 50%,#ede9fe 100%)',
      fields: [
        { key: 'heightCm', label: 'Height (cm)', type: 'number' },
        { key: 'speed', label: 'Speed', type: 'text' },
        { key: 'temperament', label: 'Temperament', type: 'text' },
        { key: 'size', label: 'Size', type: 'select', options: ['Small','Medium','Large'] },
        { key: 'weightKg', label: 'Weight (kg)', type: 'number' },
        { key: 'color', label: 'Color', type: 'text' }
      ]
    },
    Donkeys: {
      icon: '🫏',
      gradient: 'linear-gradient(135deg,#f8fafc 0%,#f1f5f9 50%,#e2e8f0 100%)',
      fields: [
        { key: 'heightCm', label: 'Height (cm)', type: 'number' },
        { key: 'temperament', label: 'Temperament', type: 'text' },
        { key: 'size', label: 'Size', type: 'select', options: ['Small','Medium','Large'] },
        { key: 'weightKg', label: 'Weight (kg)', type: 'number' },
        { key: 'color', label: 'Color', type: 'text' }
      ]
    },
    Mules: {
      icon: '🫎',
      gradient: 'linear-gradient(135deg,#fafaf9 0%,#f5f5f4 50%,#e7e5e4 100%)',
      fields: [
        { key: 'heightCm', label: 'Height (cm)', type: 'number' },
        { key: 'temperament', label: 'Temperament', type: 'text' },
        { key: 'size', label: 'Size', type: 'select', options: ['Small','Medium','Large'] },
        { key: 'weightKg', label: 'Weight (kg)', type: 'number' },
        { key: 'color', label: 'Color', type: 'text' }
      ]
    },
    Chickens: {
      icon: '🐔',
      gradient: 'linear-gradient(135deg,#fff7ed 0%,#fef3c7 50%,#ffedd5 100%)',
      fields: [
        { key: 'eggProductionPerWeek', label: 'Egg Production (per week)', type: 'number' },
        { key: 'meatScore', label: 'Meat Score (0-100)', type: 'number' },
        { key: 'heightCm', label: 'Height (cm)', type: 'number' },
        { key: 'size', label: 'Size', type: 'select', options: ['Small','Medium','Large'] },
        { key: 'weightKg', label: 'Weight (kg)', type: 'number' },
        { key: 'color', label: 'Color', type: 'text' }
      ]
    },
    Ducks: {
      icon: '🦆',
      gradient: 'linear-gradient(135deg,#ecfeff 0%,#cffafe 50%,#e0f2fe 100%)',
      fields: [
        { key: 'eggProductionPerWeek', label: 'Egg Production (per week)', type: 'number' },
        { key: 'meatScore', label: 'Meat Score (0-100)', type: 'number' },
        { key: 'size', label: 'Size', type: 'select', options: ['Small','Medium','Large'] },
        { key: 'weightKg', label: 'Weight (kg)', type: 'number' },
        { key: 'color', label: 'Color', type: 'text' }
      ]
    },
    Geese: {
      icon: '🪿',
      gradient: 'linear-gradient(135deg,#f0fdfa 0%,#ccfbf1 50%,#a7f3d0 100%)',
      fields: [
        { key: 'eggProductionPerWeek', label: 'Egg Production (per week)', type: 'number' },
        { key: 'meatScore', label: 'Meat Score (0-100)', type: 'number' },
        { key: 'size', label: 'Size', type: 'select', options: ['Small','Medium','Large'] },
        { key: 'weightKg', label: 'Weight (kg)', type: 'number' },
        { key: 'color', label: 'Color', type: 'text' }
      ]
    },
    Turkeys: {
      icon: '🦃',
      gradient: 'linear-gradient(135deg,#fef2f2 0%,#fee2e2 50%,#fecaca 100%)',
      fields: [
        { key: 'eggProductionPerWeek', label: 'Egg Production (per week)', type: 'number' },
        { key: 'meatScore', label: 'Meat Score (0-100)', type: 'number' },
        { key: 'size', label: 'Size', type: 'select', options: ['Small','Medium','Large'] },
        { key: 'weightKg', label: 'Weight (kg)', type: 'number' },
        { key: 'color', label: 'Color', type: 'text' }
      ]
    },
    Rabbits: {
      icon: '🐇',
      gradient: 'linear-gradient(135deg,#f5f3ff 0%,#ede9fe 50%,#e9d5ff 100%)',
      fields: [
        { key: 'litterSize', label: 'Litter Size', type: 'number' },
        { key: 'growthRate', label: 'Growth Rate', type: 'text' },
        { key: 'meatScore', label: 'Meat Score (0-100)', type: 'number' },
        { key: 'size', label: 'Size', type: 'select', options: ['Small','Medium','Large'] },
        { key: 'weightKg', label: 'Weight (kg)', type: 'number' },
        { key: 'color', label: 'Color', type: 'text' }
      ]
    },
    Llamas: {
      icon: '🦙',
      gradient: 'linear-gradient(135deg,#f0fdf4 0%,#dcfce7 50%,#bbf7d0 100%)',
      fields: [
        { key: 'fiberYield', label: 'Fiber Yield (kg/year)', type: 'number' },
        { key: 'temperament', label: 'Temperament', type: 'text' },
        { key: 'size', label: 'Size', type: 'select', options: ['Small','Medium','Large'] },
        { key: 'weightKg', label: 'Weight (kg)', type: 'number' },
        { key: 'color', label: 'Color', type: 'text' }
      ]
    },
    Alpacas: {
      icon: '🦙',
      gradient: 'linear-gradient(135deg,#ecfeff 0%,#e0f2fe 50%,#dbeafe 100%)',
      fields: [
        { key: 'fiberYield', label: 'Fiber Yield (kg/year)', type: 'number' },
        { key: 'temperament', label: 'Temperament', type: 'text' },
        { key: 'size', label: 'Size', type: 'select', options: ['Small','Medium','Large'] },
        { key: 'weightKg', label: 'Weight (kg)', type: 'number' },
        { key: 'color', label: 'Color', type: 'text' }
      ]
    },
    Bees: {
      icon: '🐝',
      gradient: 'linear-gradient(135deg,#f0f9ff 0%,#e0f2fe 50%,#f5f3ff 100%)',
      fields: [
        { key: 'honeyYieldKgPerWeek', label: 'Honey Yield (kg/week)', type: 'number' },
        { key: 'temperament', label: 'Temperament', type: 'text' },
        { key: 'diseaseResistance', label: 'Disease Resistance', type: 'text' }
      ]
    }
  };

  const saveCurrentAnalysis = async () => {
    if (!analysisResult) return;
    try {
      const saved = await breedingBoxAPI.createSession(analysisResult);
      await loadSessions();
      const entry = {
        id: saved?.id || Date.now(),
        createdAt: saved?.createdAt || new Date().toISOString(),
        sessionName: analysisResult.sessionName || sessionName,
        species: analysisResult.species || species,
        pairsCount: analysisResult.pairPlans?.length || analysisResult.breedingPairs?.length || 0,
        animalsCount: selectedAnimals.length,
        data: analysisResult
      };
      setSavedAnalyses(prev => [entry, ...prev].slice(0, 20));
      try {
        const top = bestPair;
        if (top) {
          const pairEntry = {
            id: `${top.animal1Id || top.animal1Name}-${top.animal2Id || top.animal2Name}-${analysisResult?.sessionName || sessionName}-${Date.now()}`,
            sessionName: analysisResult?.sessionName || sessionName,
            species: analysisResult?.species || species,
            animal1Id: top.animal1Id,
            animal2Id: top.animal2Id,
            animal1Name: top.animal1Name,
            animal2Name: top.animal2Name,
            compatibilityScore: top.compatibilityScore,
            offspringPrediction: top.offspringPrediction || null,
            createdAt: new Date().toISOString()
          };
          let list = [];
          try { list = JSON.parse(localStorage.getItem('bb_pairs') || '[]'); } catch { list = []; }
          list = [pairEntry, ...list].slice(0, 50);
          try { localStorage.setItem('bb_pairs', JSON.stringify(list)); } catch {}
        }
      } catch {}
      toast.success('Analysis saved');
      try { await statsAPI.increment('breeding_pairs'); queryClient.invalidateQueries(['breedingPairsCount']); } catch {}
      navigate('/breeding');
    } catch {
      toast.error('Save failed');
    }
  };

  const normalizeType = (t) => (t || '').toLowerCase();
  const speciesMatches = (a) => {
    const s = species.toLowerCase();
    const t = normalizeType(a.type);
    const map = {
      cattle: ['cattle','cow','bull','ox'],
      sheep: ['sheep','ewe','ram'],
      goats: ['goat','buck','doe'],
      pigs: ['pig','swine','boar','sow'],
      horses: ['horse','stallion','mare'],
      donkeys: ['donkey'],
      mules: ['mule'],
      chickens: ['chicken','hen','rooster'],
      ducks: ['duck'],
      geese: ['goose','geese'],
      turkeys: ['turkey'],
      rabbits: ['rabbit','bunny'],
      llamas: ['llama'],
      alpacas: ['alpaca'],
      bees: ['bee','honeybee']
    };
    const keys = map[s] || [s];
    return keys.some(k => t.includes(k));
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= 6) {
        toast.error('You can select up to 6 animals');
        return prev;
      }
      return [...prev, id];
    });
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedIds([]);
      setSelectAll(false);
      return;
    }
    const ids = filteredAnimals.slice(0, 6).map(a => a.id);
    setSelectedIds(ids);
    setSelectAll(true);
  };

  const filteredAnimals = useMemo(
    () => (animals || []).filter(a => speciesMatches(a)),
    [animals, species]
  );

  const selectedAnimals = useMemo(
    () => filteredAnimals.filter(a => selectedIds.includes(a.id)),
    [filteredAnimals, selectedIds]
  );

  const currentSpeciesFields = speciesConfig[species]?.fields || [];
  const currentSelectedOptions = selectedOptionsBySpecies[species] || {};
  const setOptionValue = (key, value, multiple = true) => {
    setSelectedOptionsBySpecies(prev => {
      const base = { ...(prev[species] || {}) };
      if (multiple) {
        const set = new Set(base[key] || []);
        if (set.has(value)) set.delete(value); else set.add(value);
        base[key] = Array.from(set);
      } else {
        base[key] = value;
      }
      return { ...prev, [species]: base };
    });
  };

  

  const selectableDefaults = useMemo(() => ({
    Cattle: {
      color: ['Black','Brown','White','Red','Spotted'],
      temperament: ['Calm','Active','Aggressive'],
      hornStatus: ['Polled','Horned']
    },
    Sheep: {
      color: ['White','Black','Brown','Spotted'],
      woolType: ['Fine','Medium','Long','Carpet'],
      temperament: ['Calm','Active']
    },
    Goats: {
      color: ['Black','Brown','White','Spotted'],
      temperament: ['Calm','Active','Aggressive']
    },
    Pigs: {
      color: ['Pink','Black','Red','Spotted'],
      temperament: ['Calm','Active']
    },
    Chickens: {
      color: ['Black','White','Buff','Blue','Barred','Red'],
      eggShellColor: ['Brown','White','Blue','Green','Cream'],
      temperament: ['Calm','Active','Flighty','Aggressive'],
      broodiness: ['Low','Medium','High']
    },
    Ducks: {
      color: ['Black','White','Fawn','Blue'],
      temperament: ['Calm','Active']
    },
    Geese: {
      color: ['White','Gray','Brown'],
      temperament: ['Calm','Active']
    },
    Turkeys: {
      color: ['Bronze','White','Black','Narragansett'],
      temperament: ['Calm','Active']
    },
    Horses: {
      color: ['Bay','Chestnut','Black','Gray','Palomino','Pinto'],
      temperament: ['Calm','Spirited']
    }
  }), []);

  const selectableFromAnimals = useMemo(() => {
    const vals = (key) => Array.from(new Set(selectedAnimals.map(a => a[key]).filter(Boolean)));
    const out = {};
    const colorVals = vals('color');
    if (colorVals.length) out.color = colorVals;
    const tempVals = vals('temperament');
    if (tempVals.length) out.temperament = tempVals;
    const eggVals = vals('eggShellColor')
      .concat(vals('eggColor')).filter(Boolean);
    if (eggVals.length) out.eggShellColor = Array.from(new Set(eggVals));
    return out;
  }, [selectedAnimals]);

  const selectableForSpecies = useMemo(() => {
    const base = selectableDefaults[species] || {};
    const dyn = selectableFromAnimals;
    const keys = Array.from(new Set([...Object.keys(base), ...Object.keys(dyn)]));
    const map = {};
    keys.forEach(k => { map[k] = Array.from(new Set([...(base[k] || []), ...(dyn[k] || [])])); });
    return map;
  }, [species, selectableDefaults, selectableFromAnimals]);

  const findAnimalByRef = (id, name) => {
    if (!id && !name) return null;
    const byId = selectedAnimals.find(a => a.id === id);
    if (byId) return byId;
    return selectedAnimals.find(a => a.name === name) || null;
  };

  const deriveOffspringPrediction = (a, b) => {
    if (!a || !b) return null;
    const num = (v) => (v != null ? Number(v) : null);
    const avg = (x, y) => (x != null && y != null ? Math.round((Number(x) + Number(y)) / 2) : x ?? y ?? null);
    const sizes = ['Small','Medium','Large'];
    const sizeAvg = (sa, sb) => {
      const ai = sizes.indexOf(sa || '');
      const bi = sizes.indexOf(sb || '');
      const vi = Math.max(0, Math.min(2, Math.round(((ai < 0 ? 1 : ai) + (bi < 0 ? 1 : bi)) / 2)));
      return sizes[vi];
    };
    return {
      predictedBreed: `${a.breed || a.type || ''}` && `${b.breed || b.type || ''}` ? `${a.breed || a.type} × ${b.breed || b.type}` : null,
      predictedSpecies: a.type || b.type || null,
      predictedScore: avg(num(a.breedingScore), num(b.breedingScore)),
      expectedWeight: avg(num(a.weight), num(b.weight)),
      predictedWoolYield: avg(num(a.woolYield), num(b.woolYield)),
      predictedMeatScore: avg(num(a.meatScore), num(b.meatScore)),
      expectedColor: a.color && b.color ? `${a.color}/${b.color}` : (a.color || b.color || null),
      expectedTemperament: a.temperament && b.temperament ? `${a.temperament}-${b.temperament}` : (a.temperament || b.temperament || null),
      expectedSize: sizeAvg(a.size, b.size),
      inheritableHealthRisks: null,
      breedingRecommendation: null,
      notes: null,
    };
  };

  const scorePairByTargets = (prediction) => {
    if (!prediction) return 0;
    let score = 0;
    const opts = currentSelectedOptions || {};
    const matchCat = (key, values) => {
      if (!values) return 0;
      const arr = Array.isArray(values) ? values : [values];
      const pv = (prediction[key] || '').toString().toLowerCase();
      return arr.some(v => String(v).toLowerCase() === pv) ? 50 : 0;
    };
    score += matchCat('expectedColor', opts.color);
    score += matchCat('expectedTemperament', opts.temperament);
    return score;
  };

  const [enrichedPairs, setEnrichedPairs] = useState([]);

  useEffect(() => {
    const run = async () => {
      const basePairs = Array.isArray(analysisResult?.pairPlans)
        ? analysisResult.pairPlans
        : (Array.isArray(analysisResult?.breedingPairs) ? analysisResult.breedingPairs : []);
      if (!basePairs || basePairs.length === 0) { setEnrichedPairs([]); return; }
      const tasks = basePairs.map(async (p) => {
        const a = findAnimalByRef(p.animal1Id, p.animal1Name);
        const b = findAnimalByRef(p.animal2Id, p.animal2Name);
        let pred = p.offspringPrediction || deriveOffspringPrediction(a, b) || {};
        if (!pred.predictedBreed && (a || b)) {
          const left = a?.breed || a?.type || p.animal1Name;
          const right = b?.breed || b?.type || p.animal2Name;
          pred.predictedBreed = left && right ? `${left} × ${right}` : pred.predictedBreed || null;
        }
        try {
          const motherId = a?.gender === 'FEMALE' ? a?.id : b?.id;
          const fatherId = a?.gender === 'MALE' ? a?.id : b?.id;
          if ((motherId && fatherId) && (!p.offspringPrediction || !p.offspringPrediction.predictedBreed)) {
            const apiPred = await breedingBoxAPI.predictOffspring(motherId, fatherId, species);
            pred = { ...pred, ...(apiPred || {}) };
          }
        } catch {}
        return { ...p, offspringPrediction: pred };
      });
      try {
        const out = await Promise.all(tasks);
        setEnrichedPairs(out);
      } catch {
        setEnrichedPairs(basePairs);
      }
    };
    if (analysisResult) { run(); } else { setEnrichedPairs([]); }
  }, [analysisResult, selectedAnimals, species]);

  const bestPair = useMemo(() => {
    if (!analysisResult) return null;
    const pairs = enrichedPairs;
    if (!pairs || pairs.length === 0) return null;
    let best = null;
    let bestScore = -Infinity;
    for (const p of pairs) {
      const a = findAnimalByRef(p.animal1Id, p.animal1Name);
      const b = findAnimalByRef(p.animal2Id, p.animal2Name);
      const pred = p.offspringPrediction || deriveOffspringPrediction(a, b);
      const comp = (typeof p.compatibilityScore === 'number' ? p.compatibilityScore : 0);
      const tscore = scorePairByTargets(pred);
      const total = comp * 2 + tscore;
      if (total > bestScore) {
        bestScore = total;
        best = { ...p, offspringPrediction: pred };
      }
    }
    return best || pairs[0];
  }, [analysisResult, enrichedPairs, selectedAnimals, currentSelectedOptions]);

  

  useEffect(() => {
    if (chosenPairs.length === 2) {
      const [pair1, pair2] = chosenPairs;
      const breed1 = pair1.animal.breed;
      const breed2 = pair2.animal.breed;
      breedingBoxAPI.getHybridInfo(breed1, breed2)
        .then(data => setHybridInfo(data))
        .catch(err => console.error(err));
    }
  }, [chosenPairs]);

  const handleAnalyze = async () => {
    if (!sessionName.trim()) {
      const auto = `Session ${new Date().toLocaleString()}`;
      setSessionName(auto);
    }
    if (selectedAnimals.length < 2) {
      toast.error('Select at least 2 animals');
      return;
    }
    try { console.log('[Analyze] start', { deepMode, species, selectedIds }); } catch {}
    setAnalysisResult(null);
    setEnrichedPairs([]);
    setChosenPairs([]);
    setIsAnalyzing(true);
    try {
      const primary = [...selectedAnimals].sort((a,b)=> (b.breedingScore||0)-(a.breedingScore||0))[0] || selectedAnimals[0];
      const sizePref = prefSize ? prefSize.toUpperCase() : 'ANY';
      const focusPref = prefObjective ? (prefObjective.toUpperCase()==='EGGS'?'EGGS':prefObjective.toUpperCase()) : 'ANY';
      const climatePref = prefClimate || 'Moderate';
      const toCand = (a) => ({
        id: a.id,
        name: a.name,
        gender: a.gender,
        type: a.type,
        breed: a.breed,
        color: a.color,
        temperament: a.temperament,
        eggShellColor: a.eggShellColor || a.eggColor,
        hornStatus: a.hornStatus,
        broodiness: a.broodiness,
        weight: a.weight || a.weightKg,
        traits: {
          weight: a.weight || a.weightKg,
          wool: a.woolYield,
          meat: a.meatScore,
          milk: a.milkYield,
          eggs: a.eggProductionPerWeek,
          size: a.size
        }
      });
      const animalPayload = toCand(primary);
      const candidatePayload = selectedAnimals.filter(a => a.id !== primary.id).map(toCand);
      let smart = [];
      try {
        try { console.log('[Analyze] calling AI smart-recommendations'); } catch {}
        smart = await aiBreedingAPI.getSmartRecommendations({
          animal: animalPayload,
          candidates: candidatePayload,
          input: {
            species,
            size: sizePref || 'ANY',
            focus: focusPref,
            climate: climatePref,
            options: currentSelectedOptions,
            targets: {},
            limitToIds: selectedAnimals.map(a => a.id),
            mode: deepMode ? 'detailed' : 'standard'
          },
          breedingHistory: breedingHistory || []
        });
      } catch (e) { try { console.error('[Analyze] AI call failed', e); } catch {} }
      if (Array.isArray(smart) && smart.length) {
        try { console.log('[Analyze] AI pairs received', smart.length); } catch {}
        setAnalysisResult({
          sessionName: sessionName.trim(),
          species,
          breedingPairs: smart
        });
      } else {
        try { console.log('[Analyze] falling back to deepAnalyze'); } catch {}
        const payload = {
          sessionName: sessionName.trim(),
          species,
          selectedAnimalIds: selectedAnimals.map(a => a.id).filter(Boolean),
          targetTraits: {
            size: prefSize,
            objective: prefObjective,
            climate: prefClimate,
            ...(selectedOptionsBySpecies[species] || {}),
          },
        };

        try {
          const resp = await breedingBoxAPI.deepAnalyze(payload);
          setAnalysisResult(resp);
        } catch (e) {
          toast.error('Analysis failed');
        } finally {
          setIsAnalyzing(false);
        }
      }
    } catch (e) {
      toast.error('Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const computePairSuggestions = () => {
    if (selectedAnimals.length < 2) return [];
    const fields = currentSpeciesFields;
    const pairs = [];
    for (let i = 0; i < selectedAnimals.length; i++) {
      for (let j = i + 1; j < selectedAnimals.length; j++) {
        const a = selectedAnimals[i];
        const b = selectedAnimals[j];
        const sugg = fields.map(f => {
          if (f.key === 'size') {
            const sizes = ['Small','Medium','Large'];
            const ai = sizes.indexOf(a.size || '');
            const bi = sizes.indexOf(b.size || '');
            const vi = Math.max(0, Math.min(2, Math.round(((ai < 0 ? 1 : ai) + (bi < 0 ? 1 : bi)) / 2)));
            return { key: f.key, label: f.label, value: sizes[vi] };
          }
          if (f.type === 'number') {
            const av = a[f.key] != null ? Number(a[f.key]) : null;
            const bv = b[f.key] != null ? Number(b[f.key]) : null;
            const val = av != null && bv != null ? Math.round((av + bv) / 2) : av != null ? av : bv != null ? bv : '';
            return { key: f.key, label: f.label, value: val };
          }
          if (f.key === 'color') {
            const val = a.color && b.color ? `${a.color}/${b.color}` : a.color || b.color || '';
            return { key: f.key, label: f.label, value: val };
          }
          if (f.key === 'temperament') {
            const val = a.temperament && b.temperament ? `${a.temperament}-${b.temperament}` : a.temperament || b.temperament || '';
            return { key: f.key, label: f.label, value: val };
          }
          return { key: f.key, label: f.label, value: '' };
        });
        pairs.push({
          aId: a.id,
          bId: b.id,
          title: `${a.name} × ${b.name}`,
          suggestions: sugg
        });
      }
    }
    return pairs;
  };

  const getScoreClass = (score) => {
    if (score >= 80) return 'score-excellent';
    if (score >= 60) return 'score-good';
    if (score >= 40) return 'score-fair';
    return 'score-poor';
  };


  return (
    <div className="page-container" style={{paddingTop: 12}}>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Box className="farm-icon" />
            Breeding Box
          </h1>
          <p className="page-subtitle">
            Select up to 6 animals of the same species and define target offspring traits for tailored pairing suggestions.
          </p>
        </div>
      </div>

      <div className="breeding-box-content">
        <div className="upload-section">
          <div className="section-card">
            <h2 className="section-title">
              <CheckCircle className="farm-icon" />
              Choose Animals (max 6)
            </h2>
            <div style={{marginTop:8, borderRadius:12, padding:16, background: speciesConfig[species]?.gradient}}>
              <div style={{display:'flex',alignItems:'center',gap:12}}>
                <div style={{fontSize:28}}>{speciesConfig[species]?.icon || '🐾'}</div>
                <div>
                  <div style={{fontWeight:600,fontSize:18}}>{species}</div>
                  <div style={{opacity:0.8,fontSize:13}}>Configure target traits and select same-species animals for better matches</div>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Session Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="Enter session name (e.g., Autumn Breeding)"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Species</label>
              <select className="form-input" value={species} onChange={(e) => { setSpecies(e.target.value); setSelectedIds([]); }}>
                {speciesEnums.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="uploaded-photos">
              <h3>Animals</h3>
              {isLoading ? (
                <div className="empty-state">
                  <div className="loading-spinner"></div>
                  Loading animals...
                </div>
              ) : filteredAnimals.length === 0 ? (
                <div className="empty-state">
                  <Box className="empty-state-icon" />
                  <h3 className="empty-state-title">No Animals</h3>
                  <p className="empty-state-description">No animals found for the selected species.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-striped">
                    <thead>
                      <tr>
                        <th style={{width:36}}><input type="checkbox" checked={selectAll && selectedIds.length>0} onChange={toggleSelectAll} /></th>
                        <th>Photo</th>
                        <th>Name</th>
                        <th>Type</th>
                        <th>Breed</th>
                        <th>Gender</th>
                        <th>Score</th>
                        <th>Size</th>
                        <th>Weight</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAnimals.map(a => {
                        const checked = selectedIds.includes(a.id);
                        return (
                          <tr key={a.id} className={checked ? 'selected' : ''} onClick={() => toggleSelect(a.id)} style={{cursor:'pointer'}}>
                            <td onClick={(e)=>e.stopPropagation()}><input type="checkbox" checked={checked} onChange={() => toggleSelect(a.id)} /></td>
                            <td>
                              {a.photoUrl ? (
                                <img src={a.photoUrl} alt={a.name} style={{width:40, height:40, borderRadius:'50%', objectFit:'cover'}} />
                              ) : (
                                <span style={{fontSize:24}}>{speciesConfig[a.type]?.icon || '🐾'}</span>
                              )}
                            </td>
                            <td>{a.name}</td>
                            <td>{a.type}</td>
                            <td>{a.breed || '—'}</td>
                            <td>{a.gender}</td>
                            <td><span className={`photo-score ${getScoreClass(a.breedingScore || 0)}`}>{a.breedingScore || 0}</span></td>
                            <td>{a.size || '—'}</td>
                            <td>{a.weight != null ? a.weight : '—'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="selection-hint">Selected: {selectedIds.length}/6</div>
            </div>

          </div>
        </div>

        <div className="analysis-section">
          <div className="section-card">
            <h2 className="section-title">
              <CheckCircle className="farm-icon" />
              Breeding Preferences
            </h2>
            <div className="traits-grid">
              <div className="form-group">
                <label className="form-label">Size</label>
                <div className="d-flex" style={{gap:16}}>
                  <label><input type="radio" name="size" checked={prefSize==='Large'} onChange={()=>setPrefSize('Large')} /> Large</label>
                  <label><input type="radio" name="size" checked={prefSize==='Medium'} onChange={()=>setPrefSize('Medium')} /> Medium</label>
                  <label><input type="radio" name="size" checked={prefSize==='Small'} onChange={()=>setPrefSize('Small')} /> Small</label>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Objective</label>
                <div className="d-flex" style={{gap:16}}>
                  {objectivesBySpecies(species).map(o => (
                    <label key={o}><input type="radio" name="objective" checked={prefObjective===o} onChange={()=>setPrefObjective(o)} /> {o}</label>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Climate</label>
                <div className="d-flex" style={{gap:16}}>
                  <label><input type="radio" name="climate" checked={prefClimate==='Cold'} onChange={()=>setPrefClimate('Cold')} /> Cold</label>
                  <label><input type="radio" name="climate" checked={prefClimate==='Moderate'} onChange={()=>setPrefClimate('Moderate')} /> Moderate</label>
                  <label><input type="radio" name="climate" checked={prefClimate==='Hot'} onChange={()=>setPrefClimate('Hot')} /> Hot</label>
                </div>
              </div>
              {Object.keys(selectableForSpecies).length > 0 && (
                <div className="form-group">
                  <label className="form-label">Selectable Preferences</label>
                  <div className="traits-grid" style={{gridTemplateColumns:'repeat(2,minmax(180px,1fr))', gap:12}}>
                    {Object.entries(selectableForSpecies).map(([k, arr]) => (
                      <div key={k}>
                        <div style={{fontWeight:600, marginBottom:6}}>{k.replace(/([A-Z])/g,' $1').replace(/^\w/,c=>c.toUpperCase())}</div>
                        <div className="d-flex" style={{flexWrap:'wrap', gap:8}}>
                          {arr.map(v => {
                            const checked = Array.isArray(currentSelectedOptions[k]) ? currentSelectedOptions[k].includes(v) : currentSelectedOptions[k] === v;
                            return (
                              <label key={v} className="badge-option">
                                <input type="checkbox" checked={!!checked} onChange={()=>setOptionValue(k, v, true)} /> {v}
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="d-flex" style={{marginTop:16}}>
              <button
                className="btn-primary analyze-btn"
                onClick={handleAnalyze}
                disabled={isAnalyzing || selectedIds.length < 2}
              >
                {isAnalyzing ? (
                  <>
                    <div className="loading-spinner"></div>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <TrendingUp size={16} />
                    Analyze Selection
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        

        {(() => {
          const top = bestPair;
          const op = top?.offspringPrediction || null;
          if (!top || !op) return false;
          const sp = (analysisResult?.species || '').toLowerCase();
          const emoji = sp.includes('sheep') ? '🐑' : sp.includes('cattle') || sp.includes('cow') ? '🐄' : sp.includes('goat') ? '🐐' : sp.includes('pig') ? '🐖' : sp.includes('horse') ? '🐎' : '🍃';
          const fields = getOffspringFieldDefs(analysisResult?.species || species);
          return (
            <div className="analysis-section" style={{background:'#D1FAE5', border:'1px solid #10b981', borderRadius:16, boxShadow:'0 12px 28px rgba(16,185,129,0.25)'}}>
              <div className="section-card" style={{border:'none'}}>
                <h2 className="section-title" style={{color:'#065f46', fontSize:24}}>
                  🥇 Best Offspring Forecast: {top.animal1Name} {emoji} × {top.animal2Name} {emoji}
              </h2>
              {op?.hybridImageUrl && (
                <div style={{marginTop:8, marginBottom:8}}>
                  <img src={op.hybridImageUrl} alt="hybrid" style={{maxWidth:240, height:'auto', borderRadius:8, border:'1px solid #a7f3d0'}} />
                </div>
              )}
              <div className="table-responsive">
                <table className="table" style={{border:'1px solid #a7f3d0', background:'#ecfdf5'}}>
                  <thead style={{background:'#10b981'}}>
                    <tr>
                      <th style={{color:'#fff'}}>🍃 Trait Category</th>
                      <th style={{color:'#fff'}}>✨ AI Forecast ({top.animal1Name} × {top.animal2Name})</th>
                  </tr>
                </thead>
                <tbody>
                  {fields.map(f => {
                    const raw = op[f.key];
                    const val = typeof f.format === 'function' ? f.format(raw) : raw;
                    if (val === null || val === undefined || val === '' || String(val).toUpperCase() === 'N/A') return null;
                    return (
                      <tr key={f.key}><td>{f.label}</td><td>{val}</td></tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
              </div>
            </div>
          );
        })()}

        

        

        {(!bestPair || !bestPair.offspringPrediction) && analysisResult && (
          <div className="analysis-section" style={{background:'#FFF9F0', border:'1px solid #fde68a', borderRadius:12, padding:16, marginTop:12}}>
            <h3 style={{margin:0, fontWeight:600}}>No pair found</h3>
            {Array.isArray(analysisResult?.risks) && analysisResult.risks.length > 0 ? (
              <ul style={{marginTop:8}}>
                {analysisResult.risks.map((r, i) => (
                  <li key={i}>{String(r)}</li>
                ))}
              </ul>
            ) : (
              <div style={{marginTop:8}}>Try selecting at least 2 animals of the same species with opposite genders.</div>
            )}
          </div>
        )}

        {bestPair && bestPair.offspringPrediction && (
          <div className="analysis-section" style={{background:'#F7F7F7', border:'1px solid #e5e7eb', borderRadius:12, boxShadow:'0 8px 24px rgba(0,0,0,0.06)'}}>
            <div className="section-card">
              <h2 className="section-title">
                <CheckCircle className="farm-icon" />
                Offspring Prediction
              </h2>
              {hybridInfo && (
                <div style={{marginTop: 16}}>
                  <div style={{fontWeight: 600, marginBottom: 4}}>Hybrid Breed</div>
                  <div>{hybridInfo.hybridName}</div>
                  <img src={hybridInfo.hybridImage} alt={hybridInfo.hybridName} style={{marginTop: 8, maxWidth: 260, height: 'auto', borderRadius: 8, border:'1px solid #e5e7eb'}} />
                </div>
              )}
              {bestPair.offspringPrediction?.hybridImageUrl && (
                <div style={{marginTop:8, marginBottom:8}}>
                  <img src={bestPair.offspringPrediction.hybridImageUrl} alt="hybrid" style={{maxWidth:260, height:'auto', borderRadius:8, border:'1px solid #e5e7eb'}} />
                </div>
              )}
              <div className="table-responsive">
                <table className="table table-striped">
                  <thead>
                    <tr>
                      <th>Trait</th>
                      <th>Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getOffspringFieldDefs(analysisResult?.species || species).map(f => {
                      const raw = bestPair.offspringPrediction[f.key];
                      const val = typeof f.format === 'function' ? f.format(raw) : raw;
                      if (val === null || val === undefined || val === '' || String(val).toUpperCase() === 'N/A') return null;
                      return (
                        <tr key={f.key}>
                          <td>{f.label}</td>
                          <td>{val}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {analysisResult && (
          <div className="analysis-section">
            <div className="section-card">
              <div className="d-flex" style={{justifyContent:'flex-end'}}>
                <button className="btn-primary" onClick={saveCurrentAnalysis}>Save Analysis</button>
              </div>
            </div>
          </div>
        )}

        

        

        
        
      </div>
    </div>
  );
};

export default BreedingBox;

