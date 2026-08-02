// ============================================================
// Elements
// ============================================================
const analyzeBtn = document.getElementById("analyzeBtn");
const continentSelect = document.getElementById("continent");
const resumeUpload = document.getElementById("resumeUpload");
const feedbackBox = document.getElementById("feedbackBox");

// Cache rules so we don't re-fetch on every click
let cachedRules = null;

// ============================================================
// Utility: escape text before injecting into innerHTML
// (protects against odd filenames / resume text containing
// characters like < or & from breaking the layout)
// ============================================================
function escapeHTML(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
}

// ============================================================
// Load continent rules (fetched once, then cached)
// ============================================================
async function loadRules() {
    if (cachedRules) return cachedRules;

    try {
        const response = await fetch("data/continentRules.json");

        if (!response.ok) {
            throw new Error(`Unable to load continent rules (status ${response.status}).`);
        }

        cachedRules = await response.json();
        return cachedRules;

    } catch (error) {
        console.error(error);
        feedbackBox.innerHTML = `
            <h2>Feedback</h2>
            <p>Unable to load recommendation data. Check that continentRules.json is reachable from this page.</p>
        `;
        return null;
    }
}

// ============================================================
// Extract text from the uploaded resume.
// Only .txt is read natively in the browser. For .pdf/.docx you'd
// need a library (pdf.js for PDFs, mammoth.js for .docx) — flagged
// clearly to the user instead of silently failing.
// ============================================================
function extractResumeText(file) {
    return new Promise((resolve) => {
        const isPlainText = file.type === "text/plain" || file.name.toLowerCase().endsWith(".txt");

        if (!isPlainText) {
            resolve(null); // signal: can't read this format yet
            return;
        }

        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => resolve(null);
        reader.readAsText(file);
    });
}

// ============================================================
// Analyze extracted resume text against a region's rules.
// Returns an array of { label, status } findings.
// status: "good" | "warn" | "info"
// ============================================================
function analyzeResumeText(text, region) {
    const findings = [];
    const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
    const lowerText = text.toLowerCase();

    findings.push({
        label: `Word count: ${wordCount} (guideline: ${region.preferredLength})`,
        status: "info"
    });

    if (Array.isArray(region.focusAreas)) {
        const missing = region.focusAreas.filter(
            area => !lowerText.includes(area.toLowerCase())
        );
        if (missing.length) {
            findings.push({
                label: `No mention found of: ${missing.join(", ")}`,
                status: "warn"
            });
        } else {
            findings.push({
                label: "All suggested focus areas appear to be covered.",
                status: "good"
            });
        }
    }

    if (Array.isArray(region.avoid)) {
        const present = region.avoid.filter(
            term => lowerText.includes(term.toLowerCase())
        );
        if (present.length) {
            findings.push({
                label: `Found terms/items you may want to avoid: ${present.join(", ")}`,
                status: "warn"
            });
        }
    }

    return findings;
}

// ============================================================
// Display recommendations (+ analysis findings if we have them)
// ============================================================
function displayFeedback(continent, rules, findings) {
    const region = rules[continent];

    if (!region) {
        feedbackBox.innerHTML = `
            <h2>Feedback</h2>
            <p>No rules found for "${escapeHTML(continent)}".</p>
        `;
        return;
    }

    let html = `<h2>${escapeHTML(continent)} Resume Recommendations</h2>`;

    if (findings && findings.length) {
        html += `<h3>Your Resume</h3><ul>`;
        findings.forEach(f => {
            html += `<li class="finding-${f.status}">${escapeHTML(f.label)}</li>`;
        });
        html += `</ul>`;
    } else {
        html += `
            <p><em>Detailed content analysis is only available for plain text (.txt) uploads right now.
            Below are the general guidelines for this region.</em></p>
        `;
    }

    html += `
        <p><strong>Preferred Length:</strong> ${escapeHTML(region.preferredLength)}</p>
        <p><strong>Photo:</strong> ${escapeHTML(region.photo)}</p>
        <h3>Focus Areas</h3>
        <ul>${(region.focusAreas || []).map(i => `<li>${escapeHTML(i)}</li>`).join("")}</ul>
        <h3>Avoid</h3>
        <ul>${(region.avoid || []).map(i => `<li>${escapeHTML(i)}</li>`).join("")}</ul>
        <h3>Tips</h3>
        <ul>${(region.tips || []).map(i => `<li>${escapeHTML(i)}</li>`).join("")}</ul>
    `;

    feedbackBox.innerHTML = html;
}

// ============================================================
// Analyze button click
// ============================================================
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

    analyzeBtn.disabled = true;
    feedbackBox.innerHTML = `
        <h2>Analyzing...</h2>
        <p>Generating recommendations for ${escapeHTML(continent)}.</p>
    `;

    try {
        const rules = await loadRules();
        if (!rules) return;

        const region = rules[continent];
        if (!region) {
            feedbackBox.innerHTML = `<h2>Feedback</h2><p>No rules configured for "${escapeHTML(continent)}" yet.</p>`;
            return;
        }

        const text = await extractResumeText(file);
        const findings = text ? analyzeResumeText(text, region) : null;

        displayFeedback(continent, rules, findings);

    } catch (error) {
        console.error(error);
        feedbackBox.innerHTML = `<h2>Feedback</h2><p>Something went wrong while analyzing your resume.</p>`;
    } finally {
        analyzeBtn.disabled = false;
    }
});