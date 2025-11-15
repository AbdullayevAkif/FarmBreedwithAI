package com.example.farmbreedwithai.service;

import com.example.farmbreedwithai.dto.*;
import com.example.farmbreedwithai.entity.Animal;
import com.example.farmbreedwithai.entity.BoxAnimal;
import com.example.farmbreedwithai.entity.BreedingBox;
import com.example.farmbreedwithai.repository.AnimalRepository;
import com.example.farmbreedwithai.repository.BoxAnimalRepository;
import com.example.farmbreedwithai.repository.BreedingBoxRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.Random;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BreedingBoxService {
    
    private final GeminiService geminiService;
    private final AnimalRepository animalRepository;
    private final BreedingBoxRepository breedingBoxRepository;
    private final BoxAnimalRepository boxAnimalRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final BreedInfoService breedInfoService;
    
    private Integer calculateCompatibility(Animal animal1, Animal animal2) {
        int baseScore = 50;
        if (animal1.getBreedingScore() != null && animal2.getBreedingScore() != null) {
            baseScore += (animal1.getBreedingScore() + animal2.getBreedingScore()) / 4;
        }
        if (animal1.getBreed() != null && animal2.getBreed() != null && !animal1.getBreed().equals(animal2.getBreed())) {
            baseScore += 10;
        }
        return Math.min(100, baseScore);
    }

    public List<java.util.Map<String, Object>> computeSmartRecommendations(com.example.farmbreedwithai.dto.SmartRecommendationsRequest req) {
        try {
            Long selectedId = req.getAnimalId();
            com.example.farmbreedwithai.entity.Animal selected = animalRepository.findById(selectedId).orElse(null);
            if (selected == null) return java.util.Collections.emptyList();

            java.util.List<com.example.farmbreedwithai.entity.Animal> pool;
            if (req.getLimitToIds() != null && !req.getLimitToIds().isEmpty()) {
                pool = animalRepository.findAllById(req.getLimitToIds());
            } else {
                pool = animalRepository.findAll();
            }
            String sp = (req.getSpecies() != null ? req.getSpecies() : selected.getType());
            String spLower = sp == null ? "" : sp.toLowerCase();
            java.util.List<com.example.farmbreedwithai.entity.Animal> same = new java.util.ArrayList<>();
            for (com.example.farmbreedwithai.entity.Animal a : pool) {
                if (!a.getId().equals(selected.getId()) && a.getType() != null && spLower.contains(a.getType().toLowerCase()) || (a.getType() != null && a.getType().toLowerCase().contains(spLower))) {
                    same.add(a);
                }
            }

            Random rng = new Random(System.nanoTime());
            java.util.Collections.shuffle(same, rng);

            java.util.List<java.util.Map<String, Object>> candidates = new java.util.ArrayList<>();
            for (com.example.farmbreedwithai.entity.Animal a : same) {
                java.util.Map<String, Object> m = new java.util.HashMap<>();
                m.put("id", a.getId());
                m.put("name", a.getName());
                m.put("gender", a.getGender() != null ? a.getGender().name() : null);
                m.put("type", a.getType());
                m.put("color", a.getColor());
                m.put("temperament", a.getTemperament());
                m.put("breedingScore", a.getBreedingScore());
                java.util.Map<String, Object> traits = new java.util.HashMap<>();
                traits.put("weight", a.getWeight());
                traits.put("health", a.getHealthStatus() != null ? a.getHealthStatus().name() : null);
                m.put("traits", traits);
                candidates.add(m);
            }

            String guidance;
            String spl = spLower;
            if (spl.contains("sheep")) guidance = "Favor wool yield for WOOL; moderate size for grazing efficiency; avoid high-risk health lines.";
            else if (spl.contains("catt")) guidance = "Favor milk yield for MILK and meat score for MEAT; weight/size per preference; avoid calving risk pairs.";
            else if (spl.contains("goat")) guidance = "Favor milk yield for MILK; consider heat tolerance for Hot climate.";
            else if (spl.contains("chicken")) guidance = "Favor egg production for EGGS; adjust for heat tolerance and broodiness.";
            else if (spl.contains("pig")) guidance = "Favor growth rate and meat quality for MEAT; heat stress sensitivity in Hot climate.";
            else guidance = "Optimize for requested objective, climate, and health.";

            StringBuilder webCtx = new StringBuilder();
            try {
                String selCtx = breedInfoService.fetchBreedSummary(selected.getType(), selected.getBreed());
                if (selCtx != null && !selCtx.isBlank()) webCtx.append("- Selected: ").append(selCtx).append('\n');
            } catch (Exception ignore) {}
            int ctxAdded = 0;
            for (com.example.farmbreedwithai.entity.Animal a : same) {
                if (ctxAdded >= 8) break;
                try {
                    String c = breedInfoService.fetchBreedSummary(a.getType(), a.getBreed());
                    if (c != null && !c.isBlank()) { webCtx.append("- Candidate: ").append(c).append('\n'); ctxAdded++; }
                } catch (Exception ignore) {}
            }

            java.util.Map<String, Object> sel = new java.util.LinkedHashMap<>();
            sel.put("id", selected.getId());
            sel.put("name", selected.getName());
            sel.put("gender", selected.getGender() != null ? selected.getGender().name() : null);
            sel.put("type", selected.getType());
            sel.put("breed", selected.getBreed());
            sel.put("color", selected.getColor());
            sel.put("temperament", selected.getTemperament());
            java.util.Map<String, Object> selTraits = new java.util.LinkedHashMap<>();
            selTraits.put("weight", selected.getWeight());
            selTraits.put("health", selected.getHealthStatus() != null ? selected.getHealthStatus().name() : null);
            selTraits.put("size", selected.getSize());
            sel.put("traits", selTraits);

            String nonce = Long.toHexString(System.nanoTime());
            String prompt = "Role: Expert livestock genetic advisor.\n" +
                    "Task: Choose the TOP pairings optimizing for user preferences.\n" +
                    "Preferences: size=" + (req.getSize()) + ", focus=" + (req.getFocus()) + ", climate=" + (req.getClimate() != null ? req.getClimate() : "Moderate") + ".\n" +
                    "Selectable options: " + objectMapper.writeValueAsString(req.getOptions() != null ? req.getOptions() : java.util.Collections.emptyMap()) + ".\n" +
                    "Per-breed web context (summaries):\n" + webCtx.toString() +
                    "Selected animal JSON: " + objectMapper.writeValueAsString(sel) + "\n" +
                    "Candidate animals JSON: " + objectMapper.writeValueAsString(candidates) + "\n" +
                    "Output: Strict JSON array (no markdown) of up to 6 objects with this exact shape:\n" +
                    "{ animal1Id, animal1Name, animal2Id, animal2Name, compatibilityScore, offspringPrediction: { predictedBreed, predictedScore, expectedWeight, predictedWoolYield, predictedMeatScore, expectedMilkYield, expectedEggsPerWeek, expectedColor, expectedTemperament, inheritableHealthRisks } }\n" +
                    "Rules: Each pair MUST be exactly one FEMALE with one MALE selected from the provided candidates; only consider provided candidates; match selectable options; use averages for numeric traits when possible; climate modifiers apply. Prefer diversity: if several pairs have similar scores, rotate alternatives and avoid returning the same individuals across runs.\n" +
                    "Diversity nonce: " + nonce + "\n" +
                    "Species guidance: " + guidance;

            try {
                String ai = geminiService.generateWithPrompt(prompt);
                String text = ai == null ? "" : ai.trim();
                String json = text.startsWith("[") ? text : text.substring(Math.max(0, text.indexOf('[')));
                if (json != null && json.startsWith("[")) {
                    java.util.List list = objectMapper.readValue(json, java.util.List.class);
                    java.util.Collections.shuffle(list, rng);
                    if (list.size() > 6) return list.subList(0, 6);
                    return list;
                }
            } catch (Exception ignore) {}

            java.util.List<java.util.Map<String, Object>> out = new java.util.ArrayList<>();
            java.util.function.Function<com.example.farmbreedwithai.entity.Animal, Integer> score = (cand) -> {
                int s = cand.getBreedingScore() != null ? cand.getBreedingScore() : 0;
                Double w = cand.getWeight();
                String size = req.getSize();
                if ("SMALL".equals(size)) s += (w != null && w < 50.0) ? 10 : -5;
                if ("MEDIUM".equals(size)) s += (w != null && w >= 50.0 && w <= 80.0) ? 10 : -5;
                if ("LARGE".equals(size)) s += (w != null && w > 80.0) ? 10 : -5;
                String focus = req.getFocus();
                if ("MEAT".equals(focus)) s += (w != null ? Math.min(100, (int)Math.round(w)) : 0); 
                if ("Hot".equals(req.getClimate())) s += (w != null && w < 70.0) ? 4 : -3;
                if ("Cold".equals(req.getClimate())) s += (w != null && w >= 70.0) ? 4 : -2;
                java.util.Map<String, Object> opts = req.getOptions() != null ? req.getOptions() : java.util.Collections.emptyMap();
                java.util.function.BiFunction<String, Object, Integer> cat = (key, values) -> {
                    if (values == null) return 0;
                    java.util.List<?> arr = (values instanceof java.util.List) ? (java.util.List<?>) values : java.util.List.of(values);
                    String val = null;
                    if ("color".equals(key)) val = cand.getColor();
                    if ("temperament".equals(key)) val = cand.getTemperament();
                    if (val == null) return 0;
                    for (Object v : arr) if (v != null && val.equalsIgnoreCase(String.valueOf(v))) return 8;
                    return 0;
                };
                s += cat.apply("color", opts.get("color"));
                s += cat.apply("temperament", opts.get("temperament"));
                return s;
            };

            java.util.List<com.example.farmbreedwithai.entity.Animal> opp = new java.util.ArrayList<>();
            com.example.farmbreedwithai.entity.Animal.Gender og = selected.getGender() == com.example.farmbreedwithai.entity.Animal.Gender.MALE ? com.example.farmbreedwithai.entity.Animal.Gender.FEMALE : com.example.farmbreedwithai.entity.Animal.Gender.MALE;
            for (com.example.farmbreedwithai.entity.Animal c : same) if (c.getGender() == og) opp.add(c);
            opp.sort((a,b) -> Integer.compare(score.apply(b), score.apply(a)));
            int limit = Math.min(6, opp.size());
            for (int i = 0; i < limit; i++) {
                com.example.farmbreedwithai.entity.Animal c = opp.get(i);
                java.util.Map<String, Object> pair = new java.util.LinkedHashMap<>();
                pair.put("animal1Id", selected.getId());
                pair.put("animal1Name", selected.getName());
                pair.put("animal2Id", c.getId());
                pair.put("animal2Name", c.getName());
                pair.put("compatibilityScore", Math.max(0, Math.min(100, score.apply(c))));
                java.util.Map<String, Object> pred = new java.util.LinkedHashMap<>();
                pred.put("predictedBreed", selected.getType());
                Double sw = selected.getWeight();
                Double cw = c.getWeight();
                Double ew = (sw != null && cw != null) ? ((sw + cw) / 2.0) : (sw != null ? sw : cw);
                pred.put("expectedWeight", ew);
                pred.put("expectedColor", selected.getColor() != null && c.getColor() != null ? selected.getColor()+"/"+c.getColor() : (selected.getColor() != null ? selected.getColor() : c.getColor()));
                pred.put("expectedTemperament", selected.getTemperament() != null && c.getTemperament() != null ? selected.getTemperament()+"-"+c.getTemperament() : (selected.getTemperament() != null ? selected.getTemperament() : c.getTemperament()));
                pred.put("inheritableHealthRisks", selected.getHealthStatus() != null ? selected.getHealthStatus().name() : "Unknown");
                pred.put("predictedSpecies", selected.getType());

                try {
                    String left = selected.getBreed();
                    String right = c.getBreed();
                    if (left != null && right != null) {
                        String[] queries = new String[] {
                            left + " " + right + " cross",
                            left + "-" + right + " hybrid",
                            left + " × " + right,
                            (selected.getType() != null ? selected.getType() : "") + " crossbreed " + left + " " + right
                        };
                        String info = null; String img = null;
                        for (String q : queries) {
                            if (info == null) info = breedInfoService.fetchAnyBreedSummary(q);
                            if (img == null) img = breedInfoService.fetchAnyBreedImage(q);
                            if (info != null && img != null) break;
                        }
                        if (info != null) pred.put("hybridInfo", info);
                        if (img != null) pred.put("hybridImageUrl", img);
                    }
                } catch (Exception ignore) {}
                pair.put("offspringPrediction", pred);
                out.add(pair);
            }
            return out;
        } catch (Exception e) {
            return java.util.Collections.emptyList();
        }
    }
    
    private String extractJsonFromText(String text) {
        if (text == null) return "{}";
        int start = text.indexOf('{');
        int end = text.lastIndexOf('}');
        if (start >= 0 && end > start) {
            return text.substring(start, end + 1);
        }
        return text.trim();
    }

    public OffspringPrediction predictOffspring(OffspringPredictionRequest request) {
        try {
            Animal mother = animalRepository.findById(request.getMotherId()).orElseThrow();
            Animal father = animalRepository.findById(request.getFatherId()).orElseThrow();
            String mBreedInfo = breedInfoService.fetchBreedSummary(mother.getType(), mother.getBreed());
            String fBreedInfo = breedInfoService.fetchBreedSummary(father.getType(), father.getBreed());

            StringBuilder sb = new StringBuilder();
            sb.append("Species: ").append(request.getSpecies()).append("\n");
            sb.append("Mother Details:\n").append(mother.toString()).append("\nBreed Info: ").append(mBreedInfo).append("\n\n");
            sb.append("Father Details:\n").append(father.toString()).append("\nBreed Info: ").append(fBreedInfo).append("\n\n");

            String schema = "Return a strict JSON object with fields: predictedBreed, predictedScore, expectedSize, expectedWeight, expectedColor, expectedTemperament, predictedWoolYield, predictedMeatScore, inheritableHealthRisks, breedingRecommendation, notes.";
            String guidance = "You are an expert livestock geneticist. Use COMMERCIAL INTERNET SOURCING: search major agriculture/web databases for the average crossbred offspring of the Mother's Breed and the Father's Breed. Reflect parents' stats. Prioritize any provided farmer target traits when estimating (closer to targets is preferred). Return only the JSON object.";
            String prompt = "Predict livestock offspring from parents using expert genetics and web knowledge.\n" + sb + schema + "\n" + guidance;

            String ai = geminiService.generateWithPrompt(prompt);
            String clean = extractJsonFromText(ai);
            return objectMapper.readValue(clean, OffspringPrediction.class);
        } catch (Exception e) {
            OffspringPrediction op = new OffspringPrediction();
            try {
                Animal mother = animalRepository.findById(request.getMotherId()).orElse(null);
                Animal father = animalRepository.findById(request.getFatherId()).orElse(null);
                String left = mother != null ? (mother.getBreed() != null ? mother.getBreed() : mother.getType()) : null;
                String right = father != null ? (father.getBreed() != null ? father.getBreed() : father.getType()) : null;
                op.setPredictedBreed(left != null && right != null ? left + " × " + right : (left != null ? left : right));
                Double mw = mother != null ? mother.getWeight() : null;
                Double fw = father != null ? father.getWeight() : null;
                Double ew = (mw != null && fw != null) ? ((mw + fw) / 2.0) : (mw != null ? mw : fw);
                op.setExpectedWeight(ew);
                String size;
                if (ew == null) size = null; else if (ew > 80.0) size = "Large"; else if (ew >= 50.0) size = "Medium"; else size = "Small";
                op.setExpectedSize(size);
                String color = mother != null && mother.getColor() != null && father != null && father.getColor() != null ? mother.getColor() + "/" + father.getColor() : (mother != null && mother.getColor() != null ? mother.getColor() : father != null ? father.getColor() : null);
                op.setExpectedColor(color);
                String temp = mother != null && mother.getTemperament() != null && father != null && father.getTemperament() != null ? mother.getTemperament() + "-" + father.getTemperament() : (mother != null && mother.getTemperament() != null ? mother.getTemperament() : father != null ? father.getTemperament() : null);
                op.setExpectedTemperament(temp);
                Integer meat = avgI(getIntField(mother, "meatScore"), getIntField(father, "meatScore"));
                op.setPredictedMeatScore(meat);
                String wool = null;
                Integer woolInt = avgI(getIntField(mother, "woolYield"), getIntField(father, "woolYield"));
                if (woolInt != null) wool = String.valueOf(woolInt);
                op.setPredictedWoolYield(wool);
                String risk = mother != null && mother.getHealthStatus() != null ? mother.getHealthStatus().name() : "Unknown";
                op.setInheritableHealthRisks(risk);
                op.setPredictedScore(avgI(mother != null ? mother.getBreedingScore() : null, father != null ? father.getBreedingScore() : null));
                op.setBreedingRecommendation("Use conservative management and monitor offspring; estimate based on parent traits and breed tendencies");
                op.setNotes("Estimated from parent traits and available breed information");
            } catch (Exception ignore) {}
            return op;
        }
    }

    @Transactional
    public DetailedBreedingAnalysisResponse deepAnalyzeSelected(SelectedBreedingBoxRequest request) {
        try {
            DetailedBreedingAnalysisResponse resp = new DetailedBreedingAnalysisResponse();
            resp.setSessionName(request.getSessionName());
            resp.setSpecies(request.getSpecies());

            List<Long> rawIds = request.getSelectedAnimalIds();
            if (rawIds == null || rawIds.isEmpty()) {
                if (resp.getRisks() == null) resp.setRisks(new ArrayList<>());
                resp.getRisks().add("No selectedAnimalIds provided");
                return resp;
            }
            List<Long> idList = rawIds.stream().filter(Objects::nonNull).collect(Collectors.toList());
            if (idList.isEmpty()) {
                if (resp.getRisks() == null) resp.setRisks(new ArrayList<>());
                resp.getRisks().add("All provided selectedAnimalIds are null");
                return resp;
            }

            List<Animal> animals = animalRepository.findAllById(idList);
            System.out.println("DEBUG: Number of Animals Fetched: " + animals.size());

            List<Animal> healthyPool = new ArrayList<>();
            for (Animal a : animals) {
                if (a.getHealthStatus() == null || a.getHealthStatus() != Animal.HealthStatus.POOR) {
                    healthyPool.add(a);
                }
            }

            List<DetailedBreedingAnalysisResponse.PairPlan> plans = new ArrayList<>();
            for (int i = 0; i < healthyPool.size(); i++) {
                for (int j = i + 1; j < healthyPool.size(); j++) {
                    Animal a1 = healthyPool.get(i);
                    Animal a2 = healthyPool.get(j);
                    if (a1.getGender() != null && a2.getGender() != null && !a1.getGender().equals(a2.getGender()) && speciesEqual(a1.getType(), a2.getType())) {
                        int score = calculateCompatibility(a1, a2);
                        DetailedBreedingAnalysisResponse.PairPlan p = new DetailedBreedingAnalysisResponse.PairPlan();
                        p.setAnimal1Id(a1.getId());
                        p.setAnimal2Id(a2.getId());
                        p.setAnimal1Name(a1.getName());
                        p.setAnimal2Name(a2.getName());
                        p.setCompatibilityScore(score);
                        p.setCrossName(a1.getBreed() != null && a2.getBreed() != null && !a1.getBreed().equalsIgnoreCase(a2.getBreed()) ? a1.getBreed() + "×" + a2.getBreed() : a1.getBreed());
                        p.setLikelihood(score >= 85 ? "High" : score >= 65 ? "Medium" : "Low");
                        p.setNarrative("Pairing based on same species and breeding readiness with balanced traits.");
                        java.util.Map<String,Integer> probs = new java.util.HashMap<>();
                        int targetScore = scoreAgainstTargets(a1, a2, request.getTargetTraits());
                        int totalScore = Math.max(0, Math.min(100, score * 2 + targetScore));
                        probs.put("compatibility", score);
                        probs.put("targetMatch", targetScore);
                        probs.put("totalScore", totalScore);
                        p.setProbabilities(probs);
                        plans.add(p);
                    }
                }
            }
            plans.sort((p1, p2) -> {
                Integer t1 = p1.getProbabilities() != null ? p1.getProbabilities().getOrDefault("totalScore", 0) : 0;
                Integer t2 = p2.getProbabilities() != null ? p2.getProbabilities().getOrDefault("totalScore", 0) : 0;
                int cmp = t2.compareTo(t1);
                if (cmp != 0) return cmp;
                Integer c1 = p1.getCompatibilityScore() != null ? p1.getCompatibilityScore() : 0;
                Integer c2 = p2.getCompatibilityScore() != null ? p2.getCompatibilityScore() : 0;
                int ccmp = c2.compareTo(c1);
                if (ccmp != 0) return ccmp;
                long h1 = stableHash(request.getSessionName() + "|" + p1.getAnimal1Name() + "+" + p1.getAnimal2Name() + "|" + String.valueOf(request.getTargetTraits()));
                long h2 = stableHash(request.getSessionName() + "|" + p2.getAnimal1Name() + "+" + p2.getAnimal2Name() + "|" + String.valueOf(request.getTargetTraits()));
                return Long.compare(h2 % 97, h1 % 97);
            });

                if (plans.isEmpty()) {
                System.out.println("DEBUG: No optimal pairs; initiating forced pairing.");
                System.out.println("DEBUG: Healthy pool size=" + healthyPool.size());
                java.util.Map<String, Integer> speciesCounts = new java.util.HashMap<>();
                for (Animal a : healthyPool) {
                    String key = normalizeSpecies(a.getType());
                    speciesCounts.put(key, speciesCounts.getOrDefault(key, 0) + 1);
                }
                String targetSpecies = speciesCounts.entrySet().stream().max(java.util.Map.Entry.comparingByValue()).map(java.util.Map.Entry::getKey).orElse(null);
                List<Animal> speciesPool = new ArrayList<>();
                for (Animal a : healthyPool) {
                    if (speciesEqual(normalizeSpecies(a.getType()), targetSpecies)) speciesPool.add(a);
                }
                Optional<Animal> bestFemale = speciesPool.stream().filter(a -> a.getGender() == Animal.Gender.FEMALE).max(Comparator.comparing(a -> a.getBreedingScore() != null ? a.getBreedingScore() : 0));
                Optional<Animal> bestMale = speciesPool.stream().filter(a -> a.getGender() == Animal.Gender.MALE).max(Comparator.comparing(a -> a.getBreedingScore() != null ? a.getBreedingScore() : 0));
                if (bestFemale.isEmpty() || bestMale.isEmpty()) {
                    bestFemale = healthyPool.stream().filter(a -> a.getGender() == Animal.Gender.FEMALE).max(Comparator.comparing(a -> a.getBreedingScore() != null ? a.getBreedingScore() : 0));
                    bestMale = healthyPool.stream().filter(a -> a.getGender() == Animal.Gender.MALE).max(Comparator.comparing(a -> a.getBreedingScore() != null ? a.getBreedingScore() : 0));
                }
                if (bestFemale.isPresent() && bestMale.isPresent()) {
                    Animal female = bestFemale.get();
                    Animal male = bestMale.get();
                    System.out.println("DEBUG: Forced pair => Female=" + female.getName() + " (" + female.getType() + ", score=" + female.getBreedingScore() + ") Male=" + male.getName() + " (" + male.getType() + ", score=" + male.getBreedingScore() + ")");
                    int score = calculateCompatibility(female, male);
                        DetailedBreedingAnalysisResponse.PairPlan p = new DetailedBreedingAnalysisResponse.PairPlan();
                    p.setAnimal1Id(female.getId());
                    p.setAnimal2Id(male.getId());
                    p.setAnimal1Name(female.getName());
                    p.setAnimal2Name(male.getName());
                        p.setCompatibilityScore(score);
                    p.setCrossName(female.getBreed() != null && male.getBreed() != null && !female.getBreed().equalsIgnoreCase(male.getBreed()) ? female.getBreed() + "×" + male.getBreed() : female.getBreed());
                    p.setLikelihood("FORCED_MATCH_HIGH_RISK");
                    p.setNarrative("Forced recommendation due to lack of optimal matches; review risks and management.");
                        plans.add(p);
                    if (resp.getRisks() == null) resp.setRisks(new ArrayList<>());
                        resp.getRisks().add("Forced pairing applied due to lack of optimal matches; monitor health and genetics risks.");
                } else {
                    System.out.println("DEBUG: Forced pairing failed to find opposite genders in pool.");
                }
            }

            int enrichCount = Math.min(5, plans.size());
            for (int i = 0; i < enrichCount; i++) {
                DetailedBreedingAnalysisResponse.PairPlan p = plans.get(i);
                Animal animal1 = animalRepository.findById(p.getAnimal1Id()).orElse(null);
                Animal animal2 = animalRepository.findById(p.getAnimal2Id()).orElse(null);
                if (animal1 != null && animal2 != null) {
                    Long motherId = animal1.getGender() == Animal.Gender.FEMALE ? animal1.getId() : animal2.getId();
                    Long fatherId = animal1.getGender() == Animal.Gender.MALE ? animal1.getId() : animal2.getId();
                    if (motherId != null && fatherId != null) {
                        OffspringPredictionRequest pr = new OffspringPredictionRequest();
                        pr.setMotherId(motherId);
                        pr.setFatherId(fatherId);
                        pr.setSpecies(request.getSpecies());
                        OffspringPrediction op = predictOffspring(pr);
                        p.setOffspringPrediction(op);
                    }
                }
            }

            resp.setPairPlans(plans);

            if (!plans.isEmpty()) {
                DetailedBreedingAnalysisResponse.PairPlan top = plans.get(0);
                Animal animal1 = animalRepository.findById(top.getAnimal1Id()).orElse(null);
                Animal animal2 = animalRepository.findById(top.getAnimal2Id()).orElse(null);

                if (animal1 != null && animal2 != null) {
                    Long motherId = null;
                    Long fatherId = null;
                    if(animal1.getGender() == Animal.Gender.FEMALE) {
                        motherId = animal1.getId();
                        fatherId = animal2.getId();
                    } else {
                        motherId = animal2.getId();
                        fatherId = animal1.getId();
                    }

                    OffspringPredictionRequest pr = new OffspringPredictionRequest();
                    pr.setMotherId(motherId);
                    pr.setFatherId(fatherId);
                    pr.setSpecies(request.getSpecies());
                    OffspringPrediction op = predictOffspring(pr);
                    top.setOffspringPrediction(op);
                }
            }

            saveSessionFromAnalysis(resp);

            return resp;
        } catch (Exception e) {
            System.err.println("CRITICAL ERROR in deepAnalyzeSelected: An exception was caught.");
            e.printStackTrace();
            DetailedBreedingAnalysisResponse f = new DetailedBreedingAnalysisResponse();
            f.setSessionName(request.getSessionName());
            f.setSpecies(request.getSpecies());
            f.setRisks(List.of("A critical error occurred during analysis: " + e.getMessage()));
            return f;
        }
    }

    private int scoreAgainstTargets(Animal a1, Animal a2, java.util.Map<String, Object> targets) {
        if (targets == null || targets.isEmpty()) return 0;
        int score = 0;

        java.util.function.BiFunction<Number, Number, Integer> closeness = (target, actual) -> {
            if (target == null || actual == null) return 0;
            double diff = Math.abs(target.doubleValue() - actual.doubleValue());
            return Math.max(0, 100 - (int)Math.min(100, Math.round(diff)));
        };

        double weightAvg = avgD(a1.getWeight(), a2.getWeight());
        Integer breedingAvg = avgI(a1.getBreedingScore(), a2.getBreedingScore());
        Integer meatAvg = avgI(getIntField(a1, "meatScore"), getIntField(a2, "meatScore"));
        Integer woolAvg = avgI(getIntField(a1, "woolYield"), getIntField(a2, "woolYield"));
        Integer heightAvg = avgI(getIntField(a1, "heightCm"), getIntField(a2, "heightCm"));
        Integer fertAvg = avgI(getIntField(a1, "fertilityScore"), getIntField(a2, "fertilityScore"));
        Integer eggsAvg = avgI(getIntField(a1, "eggProductionPerWeek"), getIntField(a2, "eggProductionPerWeek"));

        Object tWeight = targets.getOrDefault("weightKg", targets.get("weight"));
        if (tWeight instanceof Number && !Double.isNaN(weightAvg)) score += closeness.apply((Number)tWeight, weightAvg);

        Object tScore = targets.getOrDefault("breedingScore", targets.get("predictedScore"));
        if (tScore instanceof Number && breedingAvg != null) score += closeness.apply((Number)tScore, breedingAvg);

        Object tMeat = targets.get("meatScore");
        if (tMeat instanceof Number && meatAvg != null) score += closeness.apply((Number)tMeat, meatAvg);

        Object tWool = targets.get("woolYield");
        if (tWool instanceof Number && woolAvg != null) score += closeness.apply((Number)tWool, woolAvg);

        Object tHeight = targets.get("heightCm");
        if (tHeight instanceof Number && heightAvg != null) score += closeness.apply((Number)tHeight, heightAvg);

        Object tFert = targets.get("fertilityScore");
        if (tFert instanceof Number && fertAvg != null) score += closeness.apply((Number)tFert, fertAvg);

        Object tEggs = targets.get("eggProductionPerWeek");
        if (tEggs instanceof Number && eggsAvg != null) score += closeness.apply((Number)tEggs, eggsAvg);

        Object tSize = targets.get("size");
        if (tSize instanceof String) {
            score += sizeMatchScore((String)tSize, getStr(a1, "size"), getStr(a2, "size"));
        }

        Object tColor = targets.get("color");
        if (tColor instanceof String) {
            score += textMatchScore((String)tColor, a1.getName(), a2.getName(), getStr(a1, "color"), getStr(a2, "color"));
        }

        Object temperamentTarget = targets.get("temperament");
        if (temperamentTarget instanceof String) {
            String t = ((String) temperamentTarget).trim().toLowerCase();
            String t1 = getStr(a1, "temperament");
            String t2 = getStr(a2, "temperament");
            if (!t.isEmpty() && (t.equals(t1) || t.equals(t2))) score += 40;
            else if (!t.isEmpty() && (t1.contains(t) || t2.contains(t))) score += 20;
        }

        return Math.min(600, score);
    }

    private long stableHash(String s) {
        if (s == null) return 0L;
        long h = 1125899906842597L; 
        for (int i = 0; i < s.length(); i++) h = 31*h + s.charAt(i);
        return h;
    }

    private double avgD(Double a, Double b) {
        int c = 0; double s = 0.0; if (a != null) { s += a; c++; } if (b != null) { s += b; c++; } return c==0 ? Double.NaN : s/c;
    }
    private Integer avgI(Integer a, Integer b) {
        int c = 0; int s = 0; if (a != null) { s += a; c++; } if (b != null) { s += b; c++; } return c==0 ? null : Math.round((float)s/c);
    }
    private Integer getIntField(Animal a, String field) {
        try { var f = Animal.class.getDeclaredField(field); f.setAccessible(true); Object v = f.get(a); return (v instanceof Number) ? ((Number)v).intValue() : null; } catch (Exception e) { return null; }
    }
    private String getStr(Animal a, String field) {
        try { var f = Animal.class.getDeclaredField(field); f.setAccessible(true); Object v = f.get(a); return v != null ? v.toString().trim().toLowerCase() : ""; } catch (Exception e) { return ""; }
    }
    private int sizeMatchScore(String target, String s1, String s2) {
        String t = target.trim().toLowerCase();
        java.util.List<String> sizes = java.util.Arrays.asList("small","medium","large");
        int ti = sizes.indexOf(t);
        int a = sizes.indexOf(s1 != null ? s1.toLowerCase() : "");
        int b = sizes.indexOf(s2 != null ? s2.toLowerCase() : "");
        int ai = a < 0 ? 1 : a; int bi = b < 0 ? 1 : b; int avg = Math.round((ai + bi)/2f);
        if (ti < 0) return 0;
        int diff = Math.abs(ti - avg);
        return Math.max(0, 80 - diff*40);
    }
    private int textMatchScore(String target, String... candidates) {
        String t = target.trim().toLowerCase();
        if (t.isEmpty()) return 0;
        for (String c : candidates) {
            if (c == null) continue;
            String x = c.toLowerCase();
            if (x.equals(t)) return 50;
            if (x.contains(t)) return 25;
        }
        return 0;
    }

    private boolean speciesEqual(String t1, String t2) {
        if (t1 == null || t2 == null) return false;
        return normalizeSpecies(t1).equals(normalizeSpecies(t2));
    }

    private String normalizeSpecies(String t) {
        if (t == null) return "";
        String s = t.trim().toLowerCase();
        if (s.contains("sheep") || s.contains("ewe") || s.contains("ram")) return "sheep";
        if (s.contains("cattle") || s.contains("cow") || s.contains("bull") || s.contains("ox")) return "cattle";
        if (s.contains("goat") || s.contains("buck") || s.contains("doe")) return "goat";
        if (s.contains("pig") || s.contains("boar") || s.contains("sow")) return "pig";
        if (s.contains("horse") || s.contains("mare") || s.contains("stallion")) return "horse";
        if (s.contains("donkey")) return "donkey";
        if (s.contains("chicken")) return "chicken";
        if (s.contains("duck")) return "duck";
        if (s.contains("goose") || s.contains("geese")) return "goose";
        if (s.contains("turkey")) return "turkey";
        if (s.contains("rabbit")) return "rabbit";
        if (s.contains("llama")) return "llama";
        if (s.contains("alpaca")) return "alpaca";
        if (s.contains("bee")) return "bee";
        return s;
    }

    public BreedingBox saveSessionFromAnalysis(DetailedBreedingAnalysisResponse response) {
        try {
            BreedingBox box = new BreedingBox();
            box.setSessionName(response.getSessionName());
            String best = response.getPairPlans() != null && !response.getPairPlans().isEmpty()
                ? response.getPairPlans().stream()
                    .map(p -> (p.getAnimal1Name() + " + " + p.getAnimal2Name()) + (p.getCompatibilityScore() != null ? " (" + p.getCompatibilityScore() + "%)" : ""))
                    .reduce((a,b)->a+"; "+b).orElse("")
                : "";
            box.setBestPairs(best);
            String json = objectMapper.writeValueAsString(response);
            box.setAiRecommendations(json);
            return breedingBoxRepository.save(box);
        } catch (Exception e) {
            BreedingBox b = new BreedingBox();
            b.setSessionName(response.getSessionName());
            return breedingBoxRepository.save(b);
        }
    }

    public BreedingBoxResponse processBreedingBox(BreedingBoxRequest request) {
        BreedingBoxResponse r = new BreedingBoxResponse();
        r.setSessionName(request != null ? request.getSessionName() : null);
        r.setAnimalAnalysis(new java.util.ArrayList<>());
        r.setBreedingPairs(new java.util.ArrayList<>());
        r.setUnsuitableAnimals(new java.util.ArrayList<>());
        r.setOverallDiversityScore(0);
        r.setGeneralRecommendations(null);
        return r;
    }
}