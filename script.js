// Elements
const analyzeBtn = document.getElementById("analyzeBtn");
const continentSelect = document.getElementById("continent");
const resumeUpload = document.getElementById("resumeUpload");
const feedbackBox = document.getElementById("feedbackBox");

// Load continent rules
async function loadRules() {
    try {
        const response = await fetch("data/continentRules.json");

        if (!response.ok) {
            throw new Error("Unable to load continent rules.");
        }

        return await response.json();

    } catch (error) {
        console.error(error);

        feedbackBox.innerHTML = `
            <h2>Feedback</h2>
            <p>Unable to load recommendation data.</p>
        `;

        return null;
    }
}

// Display recommendations
function displayFeedback(continent, rules) {

    const region = rules[continent];

    let html = `
        <h2>${continent} Resume Recommendations</h2>

        <p><strong>Preferred Length:</strong>
        ${region.preferredLength}</p>

        <p><strong>Photo:</strong>
        ${region.photo}</p>

        <h3>Focus Areas</h3>
        <ul>
    `;

    region.focusAreas.forEach(item => {
        html += `<li>${item}</li>`;
    });

    html += `
        </ul>

        <h3>Avoid</h3>
        <ul>
    `;

    if (region.avoid) {
        region.avoid.forEach(item => {
            html += `<li>${item}</li>`;
        });
    }

    html += `
        </ul>

        <h3>Tips</h3>
        <ul>
    `;

    region.tips.forEach(item => {
        html += `<li>${item}</li>`;
    });

    html += `
        </ul>
    `;

    feedbackBox.innerHTML = html;
}

// Analyze button click
analyzeBtn.addEventListener("click", async () => {

    const continent = continentSelect.value;
    const file = resumeUpload.files[0];

    if (!file) {
        alert("Please upload a resume.");
        return;
    }

    if (!continent) {
        alert("Please select a target region.");
        return;
    }

    feedbackBox.innerHTML = `
        <h2>Analyzing...</h2>
        <p>Generating recommendations for ${continent}.</p>
    `;

    const rules = await loadRules();

    if (!rules) {
        return;
    }

    displayFeedback(continent, rules);

});