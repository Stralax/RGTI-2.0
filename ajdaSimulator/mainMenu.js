let tutorial = false;

let mainWindow = document.getElementById("mainWindow");
let settingsWindow = document.getElementById("settingsWindow");

let tutorialButton = document.getElementById("tutorialButton");
let startButton = document.getElementById("startButton");

startButton.addEventListener("click", function() {
    window.location.href = "../ajdaSimulator/index.html";
});

tutorialButton.addEventListener("click", function() {
    tutorial = !tutorial;
    if (tutorial) {
        tutorialButton.innerText = "TUTORIAL: ON";
    } else {
        tutorialButton.innerText = "TUTORIAL: OFF";
    }
});