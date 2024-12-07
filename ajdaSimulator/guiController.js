import { playMusic } from "./audio.js";

const item_logos = {
    "Buns": "images/breadLogo.png",
    "Raw burger meat": "images/rawmeatLogo.png",
    "Burger meat": "images/cookedmeatLogo.png",
    "Vegetables for a burger": "images/lettuceLogo.png",
    "Pomfrit": "images/friesLogo.png",
    "Coca-Cola": "images/colaLogo.png",
    "Burger": "images/burgerLogo.png",
    "Empty": "images/transparent.png",
};

const orders = {
    "Burger": "images/burgerRecept.png",
    "Coca-Cola": "images/CocaColaRecept.png",
    "Pomfrit": "images/friesRecept.png",
    "none": "images/transparent.png",
}

let invItem1 = document.getElementById("item1");
let invItem2 = document.getElementById("item2");
let invItem3 = document.getElementById("item3");

let invItems = [invItem1, invItem2, invItem3];
for (let i = 0; i < invItems.length; i++) {
    invItems[i].src = item_logos["Empty"];
}

let scoreGUI = document.getElementById("score");
score.innerText = "Score: 0";

let bbqTimerGUI = document.getElementById("bbqTimer");
bbqTimerGUI.innerText = "0s";

const orderImage = document.getElementById("orderImage");
export async function updateOrderGUI(order) {
    orderImage.src = orders[order];
}

export async function updateInventoryGUI(inventory) {
    for (let i = 0; i < invItems.length; i++) {
        if (inventory.items[i] != undefined) {
            invItems[i].src = item_logos[inventory.items[i].name];
        } else {
            invItems[i].src = "images/transparent.png";
        }
    }
}

export async function updateScoreGUI(score) {
    scoreGUI.innerText = "Score: " + score;
}

export async function updateBBQTimerGUI(timer) {
    if(timer == 0) {
        bbqTimerGUI.innerText = "0s";
        bbqTimerGUI.style.color = "white";
    }else{
        bbqTimerGUI.style.color = "red";
    }
    bbqTimerGUI.innerText = timer + "s";
}

const loadingScreen = document.getElementById("loadingScreen");
setTimeout(() => {
    loadingScreen.style.display = "none";
    playMusic();
}, 5000);
