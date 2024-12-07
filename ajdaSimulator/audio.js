let grillAudio = document.getElementById("audioGrill");
let itemAudio = document.getElementById("audioItem");
let pointAudio = document.getElementById("audioPoint");
let restaurantAudio = document.getElementById("audioRestaurant");
let walkingAudio = document.getElementById("audioWalking");
let musicAudio = document.getElementById("audioMusic");

function initAudio() {
    grillAudio.volume = 0.2;
    itemAudio.volume = 0.2;
    pointAudio.volume = 1;
    restaurantAudio.volume = 0.8;
    musicAudio.volume = 0.08;
    walkingAudio.volume = 1;

    restaurantAudio.loop = true;
    restaurantAudio.play();

    walkingAudio.loop = true;
    walkingAudio.muted = true;
    walkingAudio.play();

    musicAudio.loop = true;
}

initAudio();

export function playMusic() {
    musicAudio.play();
}

export function playGrillSound() {
    grillAudio.play();
}

export async function playItemSound() {
    itemAudio.play();
}

export function playPointSound() {
    pointAudio.play();
}

export function playWalkingSound() {
    walkingAudio.muted = false;
}

export function stopWalkingSound() {
    walkingAudio.muted = true
}