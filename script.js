

// ==========================================
// INTERNATIONAL RESUME ANALYZER
// Three-step navigation and regional feedback
// ==========================================


// Get HTML elements

const step1 = document.getElementById("step1");
const step2 = document.getElementById("step2");
const step3 = document.getElementById("step3");

const resumeUpload = document.getElementById("resumeUpload");
const fileName = document.getElementById("fileName");

const continueBtn = document.getElementById("continueBtn");
const backBtn = document.getElementById("backBtn");
const analyzeBtn = document.getElementById("analyzeBtn");
const resultsBackBtn = document.getElementById("resultsBackBtn");
const restartBtn = document.getElementById("restartBtn");

const continentSelect = document.getElementById("continent");

const uploadError = document.getElementById("uploadError");
const continentError = document.getElementById("continentError");

const feedbackBox = document.getElementById("feedbackBox");

const progressBar = document.getElementById("progressBar");

const stepLabel1 = document.getElementById("stepLabel1");
const stepLabel2 = document.getElementById("stepLabel2");
const stepLabel3 = document.getElementById("stepLabel3");


// Store the selected resume

let selectedResume = null;


// ==========================================
// STEP NAVIGATION
// ==========================================

function showStep(stepNumber) {

    // Hide all steps

    step1.classList.add("hidden");
    step2.classList.add("hidden");
    step3.classList.add("hidden");

    // Display the requested step

    if (stepNumber === 1) {
        step1.classList.remove("hidden");
    }

    if (stepNumber === 2) {
        step2.classList.remove("hidden");
    }

    if (stepNumber === 3) {
        step3.classList.remove("hidden");
    }

    // Update progress bar

    progressBar.style.width = `${stepNumber * 33.33}%`;

    // Update progress labels

    stepLabel1.classList.toggle("active-label", stepNumber >= 1);
    stepLabel2.classList.toggle("active-label", stepNumber >= 2);
    stepLabel3.classList.toggle("active-label", stepNumber >= 3);

    // Move the page back to the top

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


// ==========================================
// STEP 1: RESUME UPLOAD
// ==========================================

resumeUpload.addEventListener("change", function () {

    uploadError.textContent = "";

    const file = resumeUpload.files[0];

    if (!file) {
        selectedResume = null;
        fileName.textContent = "No file selected";
        return;
    }

    const allowedTypes = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ];

    const fileExtension = file.name
        .substring(file.name.lastIndexOf("."))
        .toLowerCase();

    if (
        !allowedTypes.includes(file.type) ||
        ![".pdf", ".docx"].includes(fileExtension)
    ) {

        selectedResume = null;
        resumeUpload.value = "";

        fileName.textContent = "No file selected";

        uploadError.textContent =
            "Please select a valid PDF or DOCX resume.";

        return;
    }

    // Store the selected file in JavaScript

    selectedResume = file;

    // Display the selected filename

    fileName.textContent = "Selected file: " + file.name;

    console.log("Resume selected successfully:", selectedResume);

});


// ==========================================
// CONTINUE BUTTON: STEP 1 TO STEP 2
// ==========================================

continueBtn.addEventListener("click", function () {

    console.log("Continue button clicked");

    uploadError.textContent = "";

    // Check that a resume has been selected

    if (!selectedResume) {

        uploadError.textContent =
            "Please select your resume before continuing.";

        return;
    }

    console.log("Resume found:", selectedResume.name);

    // Move to Step 2

    showStep(2);

});


// ==========================================
// STEP 2: SELECT CONTINENT
// ==========================================

// Return to Step 1

backBtn.addEventListener("click", function () {

    continentError.textContent = "";

    showStep(1);
});


// ==========================================
// STEP 3: ANALYZE RESUME
// ==========================================

analyzeBtn.addEventListener("click", async function () {

    continentError.textContent = "";

    const selectedContinent = continentSelect.value;

    if (!selectedContinent) {

        continentError.textContent =
            "Please select a continent before continuing.";

        return;
    }

    if (!selectedResume) {

        showStep(1);

        uploadError.textContent =
            "Please upload your resume first.";

        return;
    }

    // Show loading state

    analyzeBtn.disabled = true;
    analyzeBtn.textContent = "Analyzing...";

    try {

        // Load the continent rules

        const response = await fetch("./data/continentRules.json");

        if (!response.ok) {
            throw new Error(
                "Could not load continentRules.json. Check that the file is inside the data folder."
            );
        }

        const continentRules = await response.json();

        // Find the selected continent's rules

        const rules = continentRules[selectedContinent];

        if (!rules) {
            throw new Error(
                `No guidelines were found for ${selectedContinent}. Check that this continent exists in continentRules.json.`
            );
        }

        // Display the results

        document.getElementById("selectedRegion").textContent =
            selectedContinent;

        document.getElementById("analyzedFile").textContent =
            `Resume uploaded: ${selectedResume.name}`;

        displayFeedback(rules);

        showStep(3);

    } catch (error) {

        continentError.textContent = error.message;

        console.error("Analysis error:", error);

    } finally {

        // Restore the button

        analyzeBtn.disabled = false;
        analyzeBtn.textContent = "Analyze Resume";
    }

});


// ==========================================
// DISPLAY REGIONAL RECOMMENDATIONS
// ==========================================

function displayFeedback(rules) {

    // Clear previous results

    feedbackBox.replaceChildren();

    // Descriptions for the expected JSON fields

    const fieldLabels = {
        preferredLength: "Recommended Resume Length",
        photo: "Resume Photo",
        objectiveStatement: "Objective or Summary",
        skillsSection: "Skills Section",
        educationPlacement: "Education Placement",
        focusAreas: "Recommended Focus Areas",
        avoid: "Things to Avoid",
        tips: "Additional Recommendations"
    };

    // Display a message if no rules are available

    if (
        !rules ||
        typeof rules !== "object" ||
        Object.keys(rules).length === 0
    ) {

        const message = document.createElement("p");

        message.textContent =
            "No recommendations are currently available for this region.";

        feedbackBox.appendChild(message);

        return;
    }

    // Create a section for each rule

    Object.entries(rules).forEach(([key, value]) => {

        const section = document.createElement("div");
        section.className = "feedback-section";

        const heading = document.createElement("h3");

        heading.textContent =
            fieldLabels[key] ||
            formatLabel(key);

        section.appendChild(heading);

        // Display arrays as bullet lists

        if (Array.isArray(value)) {

            const list = document.createElement("ul");

            value.forEach(item => {

                const listItem = document.createElement("li");

                listItem.textContent = String(item);

                list.appendChild(listItem);
            });

            section.appendChild(list);
        }

        // Display true/false values as readable text

        else if (typeof value === "boolean") {

            const paragraph = document.createElement("p");

            paragraph.textContent = value ? "Yes" : "No";

            section.appendChild(paragraph);
        }

        // Display other values as text

        else if (
            value !== null &&
            typeof value === "object"
        ) {

            const paragraph = document.createElement("p");

            paragraph.textContent = JSON.stringify(value);

            section.appendChild(paragraph);
        }

        else {

            const paragraph = document.createElement("p");

            paragraph.textContent = String(value);

            section.appendChild(paragraph);
        }

        feedbackBox.appendChild(section);

    });

}


// Convert JSON field names into readable headings

function formatLabel(text) {

    return text
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, character => character.toUpperCase());
}


// ==========================================
// RESULTS NAVIGATION
// ==========================================

// Return from results to continent selection

resultsBackBtn.addEventListener("click", function () {

    showStep(2);
});


// ==========================================
// START OVER
// ==========================================

restartBtn.addEventListener("click", function () {

    // Clear the selected resume

    selectedResume = null;
    resumeUpload.value = "";

    fileName.textContent = "No file selected";

    // Clear the continent selection

    continentSelect.value = "";

    // Clear errors and old results

    uploadError.textContent = "";
    continentError.textContent = "";

    feedbackBox.replaceChildren();

    // Return to the first step

    showStep(1);
});


// ==========================================
// INITIAL PAGE SETUP
// ==========================================

showStep(1);