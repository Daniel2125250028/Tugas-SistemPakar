document.addEventListener('DOMContentLoaded', () => {
    let symptomsData = [];
    let diseasesData = [];
    let selectedSymptoms = new Set();

    const symptomGrid = document.getElementById('symptomGrid');
    const diagnoseBtn = document.getElementById('diagnoseBtn');
    const resultsDiv = document.getElementById('results');
    const mainDiseaseEl = document.getElementById('mainDisease');
    const mainProbEl = document.getElementById('mainProb');
    const possibilityList = document.getElementById('possibilityList');

    // Load data
    fetch('data.json')
        .then(response => response.json())
        .then(data => {
            symptomsData = data.symptoms;
            diseasesData = data.diseases;
            renderSymptoms();
        })
        .catch(err => {
            console.error('Error loading data:', err);
            symptomGrid.innerHTML = '<div style="color: #ef4444; text-align: center;">Gagal memuat data gejala. Silakan coba lagi.</div>';
        });

    function renderSymptoms() {
        symptomGrid.innerHTML = '';
        symptomsData.forEach(symptom => {
            const item = document.createElement('div');
            item.className = 'symptom-item';
            item.innerHTML = `
                <input type="checkbox" id="s${symptom.id}" value="${symptom.id}">
                <span>${symptom.name}</span>
            `;
            
            item.addEventListener('click', (e) => {
                const checkbox = item.querySelector('input');
                if (e.target !== checkbox) {
                    checkbox.checked = !checkbox.checked;
                }
                updateSelection(symptom.id, checkbox.checked);
                item.classList.toggle('selected', checkbox.checked);
            });

            symptomGrid.appendChild(item);
        });
    }

    function updateSelection(id, isSelected) {
        if (isSelected) {
            selectedSymptoms.add(id);
        } else {
            selectedSymptoms.delete(id);
        }
        diagnoseBtn.disabled = selectedSymptoms.size === 0;
    }

    diagnoseBtn.addEventListener('click', () => {
        const matches = calculateMatches();
        displayResults(matches);
        resultsDiv.style.display = 'block';
        resultsDiv.scrollIntoView({ behavior: 'smooth' });
    });

    function calculateMatches() {
        const userSymptomIds = Array.from(selectedSymptoms);
        
        return diseasesData.map(disease => {
            const matchedSymptoms = disease.symptoms.filter(sid => userSymptomIds.includes(sid));
            const probability = (matchedSymptoms.length / disease.symptoms.length) * 100;
            
            return {
                ...disease,
                matchCount: matchedSymptoms.length,
                probability: Math.round(probability)
            };
        }).sort((a, b) => b.probability - a.probability || b.matchCount - a.matchCount);
    }

    function displayResults(matches) {
        const primary = matches[0];
        
        if (!primary || primary.probability === 0) {
            mainDiseaseEl.textContent = "Tidak ditemukan diagnosis yang cocok";
            mainProbEl.textContent = "0%";
            possibilityList.innerHTML = '<p style="color: var(--text-muted);">Silakan pilih gejala yang lebih spesifik.</p>';
            return;
        }

        mainDiseaseEl.textContent = primary.name;
        mainProbEl.textContent = `${primary.probability}%`;

        const others = matches.slice(1, 6).filter(m => m.probability > 0);
        possibilityList.innerHTML = '';
        
        if (others.length === 0) {
            possibilityList.innerHTML = '<p style="color: var(--text-muted);">Tidak ada kemungkinan lain yang signifikan.</p>';
        } else {
            others.forEach(match => {
                const div = document.createElement('div');
                div.className = 'possibility-item';
                div.innerHTML = `
                    <span>${match.name}</span>
                    <span style="font-weight: 600;">${match.probability}%</span>
                `;
                possibilityList.appendChild(div);
            });
        }
    }
});
