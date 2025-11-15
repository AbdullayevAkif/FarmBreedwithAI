import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { animalsAPI, uploadAPI } from '../services/api';
import toast from 'react-hot-toast';

const Animals = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGender, setFilterGender] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedAnimal, setSelectedAnimal] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [editAnimal, setEditAnimal] = useState(null);
  const [editOriginal, setEditOriginal] = useState(null);
  const normalizeFromApi = (a = {}) => ({
    ...a,
    color: a.color ?? a.colour ?? a.coatColor ?? '',
    size: a.size ?? a.bodySize ?? a.frameSize ?? '',
    temperament: a.temperament ?? a.behavior ?? a.attitude ?? '',
    geneticsTraits: a.geneticsTraits ?? a.geneticTraits ?? a.traits ?? a.traitsDescription ?? '',
    notes: a.notes ?? a.description ?? '',
    weight: a.weight ?? a.weightKg ?? a.weight_kg ?? '',
    milkYield: a.milkYield ?? a.milk_yield ?? a.milkPerDay ?? '',
    meatScore: a.meatScore ?? a.meat_score ?? '',
    fertilityScore: a.fertilityScore ?? a.fertility_score ?? '',
    eggProductionPerWeek: a.eggProductionPerWeek ?? a.eggsPerWeek ?? a.egg_per_week ?? '',
    heightCm: a.heightCm ?? a.height_cm ?? a.height ?? '',
    litterSize: a.litterSize ?? a.litter_size ?? '',
    honeyYieldKgPerWeek: a.honeyYieldKgPerWeek ?? a.honeyYieldKg ?? a.honey_kg_per_week ?? '',
    birthDate: a.birthDate ?? a.birth_date ?? a.dob ?? a.dateOfBirth ?? ''
  });
  const initialAnimal = {
    name: '',
    type: '',
    breed: '',
    gender: 'MALE',
    healthStatus: 'GOOD',
    breedingStatus: 'READY',
    birthDate: '',
    weight: '',
    geneticsTraits: '',
    temperament: '',
    color: '',
    size: '',
    milkYield: '',
    meatScore: '',
    fertilityScore: '',
    woolYield: '',
    eggProductionPerWeek: '',
    growthRate: '',
    heightCm: '',
    speed: '',
    litterSize: '',
    honeyYieldKgPerWeek: '',
    notes: '',
  };

  const toDateInputValue = (v) => {
    if (!v) return '';
    try {
      const d = new Date(v);
      if (isNaN(d.getTime())) return '';
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    } catch {
      return '';
    }
  };

  

  const clampStr = (v, max = 255) => {
    if (v == null) return v;
    const s = String(v);
    return s.length > max ? s.slice(0, max) : s;
  };
  const sanitizeFreeText = (v) => {
    if (v == null) return v;
    let s = String(v);
    s = s.replace(/\bsex\w*\b/gi, '').replace(/\s{2,}/g, ' ').trim();
    return s;
  };
  const inferGender = (v) => {
    if (!v) return null;
    const s = String(v).toLowerCase();
    if (/(female|cow|ewe|sow|mare|hen|doe)/.test(s)) return 'FEMALE';
    if (/(male|bull|ram|boar|stallion|rooster|buck)/.test(s)) return 'MALE';
    return null;
  };
  const [newAnimal, setNewAnimal] = useState(initialAnimal);
  const [photoFile, setPhotoFile] = useState(null);
  const [isAnalyzingPhoto, setIsAnalyzingPhoto] = useState(false);
  const [zoomSrc, setZoomSrc] = useState(null);
  const [photoById, setPhotoById] = useState({});
  const fetchingRef = useRef(new Set());

  const normalizeHealthStatus = (v) => {
    if (!v) return 'UNKNOWN';
    const s = String(v).toUpperCase();
    if (['EXCELLENT','GOOD','FAIR','POOR','UNKNOWN'].includes(s)) return s;
    const m = s.replace(/\s+/g,'').toUpperCase();
    if (m.includes('EXCELLENT')) return 'EXCELLENT';
    if (m.includes('GOOD')) return 'GOOD';
    if (m.includes('FAIR')) return 'FAIR';
    if (m.includes('POOR')) return 'POOR';
    return 'UNKNOWN';
  };

  const normalizeBreedingStatus = (v) => {
    if (!v) return 'NOT_READY';
    const s = String(v).toLowerCase();
    if (s === 'ready') return 'READY';
    if (s === 'pregnant') return 'PREGNANT';
    if (s === 'breeding') return 'BREEDING';
    if (s === 'not_ready') return 'NOT_READY';
    if (s.includes('preg')) return 'PREGNANT';
    if (s.includes('breed')) return 'BREEDING';
    if (s.includes('not') || s.includes('no')) return 'NOT_READY';
    if (s.includes('ready')) return 'READY';
    return 'NOT_READY';
  };

  const queryClient = useQueryClient();

  const { data: animals = [], isLoading } = useQuery(['animals'], animalsAPI.getAll);

  const addAnimalMutation = useMutation({
    mutationFn: (payload) => animalsAPI.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries(['animals']);
      toast.success('Animal added successfully');
      setShowAddModal(false);
      setNewAnimal(initialAnimal);
    },
    onError: (error) => {
      const msg = error?.response?.data?.message || 'Failed to add animal';
      toast.error(msg);
    }
  });

  const updateAnimalMutation = useMutation({
    mutationFn: ({id, payload}) => animalsAPI.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries(['animals']);
      toast.success('Animal updated successfully');
      setEditAnimal(null);
    },
    onError: (error) => {
      const msg = error?.response?.data?.message || 'Failed to update animal';
      toast.error(msg);
    }
  });

  const deleteAnimalMutation = useMutation({
    mutationFn: animalsAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries(['animals']);
      toast.success('Animal deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete animal');
    }
  });

  const filteredAnimals = animals.filter(animal => {
    const matchesSearch = animal.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         animal.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         animal.breed?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGender = filterGender === 'ALL' || animal.gender === filterGender;
    const matchesStatus = filterStatus === 'ALL' || animal.healthStatus === filterStatus;
    
    return matchesSearch && matchesGender && matchesStatus;
  });

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this animal?')) {
      deleteAnimalMutation.mutate(id);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'EXCELLENT': return 'status-excellent';
      case 'GOOD': return 'status-good';
      case 'FAIR': return 'status-fair';
      case 'POOR': return 'status-poor';
      default: return 'status-unknown';
    }
  };

  const getBreedingStatusColor = (status) => {
    switch (status) {
      case 'READY': return 'breeding-ready';
      case 'PREGNANT': return 'breeding-pregnant';
      case 'BREEDING': return 'breeding-breeding';
      case 'NOT_READY': return 'breeding-not-ready';
      case 'RETIRED': return 'breeding-retired';
      default: return 'status-unknown';
    }
  };

  const getScoreClass = (score) => {
    if (score >= 80) return 'score-excellent';
    if (score >= 60) return 'score-good';
    if (score >= 40) return 'score-fair';
    return 'score-poor';
  };

  const getTypeIcon = (t) => {
    const k = (t || '').toLowerCase();
    if (k.includes('sheep') || k.includes('ewe') || k.includes('ram')) return '🐑';
    if (k.includes('cattle') || k.includes('cow') || k.includes('bull') || k.includes('ox')) return '🐄';
    if (k.includes('chicken') || k.includes('hen') || k.includes('rooster')) return '🐔';
    if (k.includes('goat')) return '🐐';
    if (k.includes('pig') || k.includes('swine') || k.includes('boar') || k.includes('sow')) return '🐖';
    if (k.includes('horse') || k.includes('stallion') || k.includes('mare')) return '🐎';
    if (k.includes('donkey')) return '🫏';
    if (k.includes('mule')) return '🫎';
    if (k.includes('duck')) return '🦆';
    if (k.includes('goose') || k.includes('geese')) return '🪿';
    if (k.includes('turkey')) return '🦃';
    if (k.includes('rabbit') || k.includes('bunny')) return '🐇';
    if (k.includes('llama') || k.includes('alpaca')) return '🦙';
    if (k.includes('bee') || k.includes('honeybee')) return '🐝';
    return '🐾';
  };

  const normalizeUrl = (u) => {
    if (!u) return '';
    const s = String(u).trim();
    if (s.startsWith('data:') || s.startsWith('blob:')) return s;
    if (/^https?:\/\//i.test(s)) return s;
    try {
      return new URL(s, window.location.origin).toString();
    } catch {
      return s;
    }
  };

  const resolvePhotoUrl = (a = {}) => {
    const candidates = [
      a.photoUrl,
      a.photoURL,
      a.imageUrl,
      a.imageURL,
      a.image,
      a.photo,
      a.photoBase64,
      a.imageBase64,
      a.picture,
      a.avatar,
      Array.isArray(a.photos) && a.photos.length ? a.photos[0] : null,
      Array.isArray(a.images) && a.images.length ? a.images[0] : null,
      a.attachments && Array.isArray(a.attachments) && a.attachments.length ? (a.attachments[0].url || a.attachments[0].href) : null,
    ].filter(Boolean);
    const first = candidates.find((x) => x);
    if (!first) return '';
    return normalizeUrl(first);
  };

  useEffect(() => {
    if (!Array.isArray(animals)) return;
    animals.forEach((a) => {
      try {
        if (!a || !a.id) return;
        const hasPhoto = !!resolvePhotoUrl(a);
        if (!hasPhoto && !photoById[a.id] && !fetchingRef.current.has(a.id)) {
          fetchingRef.current.add(a.id);
          animalsAPI.getById(a.id)
            .then((full) => {
              setPhotoById((prev) => ({ ...prev, [a.id]: full }));
            })
            .catch(() => {})
            .finally(() => {
              fetchingRef.current.delete(a.id);
            });
        }
      } catch {}
    });
  }, [animals]);

  const placeholderSvgForAnimal = (a = {}) => {
    const emoji = getTypeIcon(a.type);
    const name = (a.name || '').trim();
    const title = name || (a.type || 'Animal');
    const bg1 = '#f6f7f9';
    const bg2 = '#e9ecf1';
    const svg = `
      <svg xmlns='http://www.w3.org/2000/svg' width='800' height='400'>
        <defs>
          <linearGradient id='g' x1='0' x2='0' y1='0' y2='1'>
            <stop offset='0%' stop-color='${bg1}'/>
            <stop offset='100%' stop-color='${bg2}'/>
          </linearGradient>
        </defs>
        <rect width='100%' height='100%' fill='url(#g)'/>
        <text x='50%' y='52%' dominant-baseline='middle' text-anchor='middle' font-size='120'>${emoji}</text>
        <text x='50%' y='86%' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='28' fill='#667085'>${title.replace(/&/g,'&amp;')}</text>
      </svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  };

  const typeKey = (t) => (t || '').trim().toLowerCase();
  const typeFields = (t) => {
    const k = typeKey(t);
    if (['chicken','hen','rooster','duck','goose','geese','turkey'].some(x=>k.includes(x))) {
      return [
        { key: 'eggProductionPerWeek', label: 'Egg Production (per week)', type: 'number' },
        { key: 'meatScore', label: 'Meat Score (0-100)', type: 'number' },
        { key: 'fertilityScore', label: 'Fertility Score (0-100)', type: 'number' }
      ];
    }
    if (['sheep','ewe','ram'].some(x=>k.includes(x))) {
      return [
        { key: 'woolYield', label: 'Wool Yield (kg/year)', type: 'number' },
        { key: 'meatScore', label: 'Meat Score (0-100)', type: 'number' },
        { key: 'fertilityScore', label: 'Fertility Score (0-100)', type: 'number' }
      ];
    }
    if (['goat','goats'].some(x=>k.includes(x)) || ['cattle','cow','bull','ox'].some(x=>k.includes(x))) {
      return [
        { key: 'milkYield', label: 'Milk Yield (L/day)', type: 'number' },
        { key: 'meatScore', label: 'Meat Score (0-100)', type: 'number' },
        { key: 'fertilityScore', label: 'Fertility Score (0-100)', type: 'number' }
      ];
    }
    if (['pig','pigs','swine','boar','sow'].some(x=>k.includes(x))) {
      return [
        { key: 'growthRate', label: 'Growth Rate', type: 'text' },
        { key: 'meatScore', label: 'Meat Score (0-100)', type: 'number' },
        { key: 'fertilityScore', label: 'Fertility Score (0-100)', type: 'number' }
      ];
    }
    if (['horse','horses','donkey','mule','stallion','mare'].some(x=>k.includes(x))) {
      return [
        { key: 'heightCm', label: 'Height (cm)', type: 'number' },
        { key: 'speed', label: 'Speed', type: 'text' }
      ];
    }
    if (['rabbit','rabbits','bunny'].some(x=>k.includes(x))) {
      return [
        { key: 'litterSize', label: 'Litter Size', type: 'number' },
        { key: 'meatScore', label: 'Meat Score (0-100)', type: 'number' }
      ];
    }
    if (['bee','bees','honeybee'].some(x=>k.includes(x))) {
      return [
        { key: 'honeyYieldKgPerWeek', label: 'Honey Yield (kg/week)', type: 'number' },
        { key: 'temperament', label: 'Temperament', type: 'text' }
      ];
    }
    return [
      { key: 'meatScore', label: 'Meat Score (0-100)', type: 'number' },
      { key: 'fertilityScore', label: 'Fertility Score (0-100)', type: 'number' }
    ];
  };
  const currentTypeFields = typeFields(newAnimal.type);

  return (
    <div className="main-content">
      <div className="page-header">
        <h1>
          <span className="emoji">🐑</span>
          Animals
        </h1>
        <p>Manage your farm animals and their breeding information.</p>
      </div>

      <div className="d-flex justify-between align-center mb-4">
        <button 
          className="btn btn-primary"
          onClick={() => { setNewAnimal(initialAnimal); setShowAddModal(true); }}
        >
          <span className="emoji">➕</span>
          Add Animal
        </button>
      </div>

      <div className="card mb-4">
        <div className="card-header">
          <h3>
            <span className="emoji">🔍</span>
            Search & Filter
          </h3>
        </div>
        <div className="d-flex gap-3 align-center">
          <div className="form-group" style={{flex: 1}}>
            <input
              type="text"
              placeholder="Search animals by name, type, or breed..."
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
          <div className="form-group">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="form-control"
            >
              <option value="ALL">All Status</option>
              <option value="EXCELLENT">Excellent</option>
              <option value="GOOD">Good</option>
              <option value="FAIR">Fair</option>
              <option value="POOR">Poor</option>
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading animals...</p>
        </div>
      ) : (
        <div className="animal-grid">
          {filteredAnimals.map((animal) => {
            const enriched = photoById[animal.id] ? { ...animal, ...photoById[animal.id] } : animal;
            const coverSrc = resolvePhotoUrl(enriched) || placeholderSvgForAnimal(enriched);
            const avatarSrc = resolvePhotoUrl(enriched);
            return (
            <div key={animal.id} className="animal-card">
              <div
                className="animal-card-photo"
                style={{ width:'100%', height:160, overflow:'hidden', cursor:'zoom-in', background:'#f6f7f9', borderTopLeftRadius:12, borderTopRightRadius:12 }}
                onClick={() => setZoomSrc(coverSrc)}
              >
                <img
                  src={coverSrc}
                  alt={enriched.name}
                  style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}
                />
              </div>
              <div className="animal-card-header">
                {avatarSrc ? (
                  <img
                    src={avatarSrc}
                    alt={enriched.name}
                    style={{width:36,height:36,borderRadius:'50%',objectFit:'cover',marginRight:8}}
                    onError={(e)=>{ e.currentTarget.style.display='none'; }}
                  />
                ) : (
                  <span className="emoji" style={{marginRight:8}}>{getTypeIcon(enriched.type)}</span>
                )}
                <span>{enriched.name}</span>
              </div>
              <div className="animal-card-body">
                <div className="animal-info">
                  <span>Type: {enriched.type}</span>
                  <span>Breed: {enriched.breed}</span>
                </div>
                <div className="animal-info">
                  <span>Gender: {enriched.gender}</span>
                  <span>Health: {enriched.healthStatus}</span>
                </div>
                <div className="animal-info">
                  <span>Breeding: {enriched.breedingStatus}</span>
                  <span>Score: {enriched.breedingScore || 0}</span>
                </div>
                {(enriched.milkYield || enriched.meatScore) && (
                  <div className="animal-info">
                    {enriched.milkYield != null && <span>Milk: {enriched.milkYield} L/d</span>}
                    {enriched.meatScore != null && <span>Meat: {enriched.meatScore}</span>}
                  </div>
                )}
                {(enriched.color || enriched.size) && (
                  <div className="animal-info">
                    {enriched.color && <span>Color: {enriched.color}</span>}
                    {enriched.size && <span>Size: {enriched.size}</span>}
                  </div>
                )}
                {enriched.weight && (
                  <div className="animal-info">
                    <span>Weight: {enriched.weight} kg</span>
                  </div>
                )}
                <div className="d-flex gap-2 mt-3">
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => {
                      setSelectedAnimal(enriched);
                      setShowDetailsModal(true);
                    }}
                  >
                    <span className="emoji">👁️</span>
                    View
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={async () => { 
                      try {
                        const full = await animalsAPI.getById(animal.id);
                        setEditOriginal(full);
                        setEditAnimal(normalizeFromApi(full));
                        setTimeout(() => {
                          const el = document.getElementById('edit-animal-form');
                          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }, 0);
                      } catch {
                        // fallback to list item if detail fetch fails
                        setEditOriginal(animal);
                        setEditAnimal(normalizeFromApi(animal));
                      }
                    }}
                  >
                    <span className="emoji">✏️</span>
                    Edit
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDelete(animal.id)}
                  >
                    <span className="emoji">🗑️</span>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          );})}
        </div>
      )}

      {zoomSrc && (
        <div
          className="modal-overlay"
          style={{ display:'flex', alignItems:'center', justifyContent:'center' }}
          onClick={() => setZoomSrc(null)}
        >
          <div className="modal-content" style={{ background:'transparent', boxShadow:'none' }}>
            <img
              src={zoomSrc}
              alt="Preview"
              style={{ maxWidth:'90vw', maxHeight:'85vh', objectFit:'contain', borderRadius:8, display:'block' }}
              onClick={(e)=> e.stopPropagation()}
            />
          </div>
        </div>
      )}

      {editAnimal && (
        <div className="card mt-4" id="edit-animal-form">
          <div className="card-header">
            <h3>
              <span className="emoji">✏️</span>
              Edit Animal — {editAnimal.name}
            </h3>
          </div>
          <div className="card-body">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!editAnimal.name?.trim()) { toast.error('Name is required'); return; }
                if (!editAnimal.type?.trim()) { toast.error('Type is required'); return; }
                const original = editOriginal || (Array.isArray(animals) ? animals.find(a => a.id === editAnimal.id) : null) || {};
                const converted = {
                  id: editAnimal.id,
                  name: clampStr(editAnimal.name),
                  type: clampStr(editAnimal.type),
                  breed: clampStr(editAnimal.breed),
                  gender: editAnimal.gender,
                  healthStatus: normalizeHealthStatus(editAnimal.healthStatus),
                  breedingStatus: normalizeBreedingStatus(editAnimal.breedingStatus),
                  weight: editAnimal.weight !== '' && editAnimal.weight != null ? Number(editAnimal.weight) : original.weight,
                  milkYield: editAnimal.milkYield !== '' && editAnimal.milkYield != null ? Number(editAnimal.milkYield) : original.milkYield,
                  meatScore: editAnimal.meatScore !== '' && editAnimal.meatScore != null ? Number(editAnimal.meatScore) : original.meatScore,
                  fertilityScore: editAnimal.fertilityScore !== '' && editAnimal.fertilityScore != null ? Number(editAnimal.fertilityScore) : original.fertilityScore,
                  woolYield: editAnimal.woolYield !== '' && editAnimal.woolYield != null ? Number(editAnimal.woolYield) : original.woolYield,
                  eggProductionPerWeek: editAnimal.eggProductionPerWeek !== '' && editAnimal.eggProductionPerWeek != null ? Number(editAnimal.eggProductionPerWeek) : original.eggProductionPerWeek,
                  heightCm: editAnimal.heightCm !== '' && editAnimal.heightCm != null ? Number(editAnimal.heightCm) : original.heightCm,
                  litterSize: editAnimal.litterSize !== '' && editAnimal.litterSize != null ? Number(editAnimal.litterSize) : original.litterSize,
                  honeyYieldKgPerWeek: editAnimal.honeyYieldKgPerWeek !== '' && editAnimal.honeyYieldKgPerWeek != null ? Number(editAnimal.honeyYieldKgPerWeek) : original.honeyYieldKgPerWeek,
                  temperament: clampStr(editAnimal.temperament),
                  color: clampStr(editAnimal.color),
                  size: clampStr(editAnimal.size),
                  geneticsTraits: clampStr(sanitizeFreeText(editAnimal.geneticsTraits), 250),
                  notes: clampStr(sanitizeFreeText(editAnimal.notes), 255),
                };
                const payload = { ...original, ...converted };
                updateAnimalMutation.mutate({ id: editAnimal.id, payload });
              }}
            >
              <div className="d-grid gap-2">
                <div className="d-flex gap-2">
                  <div className="form-group" style={{flex:1}}>
                    <label>Name</label>
                    <input className="form-control" value={editAnimal.name || ''} onChange={(e)=>setEditAnimal({...editAnimal, name: e.target.value})} />
                  </div>
                  <div className="form-group" style={{flex:1}}>
                    <label>Type</label>
                    <input className="form-control" value={editAnimal.type || ''} onChange={(e)=>setEditAnimal({...editAnimal, type: e.target.value})} />
                  </div>
                </div>
                <div className="d-flex gap-2">
                  <div className="form-group" style={{flex:1}}>
                    <label>Breed</label>
                    <input className="form-control" value={editAnimal.breed || ''} onChange={(e)=>setEditAnimal({...editAnimal, breed: e.target.value})} />
                  </div>
                  <div className="form-group" style={{flex:1}}>
                    <label>Gender</label>
                    <select className="form-control" value={editAnimal.gender || 'MALE'} onChange={(e)=>setEditAnimal({...editAnimal, gender: e.target.value})}>
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                    </select>
                  </div>
                </div>
                <div className="d-flex gap-2">
                  <div className="form-group" style={{flex:1}}>
                    <label>Health Status</label>
                    <select className="form-control" value={editAnimal.healthStatus || 'GOOD'} onChange={(e)=>setEditAnimal({...editAnimal, healthStatus: e.target.value})}>
                      <option value="EXCELLENT">Excellent</option>
                      <option value="GOOD">Good</option>
                      <option value="FAIR">Fair</option>
                      <option value="POOR">Poor</option>
                    </select>
                  </div>
                  <div className="form-group" style={{flex:1}}>
                    <label>Breeding Status</label>
                    <select className="form-control" value={editAnimal.breedingStatus || 'READY'} onChange={(e)=>setEditAnimal({...editAnimal, breedingStatus: e.target.value})}>
                      <option value="READY">Ready</option>
                      <option value="PREGNANT">Pregnant</option>
                      <option value="BREEDING">Breeding</option>
                      <option value="NOT_READY">Not Ready</option>
                      <option value="RETIRED">Retired</option>
                    </select>
                  </div>
                </div>
                <div className="d-flex gap-2">
                  <div className="form-group" style={{flex:1}}>
                    <label>Weight (kg)</label>
                    <input type="number" className="form-control" value={editAnimal.weight || ''} onChange={(e)=>setEditAnimal({...editAnimal, weight: e.target.value})} />
                  </div>
                </div>
                <div className="d-flex gap-2">
                  <div className="form-group" style={{flex:1}}>
                    <label>Temperament</label>
                    <input className="form-control" value={editAnimal.temperament || ''} onChange={(e)=>setEditAnimal({...editAnimal, temperament: e.target.value})} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Genetic Traits</label>
                  <textarea className="form-control" rows={3} value={editAnimal.geneticsTraits || ''} onChange={(e)=>setEditAnimal({...editAnimal, geneticsTraits: sanitizeFreeText(e.target.value)})} />
                </div>
              </div>
              <div className="d-flex justify-end gap-2 mt-3">
                <button type="button" className="btn btn-outline" onClick={() => { setEditAnimal(null); setEditOriginal(null); }} disabled={updateAnimalMutation.isLoading}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={updateAnimalMutation.isLoading}>{updateAnimalMutation.isLoading ? 'Saving...' : 'Save Changes'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {filteredAnimals.length === 0 && !isLoading && (
        <div className="card text-center">
          <span className="emoji" style={{fontSize: '4rem'}}>🐑</span>
          <h3>No Animals Found</h3>
          <p>
            {searchTerm || filterGender !== 'ALL' || filterStatus !== 'ALL'
              ? 'Try adjusting your search or filters.'
              : 'Add your first animal to get started with smart breeding.'
            }
          </p>
          {!searchTerm && filterGender === 'ALL' && filterStatus === 'ALL' && (
            <button 
              className="btn btn-primary"
              onClick={() => setShowAddModal(true)}
            >
              <span className="emoji">➕</span>
              Add First Animal
            </button>
          )}
        </div>
      )}

      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Add New Animal</h2>
              <button 
                className="modal-close"
                onClick={() => setShowAddModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!newAnimal.name?.trim()) { toast.error('Name is required'); return; }
                  if (!newAnimal.type?.trim()) { toast.error('Type is required'); return; }
                  const payload = {
                    ...newAnimal,
                    weight: newAnimal.weight ? Number(newAnimal.weight) : undefined,
                    milkYield: newAnimal.milkYield ? Number(newAnimal.milkYield) : undefined,
                    meatScore: newAnimal.meatScore ? Number(newAnimal.meatScore) : undefined,
                    fertilityScore: newAnimal.fertilityScore ? Number(newAnimal.fertilityScore) : undefined,
                    woolYield: newAnimal.woolYield ? Number(newAnimal.woolYield) : undefined,
                    eggProductionPerWeek: newAnimal.eggProductionPerWeek ? Number(newAnimal.eggProductionPerWeek) : undefined,
                    heightCm: newAnimal.heightCm ? Number(newAnimal.heightCm) : undefined,
                    litterSize: newAnimal.litterSize ? Number(newAnimal.litterSize) : undefined,
                    honeyYieldKgPerWeek: newAnimal.honeyYieldKgPerWeek ? Number(newAnimal.honeyYieldKgPerWeek) : undefined,
                    healthStatus: normalizeHealthStatus(newAnimal.healthStatus),
                    breedingStatus: normalizeBreedingStatus(newAnimal.breedingStatus),
                    name: clampStr(newAnimal.name),
                    type: clampStr(newAnimal.type),
                    breed: clampStr(newAnimal.breed),
                    temperament: clampStr(newAnimal.temperament),
                    color: clampStr(newAnimal.color),
                    size: clampStr(newAnimal.size),
                    geneticsTraits: clampStr(sanitizeFreeText(newAnimal.geneticsTraits), 250),
                    notes: clampStr(sanitizeFreeText(newAnimal.notes), 255)
                  };
                  try {
                    const created = await addAnimalMutation.mutateAsync(payload);
                    const createdId = created?.id || created?._id || created?.animal?.id || created?.animal?._id;
                    if (photoFile && createdId) {
                      try {
                        await uploadAPI.analyzeAndSave(createdId, photoFile, newAnimal.name || 'Unknown');
                        toast.success('Photo uploaded');
                      } catch (e) {
                        toast.error('Photo upload failed');
                      }
                    }
                    queryClient.invalidateQueries(['animals']);
                    setShowAddModal(false);
                    setNewAnimal(initialAnimal);
                    setPhotoFile(null);
                  } catch (err) {
                    // errors handled in onError
                  }
                }}
              >
                <div className="d-grid gap-2">
                  <div className="form-group">
                    <label>Photo</label>
                    <input
                      type="file"
                      accept="image/*"
                      className="form-control"
                      onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                    />
                    <div className="d-flex gap-2 mt-2">
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={async () => {
                          if (!photoFile) { toast.error('Choose a photo first'); return; }
                          setIsAnalyzingPhoto(true);
                          try {
                            const result = await uploadAPI.analyzeImage(photoFile, newAnimal.name || 'Unknown');
                            const data = result?.analysis || result || {};
                            const aiGender = inferGender(data.gender || data.sex || data.predictedGender || data.animalType || '');
                            setNewAnimal((prev) => ({
                              ...prev,
                              type: clampStr(data.animalType || data.type || prev.type),
                              breed: clampStr(data.breed || prev.breed),
                              color: clampStr(data.color || prev.color),
                              size: clampStr(data.size || prev.size),
                              weight: data.weight ?? prev.weight,
                              temperament: clampStr(data.temperament || prev.temperament),
                              geneticsTraits: clampStr(sanitizeFreeText((data.geneticsTraitsDetails || data.predictedTraits || data.geneticsTraits || prev.geneticsTraits)), 250),
                              healthStatus: normalizeHealthStatus(data.healthStatus || prev.healthStatus),
                              breedingStatus: normalizeBreedingStatus(data.breedingReadiness || data.breedingStatus || prev.breedingStatus),
                              milkYield: data.milkYield ?? prev.milkYield,
                              meatScore: data.meatScore ?? prev.meatScore,
                              fertilityScore: data.fertilityScore ?? prev.fertilityScore,
                              woolYield: data.woolYield ?? prev.woolYield,
                              eggProductionPerWeek: (data.eggProductionPerWeek ?? data.eggProductionPerYear) ?? prev.eggProductionPerWeek,
                              growthRate: data.growthRate ?? prev.growthRate,
                              heightCm: data.heightCm ?? prev.heightCm,
                              speed: data.speed ?? prev.speed,
                              litterSize: data.litterSize ?? prev.litterSize,
                              honeyYieldKgPerWeek: (data.honeyYieldKgPerWeek ?? data.honeyYieldKg) ?? prev.honeyYieldKgPerWeek,
                              notes: sanitizeFreeText(data.notes || prev.notes),
                              gender: aiGender ? aiGender : prev.gender
                            }));
                            if (data.breedingScore != null) {
                              setNewAnimal((prev) => ({ ...prev, breedingScore: data.breedingScore }));
                            }
                            toast.success('Photo analyzed');
                          } catch (e) {
                            toast.error('Analysis failed');
                          } finally {
                            setIsAnalyzingPhoto(false);
                          }
                        }}
                        disabled={!photoFile || isAnalyzingPhoto}
                      >
                        {isAnalyzingPhoto ? 'Analyzing...' : 'Analyze Photo with AI'}
                      </button>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Name</label>
                    <input
                      className="form-control"
                      value={newAnimal.name}
                      onChange={(e) => setNewAnimal({ ...newAnimal, name: e.target.value })}
                      placeholder="e.g., Daisy"
                      required
                    />
                  </div>
                  <div className="d-flex gap-2">
                    <div className="form-group" style={{flex:1}}>
                      <label>Type</label>
                      <input
                        className="form-control"
                        value={newAnimal.type}
                        onChange={(e) => setNewAnimal({ ...newAnimal, type: e.target.value })}
                        placeholder="Cow, Sheep, Goat..."
                        required
                      />
                    </div>
                    <div className="form-group" style={{flex:1}}>
                      <label>Breed</label>
                      <input
                        className="form-control"
                        value={newAnimal.breed}
                        onChange={(e) => setNewAnimal({ ...newAnimal, breed: e.target.value })}
                        placeholder="Holstein, Merino..."
                      />
                    </div>
                  </div>
                  <div className="d-flex gap-2">
                    <div className="form-group" style={{flex:1}}>
                      <label>Gender</label>
                      <select
                        className="form-control"
                        value={newAnimal.gender}
                        onChange={(e) => setNewAnimal({ ...newAnimal, gender: e.target.value })}
                      >
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                      </select>
                    </div>
                    <div className="form-group" style={{flex:1}}>
                      <label>Health Status</label>
                      <select
                        className="form-control"
                        value={newAnimal.healthStatus}
                        onChange={(e) => setNewAnimal({ ...newAnimal, healthStatus: e.target.value })}
                      >
                        <option value="EXCELLENT">Excellent</option>
                        <option value="GOOD">Good</option>
                        <option value="FAIR">Fair</option>
                        <option value="POOR">Poor</option>
                      </select>
                    </div>
                  </div>
                  <div className="d-flex gap-2">
                    <div className="form-group" style={{flex:1}}>
                      <label>Breeding Status</label>
                      <select
                        className="form-control"
                        value={newAnimal.breedingStatus}
                        onChange={(e) => setNewAnimal({ ...newAnimal, breedingStatus: e.target.value })}
                      >
                        <option value="READY">Ready</option>
                        <option value="PREGNANT">Pregnant</option>
                        <option value="BREEDING">Breeding</option>
                        <option value="NOT_READY">Not Ready</option>
                        <option value="RETIRED">Retired</option>
                      </select>
                    </div>
                    <div className="form-group" style={{flex:1}}>
                      <label>Birth Date</label>
                      <input
                        type="date"
                        className="form-control"
                        value={toDateInputValue(newAnimal.birthDate)}
                        onChange={(e) => setNewAnimal({ ...newAnimal, birthDate: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="d-flex gap-2">
                    <div className="form-group" style={{flex:1}}>
                      <label>Weight (kg)</label>
                      <input
                        type="number"
                        className="form-control"
                        value={newAnimal.weight}
                        onChange={(e) => setNewAnimal({ ...newAnimal, weight: e.target.value })}
                        min="0"
                        step="0.1"
                      />
                    </div>
                    <div className="form-group" style={{flex:1}}>
                      <label>Color</label>
                      <input
                        className="form-control"
                        value={newAnimal.color}
                        onChange={(e) => setNewAnimal({ ...newAnimal, color: e.target.value })}
                        placeholder="e.g., Black and white"
                      />
                    </div>
                  </div>
                  <div className="d-flex gap-2">
                    <div className="form-group" style={{flex:1}}>
                      <label>Size</label>
                      <input
                        className="form-control"
                        value={newAnimal.size}
                        onChange={(e) => setNewAnimal({ ...newAnimal, size: e.target.value })}
                        placeholder="Small, Medium, Large"
                      />
                    </div>
                    <div className="form-group" style={{flex:1}}>
                      <label>Temperament</label>
                      <input
                        className="form-control"
                        value={newAnimal.temperament}
                        onChange={(e) => setNewAnimal({ ...newAnimal, temperament: e.target.value })}
                        placeholder="Calm, Aggressive, Docile..."
                      />
                    </div>
                  </div>

                  {currentTypeFields.length > 0 && (
                    <div className="d-flex gap-2" style={{flexWrap:'wrap'}}>
                      {currentTypeFields.map((f) => (
                        <div key={f.key} className="form-group" style={{flex:1, minWidth:280}}>
                          <label>{f.label}</label>
                          {f.type === 'select' ? (
                            <select
                              className="form-control"
                              value={newAnimal[f.key] || ''}
                              onChange={(e)=>setNewAnimal({ ...newAnimal, [f.key]: e.target.value })}
                            >
                              <option value="">Any</option>
                            </select>
                          ) : (
                            <input
                              type={f.type}
                              className="form-control"
                              value={newAnimal[f.key] || ''}
                              onChange={(e)=>setNewAnimal({ ...newAnimal, [f.key]: e.target.value })}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="form-group">
                    <label>Genetic Traits</label>
                    <textarea
                      className="form-control"
                      value={newAnimal.geneticsTraits}
                      onChange={(e) => setNewAnimal({ ...newAnimal, geneticsTraits: sanitizeFreeText(e.target.value) })}
                      placeholder="Enter notable genetic traits"
                      rows={3}
                    />
                  </div>
                  <div className="form-group">
                    <label>Notes</label>
                    <textarea
                      className="form-control"
                      value={newAnimal.notes}
                      onChange={(e) => setNewAnimal({ ...newAnimal, notes: sanitizeFreeText(e.target.value) })}
                      placeholder="Additional notes"
                      rows={3}
                    />
                  </div>
                </div>
                <div className="d-flex justify-end gap-2 mt-3">
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => setShowAddModal(false)}
                    disabled={addAnimalMutation.isLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={addAnimalMutation.isLoading}
                  >
                    {addAnimalMutation.isLoading ? 'Saving...' : 'Save Animal'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showDetailsModal && selectedAnimal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">{selectedAnimal.name} Details</h2>
              <button 
                className="modal-close"
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedAnimal(null);
                }}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              { (() => { const src = selectedAnimal.imageUrl || selectedAnimal.photoUrl || selectedAnimal.image || selectedAnimal.photo; return src ? (
                <div style={{marginBottom:16}}>
                  <img src={src} alt={selectedAnimal.name} style={{maxWidth:'100%', borderRadius:12}} />
                </div>
              ) : null; })() }
              <div className="animal-details-full">
                <div className="detail-row">
                  <span className="detail-label">Type:</span>
                  <span className="detail-value">{selectedAnimal.type}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Breed:</span>
                  <span className="detail-value">{selectedAnimal.breed}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Gender:</span>
                  <span className={`detail-value gender-${selectedAnimal.gender?.toLowerCase()}`}>
                    {selectedAnimal.gender}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Health Status:</span>
                  <span className={`detail-value ${getStatusColor(selectedAnimal.healthStatus)}`}>
                    {selectedAnimal.healthStatus}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Breeding Status:</span>
                  <span className={`detail-value ${getBreedingStatusColor(selectedAnimal.breedingStatus)}`}>
                    {selectedAnimal.breedingStatus}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Breeding Score:</span>
                  <span className={`detail-value ${getScoreClass(selectedAnimal.breedingScore)}`}>
                    {selectedAnimal.breedingScore || 0}
                  </span>
                </div>
                {(selectedAnimal.milkYield != null || selectedAnimal.meatScore != null || selectedAnimal.fertilityScore != null) && (
                  <div className="detail-row">
                    <span className="detail-label">Production:</span>
                    <span className="detail-value">
                      {[
                        selectedAnimal.milkYield != null ? `Milk ${selectedAnimal.milkYield} L/d` : null,
                        selectedAnimal.meatScore != null ? `Meat ${selectedAnimal.meatScore}` : null,
                        selectedAnimal.fertilityScore != null ? `Fertility ${selectedAnimal.fertilityScore}` : null,
                      ].filter(Boolean).join(' · ')}
                    </span>
                  </div>
                )}
                {(selectedAnimal.color || selectedAnimal.size) && (
                  <div className="detail-row">
                    <span className="detail-label">Appearance:</span>
                    <span className="detail-value">
                      {[selectedAnimal.color, selectedAnimal.size].filter(Boolean).join(' · ')}
                    </span>
                  </div>
                )}
                {selectedAnimal.birthDate && (
                  <div className="detail-row">
                    <span className="detail-label">Birth Date:</span>
                    <span className="detail-value">
                      {new Date(selectedAnimal.birthDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {selectedAnimal.weight && (
                  <div className="detail-row">
                    <span className="detail-label">Weight:</span>
                    <span className="detail-value">{selectedAnimal.weight} kg</span>
                  </div>
                )}
                {selectedAnimal.geneticsTraits && (
                  <div className="detail-row">
                    <span className="detail-label">Genetic Traits:</span>
                    <span className="detail-value">{selectedAnimal.geneticsTraits}</span>
                  </div>
                )}
                {selectedAnimal.notes && (
                  <div className="detail-row">
                    <span className="detail-label">Notes:</span>
                    <span className="detail-value">{selectedAnimal.notes}</span>
                  </div>
                )}
                {selectedAnimal.temperament && (
                  <div className="detail-row">
                    <span className="detail-label">Temperament:</span>
                    <span className="detail-value">{selectedAnimal.temperament}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Animals;

