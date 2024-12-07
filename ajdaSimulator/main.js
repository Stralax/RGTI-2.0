import { GUI } from 'dat';

import { ResizeSystem } from 'engine/systems/ResizeSystem.js';
import { UpdateSystem } from 'engine/systems/UpdateSystem.js';

import { GLTFLoader } from 'engine/loaders/GLTFLoader.js';
import { UnlitRenderer } from 'engine/renderers/UnlitRenderer.js';
import { FirstPersonController } from 'engine/controllers/FirstPersonController.js';

import { ObjectDetection } from './ObjectDetection.js';

import { Camera, Model } from 'engine/core.js';
import { Light } from 'engine/core/Light.js';
import { Node } from 'engine/core/Node.js';

import { Transform } from '../engine/core.js';

import {
    calculateAxisAlignedBoundingBox,
    mergeAxisAlignedBoundingBoxes,
} from 'engine/core/MeshUtils.js';

import { Physics } from './Physics.js';

// import { Inventory } from './inventory.js'
// import { Item } from './inventory.js'

//  // Example usage
//  const inventory = new Inventory(1);
  
//  const sword = new Item("Sword", 1);
//  const potion = new Item("Health Potion", 3);
 
//  inventory.addItem(sword);
//  inventory.addItem(potion);
 
//  inventory.displayInventory();
 
//  inventory.removeItem("Sword");
//  inventory.displayInventory();


const canvas = document.querySelector('canvas');
const renderer = new UnlitRenderer(canvas);
await renderer.initialize();

const loader = new GLTFLoader();
//await loader.load('scene/scene.gltf');
//await loader.load('scene/Test_3Dmodel.gltf');
await loader.load('scene/RGTI_game.gltf');

const scene = loader.loadScene(loader.defaultScene);

export let objectDetection = new ObjectDetection(scene);

const camera = loader.loadNode('Camera');

const burgerAnimation = loader.loadNode("Patty Animation");
burgerAnimation.getComponentOfType(Transform).translation = [0, 0, 0];


camera.addComponent(new FirstPersonController(camera, canvas, burgerAnimation));
camera.isDynamic = true;
camera.aabb = {
    min: [-0.2, -0.2, -0.2],
    max: [0.2, 0.2, 0.2],
};


const lamp = loader.loadNode("Bin01");
console.log(lamp.getComponentOfType(Transform).translation);

//console.log(camera.getComponentOfType(Transform).translation);
//let pos = camera.getComponentOfType(Transform).translation;

camera.getComponentOfType(Camera).fovy = 1;

const light = new Node();
light.addComponent(new Transform({
    translation: [90, 10 , 1.7],
}));
light.addComponent(new Light({
    intensity: 1,
    attenuation: [0.001, 0, 10], // [0.0001, 0.0001, 0.01],
    color: [248, 222, 126],
}));
scene.addChild(light);


// const light = new Node();
// light.addComponent(new Light({
//     color: [255, 255, 255],
//     direction: [2.5, -6.5, 0],
//     intensity: 10000,
// }));
// scene.addChild(light);

//console.log(light);

// loader.loadNode('Box.000').isStatic = true;
// loader.loadNode('Box.001').isStatic = true;
// loader.loadNode('Box.002').isStatic = true;
// loader.loadNode('Box.003').isStatic = true;
// loader.loadNode('Box.004').isStatic = true;
// loader.loadNode('Box.005').isStatic = true;
// loader.loadNode('Wall.000').isStatic = true;
// loader.loadNode('Wall.001').isStatic = true;
// loader.loadNode('Wall.002').isStatic = true;
// c

loader.loadNode('Fridge03').isStatic = true;
loader.loadNode('Fridge02').isStatic = true;
loader.loadNode('Fridge01').isStatic = true;
loader.loadNode('Hamburger Table').isStatic = true;
loader.loadNode('Wet floor back').isStatic = true;
loader.loadNode('Working area 1').isStatic = true;
loader.loadNode('Working area 2').isStatic = true;
loader.loadNode('Frying').isStatic = true;
loader.loadNode('Bbq').isStatic = true;
loader.loadNode('Stove').isStatic = true;
loader.loadNode('Sink01').isStatic = true;
loader.loadNode('Sink02').isStatic = true;
loader.loadNode('Shelves').isStatic = true;
loader.loadNode('Drinks Fridge').isStatic = true;
loader.loadNode('Base').isStatic = true;
loader.loadNode('Shelves pantry').isStatic = true;
loader.loadNode('Table 1').isStatic = true;
loader.loadNode('Table 2').isStatic = true;
loader.loadNode('Bin01').isStatic = true;
loader.loadNode('Bin02').isStatic = true;
loader.loadNode('Bin03').isStatic = true;

loader.loadNode('Kitchen Wall 2.1').isStatic = true;
loader.loadNode('Kitchen Wall 2.3').isStatic = true;
loader.loadNode('Kitchen Wall 4.1').isStatic = true;
loader.loadNode('Kitchen Wall 4.3').isStatic = true;
loader.loadNode('Kitchen Wall 3').isStatic = true;
loader.loadNode('Pantry Wall 1').isStatic = true;
loader.loadNode('Pantry Wall 2').isStatic = true;
loader.loadNode('Pantry Wall 3').isStatic = true;
loader.loadNode('Trash Wall 1').isStatic = true;
loader.loadNode('Trash Wall 2').isStatic = true;
loader.loadNode('Trash Wall 3').isStatic = true;
loader.loadNode('Restaurant Wall 1').isStatic = true;
loader.loadNode('Restaurant Wall 2').isStatic = true;
loader.loadNode('Restaurant Wall 3').isStatic = true;


const physics = new Physics(scene);
scene.traverse(node => {
    const model = node.getComponentOfType(Model);
    if (!model) {
        return;
    }
    

    const boxes = model.primitives.map(primitive => calculateAxisAlignedBoundingBox(primitive.mesh));
    //console.log(boxes);
    if(boxes.length==1){
        node.aabb = mergeAxisAlignedBoundingBoxes(boxes);
    }
});

function update(time, dt) {
    scene.traverse(node => {
        for (const component of node.components) {
            component.update?.(time, dt);
        }
    });

    physics.update(time, dt);
}

function render() {
    renderer.render(scene, camera);
}

function resize({ displaySize: { width, height }}) {
    camera.getComponentOfType(Camera).aspect = width / height;
}

new ResizeSystem({ canvas, resize }).start();
new UpdateSystem({ update, render }).start();