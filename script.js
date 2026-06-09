async function loadRules() {

    const response =
        await fetch('./data/continentRules.json');

    return await response.json();
}

function analyzeResume(
    resumeText,
    continent,
    rules
){

    let feedback = [];

    const continentData =
        rules[continent];

    if(
      continentData.photo === false &&
      resumeText.includes("Photo")
    ){

        feedback.push(
          "Remove profile photo."
        );

    }

    if(
      !resumeText.includes("Skills")
    ){

        feedback.push(
          "Add a Skills section."
        );

    }

    return feedback;
}