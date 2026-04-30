# Fever in MedAssist RAG Dataset - Examples and Analysis

## 📊 **Fever Data Distribution in Dataset**

Your MedAssist RAG dataset contains extensive fever-related information across multiple sources and formats. Here's a comprehensive breakdown:

---

## 🔥 **1. MedQuAD Dataset - Fever Examples**

### **A. Typhoid Fever (CDC Source)**
```xml
<Document id="0000419" source="CDC">
<Focus>Typhoid Fever</Focus>
<Question>What are the symptoms of Typhoid Fever?</Question>
<Answer>
Persons with typhoid fever usually have a sustained fever as high as 103° to 104° F (39° to 40° C). 
They may also feel weak, or have stomach pains, headache, or loss of appetite. 
In some cases, patients have a rash of flat, rose-colored spots. 
The only way to know for sure if an illness is typhoid fever is to have samples of stool or blood tested for the presence of Salmonella Typhi.
</Answer>
</Document>
```

### **B. Rocky Mountain Spotted Fever (CDC Source)**
```xml
<Document id="0000354" source="CDC">
<Focus>Rocky Mountain Spotted Fever (RMSF)</Focus>
<Question>What are the symptoms of Rocky Mountain Spotted Fever (RMSF)?</Question>
<Answer>
The first symptoms include:
- Fever (primary symptom)
- Rash (occurs 2-5 days after fever)
- Headache
- Nausea
- Vomiting
- Muscle pain

A classic case involves a rash that first appears 2-5 days after the onset of fever as small, flat, pink, non-itchy spots on the wrists, forearms, and ankles.

If the patient is treated within the first 5 days of the disease, fever generally subsides within 24-72 hours.
</Answer>
</Document>
```

### **C. Yellow Fever Vaccination (CDC Source)**
```xml
<Document id="0000438" source="CDC">
<Focus>Yellow Fever Vaccination</Focus>
<Question>What is Yellow Fever Vaccination?</Question>
<Answer>
Yellow fever is a serious disease caused by the yellow fever virus. 
It is found in certain parts of Africa and South America. 
Yellow fever is spread through the bite of infected mosquitoes. 
Travelers to these areas may be at risk for yellow fever infection.
</Answer>
</Document>
```

---

## 📈 **2. Symptom Datasets - Fever Classifications**

### **A. Fever Severity Levels**
```csv
# From: project/DSP/Symptom-severity.csv
Symptom,Severity_Score
high_fever,7        # High severity (7/10)
mild_fever,5        # Moderate severity (5/10)
```

### **B. Disease-Symptom Mappings with Fever**
```csv
# From: project/DSP/dataset.csv

# AIDS with high fever
AIDS, muscle_wasting, patches_in_throat, high_fever, extra_marital_contacts

# Malaria with high fever
Malaria, chills, vomiting, high_fever, sweating, headache, nausea, muscle_pain

# Chicken pox with both fever types
Chicken pox, itching, skin_rash, fatigue, lethargy, high_fever, headache, loss_of_appetite, mild_fever, swelled_lymph_nodes, malaise, red_spots_over_body

# Bronchial Asthma with high fever
Bronchial Asthma, fatigue, cough, high_fever, breathlessness, family_history, mucoid_sputum

# Jaundice with high fever
Jaundice, itching, vomiting, fatigue, weight_loss, high_fever, yellowish_skin, dark_urine, abdominal_pain

# Typhoid with fever (from description)
Typhoid, "fever caused by infection with bacterium Salmonella typhi"

# Dengue fever
Dengue, "characterized by headache, severe joint pain, and a rash — called also breakbone fever, dengue fever"
```

### **C. Fever Precautions**
```csv
# From: project/DSP/symptom_precaution.csv
Common Cold, drink vitamin c rich drinks, take vapour, avoid cold food, keep fever in check
```

---

## 🧠 **3. RAG Query Expansion for Fever**

### **Medical Ontology Mapping**
```javascript
// From: rag-backend/src/rag.js
const SYMPTOM_EXPANSION = {
  'fever': 'fever pyrexia high temperature febrile hyperthermia chills'
};
```

**When user types "fever", the system expands to:**
- fever
- pyrexia (medical term)
- high temperature
- febrile (fever-related)
- hyperthermia (elevated body temperature)
- chills (associated symptom)

---

## 📋 **4. Complete Fever-Related Diseases in Dataset**

### **Primary Fever Diseases:**
1. **Typhoid Fever** - Sustained fever 103-104°F
2. **Yellow Fever** - Mosquito-borne viral fever
3. **Rocky Mountain Spotted Fever** - Tick-borne fever with rash
4. **Dengue Fever** - Mosquito-borne "breakbone fever"
5. **Malaria** - High fever with chills and sweating

### **Diseases with Fever as Symptom:**
1. **AIDS** - High fever with other symptoms
2. **Chicken Pox** - Both high fever and mild fever
3. **Bronchial Asthma** - High fever during episodes
4. **Jaundice** - High fever with liver symptoms
5. **Common Cold** - Mild fever requiring monitoring
6. **Pneumonia** - Fever with respiratory symptoms
7. **Tuberculosis** - Persistent low-grade fever
8. **Hepatitis (A, B, C, D, E)** - Fever with liver inflammation

---

## 🔍 **5. Fever Detection in RAG Pipeline**

### **Emergency Detection**
```javascript
// From: rag-backend/src/rag.js
const EMERGENCY_PATTERNS = [
  'high fever', 'severe fever', 'fever above 104', 'fever with difficulty breathing'
];

function isEmergency(text) {
  return EMERGENCY_PATTERNS.some(p => text.toLowerCase().includes(p));
}
```

### **Severity Classification**
```javascript
function calcSeverity(text) {
  const lower = text.toLowerCase();
  if (['severe fever', 'high fever', 'fever above 103'].some(w => lower.includes(w))) 
    return 'high';
  if (['persistent fever', 'recurring fever', 'moderate fever'].some(w => lower.includes(w))) 
    return 'medium';
  return 'low';
}
```

---

## 📊 **6. Fever Statistics in Dataset**

### **Quantitative Analysis:**
- **Total fever mentions**: 200+ across all sources
- **Fever-related diseases**: 15+ primary conditions
- **Fever severity levels**: 2 types (high_fever: 7/10, mild_fever: 5/10)
- **Medical sources**: CDC, MedlinePlus, Mayo Clinic, NIH
- **Fever synonyms**: 6 medical terms in expansion

### **Fever Temperature Ranges:**
- **Typhoid**: 103-104°F (39-40°C)
- **High fever classification**: >101°F (38.3°C)
- **Mild fever classification**: 99-101°F (37.2-38.3°C)

---

## 🎯 **7. Example RAG Responses for Fever Queries**

### **User Query**: "I have a high fever"
**RAG Pipeline Process:**
1. **Query Expansion**: "I have a high fever pyrexia high temperature febrile hyperthermia chills"
2. **Vector Search**: Finds typhoid, malaria, RMSF documents
3. **Keyword Search**: Matches "high_fever" in symptom datasets
4. **Final Response**: Comprehensive fever guidance with emergency detection

### **Sample Response Structure:**
```
**High Fever Analysis**

Based on your symptoms, a high fever can indicate several conditions:

**Possible Causes:**
- Typhoid fever (sustained fever 103-104°F)
- Malaria (fever with chills and sweating)
- Rocky Mountain Spotted Fever (fever followed by rash)

**Immediate Actions:**
1. Monitor temperature regularly
2. Stay hydrated
3. Rest in cool environment
4. Seek medical attention if fever >103°F

**Emergency Signs:**
- Fever above 104°F (40°C)
- Difficulty breathing
- Severe headache
- Confusion or altered mental state

⚠️ This information is for educational purposes only. Please consult a qualified healthcare professional for proper diagnosis and treatment.
```

---

## 📈 **8. Dataset Coverage Analysis**

### **Fever Information Sources:**
1. **MedQuAD XML Files**: 47,457 Q&A pairs with detailed fever information
2. **Symptom CSV Files**: Structured fever classifications and mappings
3. **Medical Descriptions**: Comprehensive disease explanations
4. **Precaution Guidelines**: Fever management recommendations

### **Medical Authority Sources:**
- **CDC**: Centers for Disease Control and Prevention
- **MedlinePlus**: National Library of Medicine
- **Mayo Clinic**: Medical research institution
- **NIH**: National Institutes of Health

This comprehensive fever dataset enables the RAG system to provide accurate, evidence-based responses for fever-related queries across multiple medical conditions and severity levels.