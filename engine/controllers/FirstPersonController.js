import { quat, vec3, mat4 } from 'glm';


import { Transform } from '../core/Transform.js';
import { Inventory, Item } from '../../ajdaSimulator/Inventory.js';
import { objectDetection } from '../../ajdaSimulator/main.js';
import { updateBBQTimerGUI, updateScoreGUI, updateOrderGUI } from '../../ajdaSimulator/guiController.js';
import { playGrillSound, playPointSound, playWalkingSound, stopWalkingSound, playItemSound} from '../../ajdaSimulator/audio.js';

import { getGlobalViewMatrix } from '../core/SceneUtils.js';



const inventory = new Inventory(3);
const Buns = new Item("Buns", 1);
const RawBurgerMeat = new Item("Raw burger meat", 1);
const BurgerMeat = new Item("Burger meat", 1);
const VegetablesForBurger = new Item("Vegetables for a burger", 1);
const Pomfrit = new Item("Pomfrit", 1);
const CocaCola = new Item("Coca-Cola", 1);

const refrigerator = ["Fridge01", "Fridge02", "Fridge03"];

const trash = ["Bin01", "Bin02", "Bin03"];

const waiter = ["Bulletin_Board", "SM_StickyNote_02.001", "SM_StickyNote_03.001", "SM_StickyNote_04.001", "SM_StickyNote_05.001", "SM_StickyNote_05.002", "Cube_supa matro\ufffd\ufffd.009_0", "Cashier", "imagetostl_mesh0", "imagetostl_mesh1", "Dome_Metal_0", "Cash register", "Cash Model", "Kitchen Wall 3"];

const bread = ["Bread01.000", "Bread01.001", "Bread01.002", "Bread01.003", "Bread01.004", "Bread01.005", "Bread01.006", "Bread01.007",
    "Bread01.008", "Bread01.009", "Bread01.010", "Bread01.011", "Bread01.012"/*, "Bread plate 1", "Bread plate 2", "Bread plate 3", "Bread plate 4"*/];

const freezer = ["Ventilator", "Patty.000", "Patty plate 3", "Patty.001", "Patty.002", "Patty.003", "Patty.004", "Patty.005", "Patty.006", "Patty.007",
    "Patty.008", "Patty.009", "Patty.010", "Patty.011", "Patty plate 1", "Patty plate 2", "Patty.012", "Patty.013",
    "Patty.014", "Patty.015", "Patty.016", "Patty.017"];

const Bbq = ["BbqHandles", "BbqDoors", "Bbq05", "Bbq04", "Bbq03", "Bbq02", "Bbq01", "Bbq"];

const workingTable = ["Hamburger Table"];

const fryer = ["Frying04", "Frying03", "Frying02", "Frying01", "Frying", "FryingDoors", "FryingHandles", "FryingBox01", "FryingBox02"];

const refrigeratorDrinks = ["Drinks Fridge", "Fridge outside", "Door02", "Door01"];


const breadsFirstCordinates = new Map();
breadsFirstCordinates.set("Bread01.000", [113.66226959228516, 3.6724634170532227, 17.954681396484375]);
breadsFirstCordinates.set("Bread01.001", [113.66226959228516, 3.6724634170532227, 16.642383575439453]);
breadsFirstCordinates.set("Bread01.002", [112.9825668334961, 3.6724634170532227, 17.212209701538086]);
breadsFirstCordinates.set("Bread01.003", [113.66226959228516, 4.373245716094971, 17.266653060913086]);
breadsFirstCordinates.set("Bread01.004", [112.9825668334961, 3.6724634170532227, 20.406230926513672]);
breadsFirstCordinates.set("Bread01.005", [113.66226959228516, 3.6724634170532227, 21.14870262145996]);
breadsFirstCordinates.set("Bread01.006", [113.22730255126953, 4.373245716094971, 24.579147338867188]);
breadsFirstCordinates.set("Bread01.007", [112.9825668334961, 3.6724634170532227, 24.887178421020508]);
breadsFirstCordinates.set("Bread01.008", [113.66226959228516, 3.6724634170532227, 24.317352294921875]);
breadsFirstCordinates.set("Bread01.009", [113.66226959228516, 3.6724634170532227, 25.629650115966797]);
breadsFirstCordinates.set("Bread01.010", [113.7589340209961, 4.373245716094971, 25.376588821411133]);
breadsFirstCordinates.set("Bread01.011", [113.66226959228516, 3.6724634170532227, 27.63867950439453]);
breadsFirstCordinates.set("Bread01.012", [112.9825668334961, 3.6724634170532227, 28.745243072509766]);


const smokeFirtstCordinates = new Map();
smokeFirtstCordinates.set("Dim.001", [93.47676849365234, 4.437288284301758, -3.6727304458618164]);
smokeFirtstCordinates.set("Dim.002", [94.03723907470703, 4.985434532165527, -3.6727304458618164]);
smokeFirtstCordinates.set("Dim.003", [93.3464126586914, 5.647188663482666, -3.6727304458618164]);
smokeFirtstCordinates.set("Dim.004", [94.11396026611328, 6.384382724761963, -3.6727304458618164]);
smokeFirtstCordinates.set("Dim.005", [93.2929916381836, 6.775891304016113, -3.6727304458618164]);
smokeFirtstCordinates.set("Dim.006", [94.31440734863281, 7.323601245880127, -4.881188869476318]);
smokeFirtstCordinates.set("Dim.007", [93.47676849365234, 7.922301292419434, -3.6727304458618164]);
smokeFirtstCordinates.set("Dim.008", [94.29032135009766, 8.299554824829102, -3.6727304458618164]);
smokeFirtstCordinates.set("Dim.009", [94.11396026611328, 8.847214698791504, -3.6727304458618164]);
smokeFirtstCordinates.set("Dim.010",[93.62873077392578, 9.17710018157959, -3.6727304458618164]);


const RecipeBurger = [Buns, BurgerMeat, VegetablesForBurger];

const Burger = new Item("Burger", 1);

export class FirstPersonController {

    constructor(node, domElement, burgerAnimation, smoke, {
        pitch = 0,
        yaw = 0,
        velocity = [0, 0, 0],
        acceleration = 50,
        maxSpeed = 8,
        decay = 0.99999,
        pointerSensitivity = 0.002,
        jumpVelocity = 30,
        gravity = -15,
        is_E_Pressed = false,

        //intrections
        intWithRefrigerator = false,
        intWithTrashCan = false,
        intWithWaiter = false,
        intWithStorageBread = false,
        intWithFreezer = false,
        intWithBarbecue = false,    // f-ja combine 1 prema 1 sa zamenom Raw burger meat -> Burger meat za casovni interval (Provera prisustva mesa na rostilju BOOL)
        intWithWorkingTable = false, // f-ja combine 
        intWithFryer = false,
        intWithRefrigeratorDrinks = false,
        //intWithDish = false,
        //intWithDishwasher = false,

        RawBurgerMeat = false,
        Grilling = false,

    } = {}) {
        this.node = node;
        this.domElement = domElement;
        this.burgerAnimation = burgerAnimation;
        this.smoke = this.inicializeSmoke(smoke);

        this.keys = {};

        this.pitch = pitch;
        this.yaw = yaw;

        this.velocity = velocity;
        this.acceleration = acceleration;
        this.maxSpeed = maxSpeed;
        this.decay = decay;
        this.pointerSensitivity = pointerSensitivity;

        this.jumpVelocity = jumpVelocity;
        this.gravity = gravity;
        this.isJumping = false;
        this.is_E_Pressed = is_E_Pressed;

        this.intWithRefrigerator = intWithRefrigerator;
        this.intWithTrashCan = intWithTrashCan;
        this.intWithWaiter = intWithWaiter;
        this.intWithStorageBread = intWithStorageBread;
        this.intWithFreezer = intWithFreezer;
        this.intWithBarbecue = intWithBarbecue;
        this.intWithWorkingTable = intWithWorkingTable;
        this.intWithFryer = intWithFryer;
        this.intWithRefrigeratorDrinks = intWithRefrigeratorDrinks;
        //this.intWithDish = intWithDish;
        //this.intWithDishwasher = intWithDishwasher;

        this.RawBurgerMeat = RawBurgerMeat;
        this.Grilling = Grilling;
        this.activeTimer = 0;
        this.NumberOfOrders = 0;
        this.Meal;// Pocetna porudzbina
        this.Points = 0;
        this.breadAnimation = [];
        this.breadAnimationActivated = false;
        this.AnimationTimer = 0;
        this.breadFirstCordinates;
        this.inventoryIsFULL = false;

        this.BBQAnimationActivatedEnter = false;
        this.BBQAnimationActivatedExit = false;

        this.timeSmoke = 0.01;
        this.smokeTimer = 0;


        this.initHandlers();
    }

    initHandlers() {
        this.pointermoveHandler = this.pointermoveHandler.bind(this);
        this.keydownHandler = this.keydownHandler.bind(this);
        this.keyupHandler = this.keyupHandler.bind(this);

        const element = this.domElement;
        const doc = element.ownerDocument;

        doc.addEventListener('keydown', this.keydownHandler);
        doc.addEventListener('keyup', this.keyupHandler);

        element.addEventListener('click', e => element.requestPointerLock());
        doc.addEventListener('pointerlockchange', e => {
            if (doc.pointerLockElement === element) {
                doc.addEventListener('pointermove', this.pointermoveHandler);
            } else {
                doc.removeEventListener('pointermove', this.pointermoveHandler);
            }
        });
    }

    update(t, dt) {
        if (this.activeTimer > 0) {
            this.activeTimer -= dt; // Reduce timer by delta time
            //console.log(Math.floor(this.activeTimer));
            if(this.activeTimer<14){
                this.smoke = this.smokeAnimation(this.smoke);
                this.timeSmoke = 0.007;
            }
            if(this.activeTimer<10){
                this.timeSmoke = 0.01;
            }
            if(this.activeTimer<5){
                this.timeSmoke = 0.007;
            }
            if (this.activeTimer <= 0) {
                this.activeTimer = 0;  // Clamp timer
                this.WaitingForTheMeat = false; // Turn off the boolean
                //console.log("Deactivated.");
                //console.log(Math.floor(this.activeTimer));
                //this.smoothSmoke(this.smoke);
                this.timeSmoke = 0.01;
                this.smokeTimer = 5;
            }

            updateBBQTimerGUI(Math.floor(this.activeTimer));
        }

        if (this.smokeTimer > 0) {
            this.smokeTimer -= dt;
            this.smoothSmoke(this.smoke);
            if (this.smokeTimer <= 0) {
                this.inicializeSmoke(this.smoke);
            }
        }


        if (this.AnimationTimer > 0) {
            this.AnimationTimer -= dt;

            if(this.breadAnimationActivated){
                let objectPosition = this.breadAnimation[this.breadAnimation.length-1].getComponentOfType(Transform).translation;
                const viewMatrix = getGlobalViewMatrix(this.node);

                let length = Math.sqrt(viewMatrix[2] ** 2 + viewMatrix[6] ** 2 + viewMatrix[10] ** 2);
                let cameraForward = [viewMatrix[2]/length, viewMatrix[6]/length, viewMatrix[10]/length];
                let forwardNormalized = cameraForward;
                let moveFactor = 0.05; // Velikost premika
                let newPosition = [
                    objectPosition[0] + forwardNormalized[0] * moveFactor,
                    objectPosition[1] + forwardNormalized[1] * moveFactor/2,
                    objectPosition[2] + forwardNormalized[2] * moveFactor,
                ];
                this.breadAnimation[this.breadAnimation.length-1].getComponentOfType(Transform).translation = newPosition;
            }

            if(this.BBQAnimationActivatedEnter){
                let objectPosition = this.burgerAnimation.getComponentOfType(Transform).translation;
                if(objectPosition[0] == 0 && objectPosition[1] == 0 && objectPosition[2] == 0){
                    objectPosition = this.node.getComponentOfType(Transform).translation;
                }
                const directionToGrill = [0, -4.5, -7.54];
                let length = Math.sqrt(directionToGrill[0] ** 2 + directionToGrill[1] ** 2 + directionToGrill[2] ** 2);
                let forwardNormalized = [directionToGrill[0]/length, directionToGrill[1]/length, directionToGrill[2]/length];
                let moveFactor = 0.022; // Velikost premika
                let newPosition = [
                    objectPosition[0] + forwardNormalized[0] * moveFactor,
                    objectPosition[1] + forwardNormalized[1] * moveFactor,
                    objectPosition[2] + forwardNormalized[2] * moveFactor,
                ];
                this.burgerAnimation.getComponentOfType(Transform).translation = newPosition;
            }

            if(this.BBQAnimationActivatedExit){
                let objectPosition = this.burgerAnimation.getComponentOfType(Transform).translation;
                const viewMatrix = getGlobalViewMatrix(this.node);
                let length = Math.sqrt(viewMatrix[2] ** 2 + viewMatrix[6] ** 2 + viewMatrix[10] ** 2);
                let cameraForward = [viewMatrix[2]/length, viewMatrix[6]/length, viewMatrix[10]/length];
                let forwardNormalized = cameraForward;
                let moveFactor = 0.05;
                let newPosition = [
                    objectPosition[0] + forwardNormalized[0] * moveFactor,
                    objectPosition[1] + forwardNormalized[1] * moveFactor/2,
                    objectPosition[2] + forwardNormalized[2] * moveFactor,
                ];
                this.burgerAnimation.getComponentOfType(Transform).translation = newPosition;
            }

            if (this.AnimationTimer <= 0) {
                this.AnimationTimer = 0;

                if(this.breadAnimationActivated){
                    this.breadAnimationActivated = false;
                    this.breadAnimation[this.breadAnimation.length-1].getComponentOfType(Transform).translation = [0,0,0]; //this.breadFirstCordinates;
                }      
                if(this.BBQAnimationActivatedEnter){
                    this.BBQAnimationActivatedEnter = false;
                    this.burgerAnimation.getComponentOfType(Transform).translation = [93.70272064208984, 4.5, -4.679910659790039];
                }
                if(this.BBQAnimationActivatedExit){
                    this.BBQAnimationActivatedExit = false;
                    this.burgerAnimation.getComponentOfType(Transform).translation = [0, 0, 0];
                }      
            }
        }


        // Calculate forward and right vectors.
        const cos = Math.cos(this.yaw);
        const sin = Math.sin(this.yaw);
        const forward = [-sin, 0, -cos];
        const right = [cos, 0, -sin];

        // Map user input to the acceleration vector.
        const acc = vec3.create();
        if (this.keys['KeyW']) {
            vec3.add(acc, acc, forward);
            this.walking(true);
        }
        if (this.keys['KeyS']) {
            vec3.sub(acc, acc, forward);
            this.walking(true);
        }
        if (this.keys['KeyD']) {
            vec3.add(acc, acc, right);
            this.walking(true);
        }
        if (this.keys['KeyA']) {
            vec3.sub(acc, acc, right);
            this.walking(true);
        }

        // Apply speed boost if Shift is pressed
        const speedMultiplier = this.keys['ShiftLeft'] || this.keys['ShiftRight'] ? 2 : 1;

        // Update velocity based on acceleration.
        vec3.scaleAndAdd(this.velocity, this.velocity, acc, dt * this.acceleration * speedMultiplier);

        // If there is no user input, apply decay.
        if (!this.keys['KeyW'] &&
            !this.keys['KeyS'] &&
            !this.keys['KeyD'] &&
            !this.keys['KeyA']) {
            const decay = Math.exp(dt * Math.log(1 - this.decay));
            vec3.scale(this.velocity, this.velocity, decay);
            this.walking(false);
        }


        // Apply gravity if jumping
        if (this.isJumping) {
            this.velocity[1] += this.gravity * dt;
            this.walking(false);
        }


        // Limit speed to prevent accelerating to infinity and beyond.
        const speed = vec3.length(this.velocity);
        if (speed > this.maxSpeed * speedMultiplier) {
            vec3.scale(this.velocity, this.velocity, this.maxSpeed / speed);
        }

        const transform = this.node.getComponentOfType(Transform);
        if (transform) {
            // Update translation based on velocity.
            vec3.scaleAndAdd(transform.translation, transform.translation, this.velocity, dt);

            // Check if the player has landed (assuming y=0 is the ground level)
            if (transform.translation[1] <= 6.5) {
                transform.translation[1] = 6.5; // Reset to ground level
                this.isJumping = false;       // Reset jump state
                this.velocity[1] = 0;         // Reset vertical velocity
            }

            // Update rotation based on the Euler angles.
            const rotation = quat.create();
            quat.rotateY(rotation, rotation, this.yaw);
            quat.rotateX(rotation, rotation, this.pitch);
            transform.rotation = rotation;
        }

        // Raycast to detect objects in front of the player
        const cameraPosition = transform.translation; // Use player's current position
        const cameraForward = forward; // Use forward vector for direction
        const rayDirection = vec3.normalize(vec3.create(), cameraForward);

        //Detect the object in front
        let detectedObject = objectDetection.getObjectInView(cameraPosition, rayDirection);

        this.intWithRefrigerator = false;
        this.intWithTrashCan = false;
        this.intWithWaiter = false;
        this.intWithStorageBread = false;
        this.intWithFreezer = false;
        this.intWithBarbecue = false;
        this.intWithWorkingTable = false;
        this.intWithFryer = false;
        this.intWithRefrigeratorDrinks = false;

        this.inventoryIsFULL = inventory.items.length==3 ? true : false; 


        if (detectedObject && refrigerator.includes(detectedObject.name)) {  // Frizider uzmi povrce
            this.intWithRefrigerator = true;
        }

        if (detectedObject && trash.includes(detectedObject.name)) {  // Izbaci zadnje dodat predmet u inventory
            this.intWithTrashCan = true;
        }

        if (detectedObject && waiter.includes(detectedObject.name)) {  // Interakcija sa konobarom uzima porudzbinu
            this.intWithWaiter = true;
        }

        if (!this.breadAnimationActivated && detectedObject && bread.includes(detectedObject.name) && !this.inventoryIsFULL) {  // Uzima hleba (zemicke) iz ostave
            if(!this.breadAnimation.includes(detectedObject))
                this.breadAnimation.push(detectedObject);
            this.intWithStorageBread = true;
        }

        if (detectedObject && freezer.includes(detectedObject.name)) {  // Uzima sveze meso
            this.intWithFreezer = true;
        }

        if (detectedObject && Bbq.includes(detectedObject.name)) {  // Interakcija sa rostiljem
            this.intWithBarbecue = true;
        }

        if (detectedObject && workingTable.includes(detectedObject.name)) {  // Pripravi obrok
            this.intWithWorkingTable = true;
        }

        if (detectedObject && fryer.includes(detectedObject.name)) {  // Pokupi pomfrit iz friteze
            this.intWithFryer = true;
        }

        if (detectedObject && refrigeratorDrinks.includes(detectedObject.name)) {  // Pokupi CocaColu iz friteze
            this.intWithRefrigeratorDrinks = true;
        }

    }

    pointermoveHandler(e) {
        const dx = e.movementX;
        const dy = e.movementY;

        this.pitch -= dy * this.pointerSensitivity;
        this.yaw -= dx * this.pointerSensitivity;

        const twopi = Math.PI * 2;
        const halfpi = Math.PI / 2;

        this.pitch = Math.min(Math.max(this.pitch, -halfpi), halfpi);
        this.yaw = ((this.yaw % twopi) + twopi) % twopi;
    }

    keydownHandler(e) {
        this.keys[e.code] = true;

        // Initiate jump if Space is pressed and player is not already jumping
        if (e.code === 'Space' && !this.isJumping) {
            this.isJumping = true;
            this.velocity[1] = this.jumpVelocity; // Set upward velocity for jump
        }

        if (e.code === 'KeyE' && !this.is_E_Pressed && this.intWithRefrigerator) {
            this.is_E_Pressed = true;
            inventory.addItem(VegetablesForBurger);
            playItemSound();
            inventory.displayInventory();
            this.intWithRefrigerator = false;
        }


        if (e.code === 'KeyE' && !this.is_E_Pressed && this.intWithTrashCan) {
            this.is_E_Pressed = true;
            inventory.removeLastItem();
            playItemSound();
            inventory.displayInventory();
            this.intWithTrashCan = false;
        }

        if (e.code === 'KeyE' && !this.is_E_Pressed && this.intWithWaiter) {
            this.is_E_Pressed = true;

            if (this.NumberOfOrders % 2 == 0) {
                // funkcija za dodeljivanje koja porudzbina se trazi


                console.log(RecipeBurger);
                this.Meal = this.GetReceipt(); //Burger.name;
                this.NumberOfOrders++;
                updateOrderGUI(this.Meal);
            }
            else {
                if (inventory.isInInventory(Burger) && this.Meal === Burger.name) {
                    inventory.removeItem(Burger.name);
                    console.log("Svaka cast");
                    this.NumberOfOrders++;
                    this.Points += 25;
                    updateScoreGUI(this.Points);
                    updateOrderGUI("none");
                    playPointSound();
                }
                else if (inventory.isInInventory(Pomfrit) && this.Meal === Pomfrit.name) {
                    inventory.removeItem(Pomfrit.name);
                    console.log("Svaka cast");
                    this.NumberOfOrders++;
                    this.Points += 15;
                    updateScoreGUI(this.Points);
                    updateOrderGUI("none");
                    playPointSound();
                }
                else if (inventory.isInInventory(CocaCola) && this.Meal === CocaCola.name) {
                    inventory.removeItem(CocaCola.name);
                    console.log("Svaka cast");
                    this.NumberOfOrders++;
                    this.Points += 5;
                    updateScoreGUI(this.Points);
                    updateOrderGUI("none");
                    playPointSound();
                }
            }

            this.intWithWaiter = false;
        }

        if (e.code === 'KeyE' && !this.is_E_Pressed && this.intWithStorageBread) {
            this.is_E_Pressed = true;
            inventory.addItem(Buns);
            playItemSound();
            inventory.displayInventory();

            //console.log(this.breadAnimation);
            this.breadAnimationActivated = true;
            this.AnimationTimer = 1;

            this.intWithStorageBread = false;
        }

        if (e.code === 'KeyE' && !this.is_E_Pressed && this.intWithFreezer) {
            this.is_E_Pressed = true;
            inventory.addItem(RawBurgerMeat);
            playItemSound();
            inventory.displayInventory();
            this.intWithFreezer = false;
        }

        if (e.code === 'KeyE' && !this.is_E_Pressed && this.intWithBarbecue) {
            this.is_E_Pressed = true;
            if (inventory.isInInventory(RawBurgerMeat) && !this.Grilling) {
                inventory.removeItem(RawBurgerMeat.name);
                playItemSound();
                this.WaitingForTheMeat = true;
                this.Grilling = true; //prisustvo mesa na rostilju
                inventory.displayInventory();
                this.activateForDuration(16);

                // ANIMACIJA ZA STAVLJANJE MESA NA ROSTILJ
                this.BBQAnimationActivatedEnter = true;
                this.AnimationTimer = 1.1;


                for(var i=0; i<this.breadAnimation.length; i++){
                    this.breadAnimation[i].getComponentOfType(Transform).translation = breadsFirstCordinates.get(this.breadAnimation[i].name);
                }
                this.breadAnimation = [];

                //console.log(this.burgerAnimation);

                //[93.70272064208984, 3.0088210105895996, -4.679910659790039]
                
                //this.burgerAnimation.getComponentOfType(Transform).translation = [93.70272064208984, 4.5, -4.679910659790039];

            }

            if (!this.WaitingForTheMeat && this.Grilling) {
                inventory.addItem(BurgerMeat);
                inventory.displayInventory();
                this.Grilling = false;
                this.WaitingForTheMeat = false;

                //ANIMACIJA ZA DIZANJE MESA SA ROSTILJA
                this.BBQAnimationActivatedExit = true;
                this.AnimationTimer = 1;
            }

            this.intWithBarbecue = false;
        }

        if (e.code === 'KeyE' && !this.is_E_Pressed && this.intWithWorkingTable) {
            this.is_E_Pressed = true;
            if (inventory.items.length != 0 && inventory.areItemsInInventory(RecipeBurger)) {        //Prvo proveravas komplikovanije iteme za Craft
                inventory.removeItem(BurgerMeat.name);
                inventory.removeItem(VegetablesForBurger.name);
                inventory.removeItem(Buns.name);
                inventory.addItem(Burger);
                playItemSound();
                inventory.displayInventory();
            }
            this.intWithWorkingTable = false;
        }

        if (e.code === 'KeyE' && !this.is_E_Pressed && this.intWithFryer) {
            this.is_E_Pressed = true;
            inventory.addItem(Pomfrit);
            playItemSound();
            inventory.displayInventory();
            this.intWithFryer = false;
        }

        if (e.code === 'KeyE' && !this.is_E_Pressed && this.intWithRefrigeratorDrinks) {
            this.is_E_Pressed = true;
            inventory.addItem(CocaCola);
            playItemSound();
            inventory.displayInventory();
            this.intWithRefrigeratorDrinks = false;
        }

    }

    keyupHandler(e) {
        this.keys[e.code] = false;

        if (e.code === 'KeyE') {
            this.is_E_Pressed = false;

            this.intWithRefrigerator = false;
            this.intWithTrashCan = false;
            this.intWithWaiter = false;
            this.intWithStorageBread = false;
            this.intWithFreezer = false;
            this.intWithBarbecue = false;
            this.intWithWorkingTable = false;
            this.intWithFryer = false;
            this.intWithRefrigeratorDrinks = false;
        }
    }

    activateForDuration(duration = 10) {
        this.WaitingForTheMeat = true;
        this.activeTimer = duration; // Set the timer for 10 seconds
        //console.log("Activated for 10 seconds.");
        updateBBQTimerGUI(this.activeTimer);
        playGrillSound();
    }

    walking(isWalking){
        if(isWalking){
            playWalkingSound();
        }else{
            stopWalkingSound();
        }
    }

    GetReceipt(){
        const choose = [Burger.name, Pomfrit.name, CocaCola.name];
        const random = Math.random();
        let rnd = 0;
        if (random < 0.33) {
            rnd = 0; // 50% verjetnost
        } else if (random < 0.66) {
            rnd = 1; // 25% verjetnost
        } else {
            rnd = 2; // 25% verjetnost
        }
        return choose[rnd];
    }

    inicializeSmoke(smoke1){

        for(var i=0; i<smoke1.length; i++){
            //console.log(smoke1[i].name);
            smoke1[i].getComponentOfType(Transform).translation = smokeFirtstCordinates.get(smoke1[i].name);
        }

        for(let i=0; i<smoke1.length; i++){
            let a = smoke1[i].getComponentOfType(Transform).translation[0];
            let b = smoke1[i].getComponentOfType(Transform).translation[1];
            let c = smoke1[i].getComponentOfType(Transform).translation[2]-1.5;

            smoke1[i].getComponentOfType(Transform).translation = [a, b, c]; 
            if(i%2==1 && i!=1){
                smoke1[i].getComponentOfType(Transform).translation = [a, b+0.5, c];
                //console.log(smoke1[i].getComponentOfType(Transform).translation); 
            }
        }

        this.timeSmoke = 0.02;
        for(let i=0; i<smoke1.length; i++){
            let a = smoke1[i].getComponentOfType(Transform).translation[0];
            let b = smoke1[i].getComponentOfType(Transform).translation[1]-6.5;
            let c = smoke1[i].getComponentOfType(Transform).translation[2];

            smoke1[i].getComponentOfType(Transform).translation = [a, b, c]; 
        }

        return smoke1;
    }

    smokeAnimation(smoke1){
        for(let i=0; i<smoke1.length; i++){
            let a = smoke1[i].getComponentOfType(Transform).translation[0];
            let b = smoke1[i].getComponentOfType(Transform).translation[1] + this.timeSmoke;
            let c = smoke1[i].getComponentOfType(Transform).translation[2];
            if(b>=10){
                b=3.5;
            }
            smoke1[i].getComponentOfType(Transform).translation = [a, b, c]; 
        }

        return smoke1;
    }

    smoothSmoke(smoke1){
        for(let i=0; i<smoke1.length; i++){
            let a = smoke1[i].getComponentOfType(Transform).translation[0];
            let b = smoke1[i].getComponentOfType(Transform).translation[1];
            let c = smoke1[i].getComponentOfType(Transform).translation[2];
            if(b>=8.5){
                b=1.5;
                smoke1[i].getComponentOfType(Transform).translation = [a, b, c];
            }
            if(b>3.5){
                smoke1[i].getComponentOfType(Transform).translation = [a, b + this.timeSmoke, c];     
            }
        }
        return smoke1;
    }

}
