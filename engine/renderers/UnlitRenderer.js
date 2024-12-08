import { mat4, vec3 } from 'glm';

import * as WebGPU from '../WebGPU.js';

import { Camera } from '../core.js';

import { Texture } from '../core/Texture.js';
import { Sampler } from '../core/Sampler.js';
import { Material } from '../core/Material.js';

import { Transform } from '../core/Transform.js';

import {
    getLocalModelMatrix,
    getGlobalModelMatrix,
    getGlobalViewMatrix,
    getProjectionMatrix,
    getModels,
} from '../core/SceneUtils.js';

import { BaseRenderer } from './BaseRenderer.js';
import { Light } from '../core/Light.js';

const vertexBufferLayout = {
    arrayStride: 32,
    attributes: [
        {
            name: 'position',
            shaderLocation: 0,
            offset: 0,
            format: 'float32x3',
        },
        {
            name: 'texcoords',
            shaderLocation: 1,
            offset: 12,
            format: 'float32x2',
        },
        {
            name: 'normal',
            shaderLocation: 2,
            offset: 20,
            format: 'float32x3',
        },
    ],
};


// const light = new Node();
// light.addComponent(new Transform({
//     translation: [90, 10 , 1.7],
// }));
// light.addComponent(new Light({
//     intensity: 1,
//     attenuation: [0.0001, 0.0001, 0.01],
//     color: [248, 222, 126],
// }));
// scene.addChild(light);

const lights = [ //90, 10, 1.7
    { position: [255, 215, 0], color: [102.30924987792969, 10.754304885864258, 1.8542829751968384], attenuation: [0.0001, 0, 2000], intensity: 1.5},
    { position: [255, 0, 0], color: [128.32310485839844, 10.754304885864258, 1.8542829751968384], attenuation: [0.0001, 0, 3000], intensity: 1.5},
    { position: [255, 215, 200], color: [104.18867492675781, 10.754304885864258, 22.8257999420166], attenuation: [0.0001, 0, 200], intensity: 3},
    { position: [255, 215, 0], color: [81.78211975097656, 10, -16.284360885620117], attenuation: [0.0001, 0, 3000], intensity: 1.5},
    { position: [255, 215, 0]/*[110, 12 , 1.7]*/, color: [73.31584167480469, 10.754304885864258, 1.8542829751968384], attenuation: [0.0001, 0, 3000], intensity: 1.5},
    //{ position: [255, 255, 255]/*[110, 12 , 1.7]*/, color: [93, 5, -1.7], attenuation: [0.0001, 0, 4000], intensity: 1.5},
];

export class UnlitRenderer extends BaseRenderer {

    static defaultTexture = null;
    static smokePipeline;
    static smokeUniformBindGroup;
    static particleBindGroup;
    static particleData;
    static smokeUniformBuffer;
    static particleBuffer;
    static particleCount;
    static smokeTextureBindGroup;
    static SmokeTexture = null;
    static intermediateTexture;
    static swapchainFormat;

    constructor(canvas) {
        super(canvas);
        this.initializeDefaultTexture();
    }

    async initializeDefaultSmokeTexture() {
        const defaultImage = new Image();
        defaultImage.src = '../../ajdaSimulator/scene/Floor.png';
    
        // Ensure texture is loaded before using it
        defaultImage.onload = () => {
            const texture = this.device.createTexture({
                size: [defaultImage.width, defaultImage.height, 1],
                format: 'bgra8unorm',
                usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
            });
    
            this.device.queue.copyExternalImageToTexture(
                { source: defaultImage },
                { texture: texture },
                [defaultImage.width, defaultImage.height]
            );
    
            this.SmokeTexture = texture.createView(); // Create GPUTextureView
        };
    }

    initializeDefaultTexture() {
        const defaultImage = new Image();
        defaultImage.src = "../../ajdaSimulator/scene/"+"Floor" + ".png";
    

        // Ensure texture is loaded before using it
        defaultImage.onload = () => {
            this.defaultTexture = new Texture({
                image: defaultImage,
                sampler: new Sampler({}),
                isSRGB: true,
            });
        };
    }

    async initialize() {
        await super.initialize();

        this.swapchainFormat = navigator.gpu.getPreferredCanvasFormat();

        const code = await fetch(new URL('UnlitRenderer.wgsl', import.meta.url))
            .then(response => response.text());
        const module = this.device.createShaderModule({ code });

        //const codePerFragment = await fetch('phongPerFragment.wgsl').then(response => response.text());
        //const modulePerFragment = this.device.createShaderModule({ code: codePerFragment });

        this.pipeline = await this.device.createRenderPipelineAsync({
            layout: 'auto',
            vertex: {
                module,
                buffers: [ vertexBufferLayout ],
            },
            fragment: {
                module,
                targets: [{ format: this.format }],
            },
            depthStencil: {
                format: 'depth24plus',
                depthWriteEnabled: true,
                depthCompare: 'less',
            },
        });

      // Load and compile the smoke shader
        const smokeCode = await fetch('../engine/renderers/SmokeRender.wgsl').then(response => response.text());
        const moduleSmoke = this.device.createShaderModule({ code: smokeCode });

        // Define the bind group layout for uniforms (e.g., transformation matrix)
        const uniformBindGroupLayout = this.device.createBindGroupLayout({
            entries: [
                {
                    binding: 0,
                    visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
                    buffer: { type: "uniform" },
                },
            ],
        });

        // Define the bind group layout for particle data
        const particleBindGroupLayout = this.device.createBindGroupLayout({
            entries: [
                {
                    binding: 0,
                    visibility: GPUShaderStage.VERTEX,
                    buffer: { type: "read-only-storage" }, // Particle buffer
                },
            ],
        });

        // Create the render pipeline, passing in both bind group layouts
        // Create the render pipeline after loading the texture and sampler
        this.smokePipeline = await this.device.createRenderPipelineAsync({
            layout: this.device.createPipelineLayout({
                bindGroupLayouts: [
                    uniformBindGroupLayout,       // Layout for uniform data
                    particleBindGroupLayout,      // Layout for particle data
                    this.device.createBindGroupLayout({ // Layout for texture data
                        entries: [
                            {
                                binding: 0,
                                visibility: GPUShaderStage.FRAGMENT,
                                texture: { sampleType: "float" },
                            },
                            {
                                binding: 1,
                                visibility: GPUShaderStage.FRAGMENT,
                                sampler: { type: "filtering" },
                            },
                        ],
                    }),
                    this.device.createBindGroupLayout({ // Layout for texture data
                        entries: [
                            {
                                binding: 0,
                                visibility: GPUShaderStage.FRAGMENT,
                                texture: { sampleType: "float" },
                            },
                            {
                                binding: 1,
                                visibility: GPUShaderStage.FRAGMENT,
                                sampler: { type: "filtering" },
                            },
                        ],
                    }),
                ],
            }),
            vertex: {
                module: moduleSmoke,
                entryPoint: "vertex_main",
            },
            fragment: {
                module: moduleSmoke,
                entryPoint: "fragment_main",
                targets: [{
                    format: this.format,
                    blend: {
                        color: { srcFactor: "src-alpha", dstFactor: "one-minus-src-alpha", operation: 'add' },
                        alpha: { srcFactor: "one", dstFactor: "one-minus-src-alpha", operation: 'add'},
                    },
                }],
            },
            depthStencil: {
                format: 'depth24plus',
                depthWriteEnabled: false,
                depthCompare: 'always'//'less-equal',
            },
            primitive: {
                topology: "triangle-list",
            },
        });

        

        // Create the uniform buffer (e.g., for view/projection matrices)
        this.smokeUniformBuffer = this.device.createBuffer({
            size: 64, // Ensure that this matches your uniform data size
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        this.smokeUniformBindGroup = this.device.createBindGroup({
            layout: this.smokePipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: this.smokeUniformBuffer } },
            ],
        });

        // Create the particle buffer to hold particle attributes
        this.particleCount = 1000; // Adjust the particle count
        const particleStride = 32; // Each particle: position(3) + velocity(3) + lifetime(1)
        this.particleBuffer = this.device.createBuffer({
            size: this.particleCount * particleStride, // Ensure this matches your particle data size
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST, // Storage usage flag
        });

        this.particleBindGroup = this.device.createBindGroup({
            layout: this.smokePipeline.getBindGroupLayout(1),
            entries: [
                { binding: 0, resource: { buffer: this.particleBuffer } },
            ],
        });

        
        await this.initializeDefaultSmokeTexture();

        // Update particles
        this.particleData = new Float32Array(this.particleCount * 8);
        const smokeOrigin =  [93.70272064208984, 4.5, -4.679910659790039];//camera.getComponentOfType(Transform).translation; //[0, 0, 0];
        // Initialize particle data
        for (let i = 0; i < this.particleCount; i++) {
            const baseIndex = i * 8;
        
            // Position, velocity, and lifetime initialization remain the same
            this.particleData[baseIndex + 0] = smokeOrigin[0] ; // X
            this.particleData[baseIndex + 1] = smokeOrigin[1] ;    // Y
            this.particleData[baseIndex + 2] = smokeOrigin[2] ; // Z
            this.particleData[baseIndex + 3] = Math.random() * 0.2 - 0.0;  // X velocity
            this.particleData[baseIndex + 4] = Math.random() * 0.5;       // Y velocity
            this.particleData[baseIndex + 5] = Math.random() * 0.2 - 0.0; // Z velocity
            this.particleData[baseIndex + 6] = 10000.0; // Lifetime
        }
          

        this.recreateDepthTexture();
    }

    recreateDepthTexture() {
        this.depthTexture?.destroy();
        this.depthTexture = this.device.createTexture({
            format: 'depth24plus',
            size: [this.canvas.width, this.canvas.height],
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_DST,
        });
    }

    prepareNode(node) {
        if (this.gpuObjects.has(node)) {
            return this.gpuObjects.get(node);
        }

        const modelUniformBuffer = this.device.createBuffer({
            size: 128,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        const modelBindGroup = this.device.createBindGroup({
            layout: this.pipeline.getBindGroupLayout(2),
            entries: [
                { binding: 0, resource: { buffer: modelUniformBuffer } },
            ],
        });

        const gpuObjects = { modelUniformBuffer, modelBindGroup };
        this.gpuObjects.set(node, gpuObjects);
        return gpuObjects;
    }

    prepareCamera(camera) {
        if (this.gpuObjects.has(camera)) {
            return this.gpuObjects.get(camera);
        }

        const cameraUniformBuffer = this.device.createBuffer({
            size: 144, //size: 128,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        const cameraBindGroup = this.device.createBindGroup({
            layout: this.pipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: cameraUniformBuffer } },
            ],
        });

        const gpuObjects = { cameraUniformBuffer, cameraBindGroup };
        this.gpuObjects.set(camera, gpuObjects);
        return gpuObjects;
    }

    prepareTexture(texture) {
        // Synchronously check if texture is provided
        if (this.gpuObjects.has(texture)) {
            return this.gpuObjects.get(texture);
        }

        // If no texture is provided, use the global default texture
        if (!texture) {
            //console.log("No texture provided, using global default texture.");
            texture = this.defaultTexture;
        }

        // Proceed with the rest of the texture processing
        const { gpuTexture } = this.prepareImage(texture.image);
        const { gpuSampler } = this.prepareSampler(texture.sampler);

        const gpuObjects = { gpuTexture, gpuSampler };
        this.gpuObjects.set(texture, gpuObjects);

        return gpuObjects;
    }
    
    
    prepareMaterial(material) {
        if (this.gpuObjects.has(material)) {
            return this.gpuObjects.get(material);
        }

        let baseTexture;
        if(material){
            baseTexture = this.prepareTexture(material.baseTexture);

        }
        else{
            baseTexture = this.prepareTexture(this.defaultTexture);
            const defaultMaterial = new Material({
                baseTexture: null, // Ni teksture
                emissionTexture: null,
                normalTexture: null,
                occlusionTexture: null,
                roughnessTexture: null,
                metalnessTexture: null,
            
                baseFactor: [1, 1, 1, 1], // Bela barva
                emissionFactor: [0, 0, 0], // Brez emisij
                normalFactor: 1, // Brez prilagoditve normale
                occlusionFactor: 1, // Privzeto brez prilagoditve okluzije
                roughnessFactor: 1, // Polna hrapavost
                metalnessFactor: 0, // Brez kovinskega videza
            });
            material = defaultMaterial            
        }

        

        const materialUniformBuffer = this.device.createBuffer({
            size: 32,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        const materialBindGroup = this.device.createBindGroup({
            layout: this.pipeline.getBindGroupLayout(3),
            entries: [
                { binding: 0, resource: { buffer: materialUniformBuffer } },
                { binding: 1, resource: baseTexture.gpuTexture.createView() },
                { binding: 2, resource: baseTexture.gpuSampler },
            ],
        });

        const gpuObjects = { materialUniformBuffer, materialBindGroup };
        this.gpuObjects.set(material, gpuObjects);
        return gpuObjects;
    }

    prepareLight() {
        // if (this.gpuObjects.has(light)) {
        //     return this.gpuObjects.get(light);
        // }

        const lightUniformBuffer = this.device.createBuffer({
            size: lights.length * 48,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        const lightBindGroup = this.device.createBindGroup({
            layout: this.pipeline.getBindGroupLayout(1),
            entries: [
                { binding: 0, resource: { buffer: lightUniformBuffer } },
            ],
        });

        const gpuObjects = { lightUniformBuffer, lightBindGroup };
        //this.gpuObjects.set(light, gpuObjects);
        return gpuObjects;
    }
    

    render(scene, camera) {
        if (this.depthTexture.width !== this.canvas.width || this.depthTexture.height !== this.canvas.height) {
            this.recreateDepthTexture();
        }

        
        // Create an intermediate texture for the scene render
        if (!this.intermediateTexture) {
            this.intermediateTexture = this.device.createTexture({
                format: this.swapchainFormat,
                size: [this.canvas.width, this.canvas.height],
                usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
            });
        }
        const intermediateTextureView = this.intermediateTexture.createView();

        
        const encoder = this.device.createCommandEncoder();
        this.renderPass = encoder.beginRenderPass({
            colorAttachments: [
                {
                    view: this.context.getCurrentTexture().createView(),
                    clearValue: [1, 1, 1, 1],
                    loadOp: 'clear',
                    storeOp: 'store',
                }
            ],
            depthStencilAttachment: {
                view: this.depthTexture.createView(),
                depthClearValue: 1,
                depthLoadOp: 'clear',
                depthStoreOp: "store", //'discard',
            },
        });
        this.renderPass.setPipeline(this.pipeline);

        const cameraComponent = camera.getComponentOfType(Camera);
        const viewMatrix = getGlobalViewMatrix(camera);
        const projectionMatrix = getProjectionMatrix(camera);
        const cameraPosition = mat4.getTranslation(vec3.create(), getGlobalModelMatrix(camera));
        const { cameraUniformBuffer, cameraBindGroup } = this.prepareCamera(cameraComponent);
        this.device.queue.writeBuffer(cameraUniformBuffer, 0, viewMatrix);
        this.device.queue.writeBuffer(cameraUniformBuffer, 64, projectionMatrix);
        this.device.queue.writeBuffer(cameraUniformBuffer, 128, cameraPosition);
        this.renderPass.setBindGroup(0, cameraBindGroup);
        this.device.queue.writeBuffer(cameraUniformBuffer, 0, viewMatrix);
        //const { cameraUniformBuffer, cameraBindGroup } = this.prepareCamera(cameraComponent);
        //this.device.queue.writeBuffer(cameraUniformBuffer, 0, viewMatrix);
        //this.device.queue.writeBuffer(cameraUniformBuffer, 64, projectionMatrix);
        //this.renderPass.setBindGroup(0, cameraBindGroup);

        // const light = scene.find(node => node.getComponentOfType(Light));
        // const lightComponent = light.getComponentOfType(Light);
        // const lightColor = vec3.scale(vec3.create(), lightComponent.color, 1 / 255);
        // const lightDirection = vec3.normalize(vec3.create(), lightComponent.direction);
        // const { lightUniformBuffer, lightBindGroup } = this.prepareLight(lightComponent);
        // this.device.queue.writeBuffer(lightUniformBuffer, 0, lightColor);
        // this.device.queue.writeBuffer(lightUniformBuffer, 16, lightDirection);
        // this.renderPass.setBindGroup(1, lightBindGroup);

        const light = scene.find(node => node.getComponentOfType(Light));
        const lightComponent = light.getComponentOfType(Light);
        const lightColor = vec3.scale(vec3.create(), lightComponent.color, lightComponent.intensity / 255);
        const lightPosition = mat4.getTranslation(vec3.create(), getGlobalModelMatrix(light));
        const lightAttenuation = vec3.clone(lightComponent.attenuation);

        const { lightUniformBuffer, lightBindGroup } = this.prepareLight();
        // this.device.queue.writeBuffer(lightUniformBuffer, 0, lightColor);
        // this.device.queue.writeBuffer(lightUniformBuffer, 16, lightPosition);
        // this.device.queue.writeBuffer(lightUniformBuffer, 32, lightAttenuation);

        const lightData = new Float32Array(lights.length * 12);
        lights.forEach((light, i) => {
            const baseIndex = i * 12;
            let color =  light.color;//lightColor;//vec3.scale(vec3.create(), light.color, light.intensity / 255);
            let position = light.position;//lightPosition;//vec3.clone(light.position);;
            let attenuation = light.attenuation;//lightAttenuation;//vec3.clone(light.attenuation);

            lightData.set(position, baseIndex);
            lightData.set(color, baseIndex + 3);
            lightData.set(attenuation, baseIndex + 6);
        });

        this.device.queue.writeBuffer(lightUniformBuffer, 0, lightData);
        this.renderPass.setBindGroup(1, lightBindGroup);


        this.renderNode(scene);
        this.renderPass.end();
        


       //SMOKE
       // Smoke rendering

        // Smoke Rendering
        const smokeViewProjectionMatrix = mat4.multiply(
            mat4.create(),
            projectionMatrix,
            viewMatrix
        );

        // Create a texture view for the intermediate texture
       // const intermediateTextureView = this.intermediateTexture.createView();

        // Create a sampler for the intermediate texture
        const intermediateSampler = this.device.createSampler();

        // Bind the intermediate texture to the smoke pipeline
        const smokeTextureBindGroup2 = this.device.createBindGroup({
            layout: this.smokePipeline.getBindGroupLayout(3), // Use the next available binding slot
            entries: [
                { binding: 0, resource: intermediateTextureView }, // Scene texture
                { binding: 1, resource: intermediateSampler }, // Sampler for the texture
            ],
        });

        

        //console.log(this.swapchainFormat);

        this.device.queue.writeBuffer(this.smokeUniformBuffer, 0, smokeViewProjectionMatrix);

        const smokeRenderPass = encoder.beginRenderPass({
            colorAttachments: [
                {
                    view: this.context.getCurrentTexture().createView(),
                    loadOp: 'load',//'load', // Keep the scene render intact
                    storeOp: 'store',
                    clearValue: [0, 0, 0, 0],
                },
            ],
            depthStencilAttachment: {
                view: this.depthTexture.createView(),
                depthLoadOp: 'load', // Reuse the depth buffer from the scene
                depthStoreOp: 'store',
            },
            blendColor: {
                srcFactor: 'src-alpha',
                dstFactor: 'one-minus-src-alpha',
                blendOp: 'add',
            },
            alphaBlend: {
                srcFactor: 'src-alpha',
                dstFactor: 'one-minus-src-alpha',
                blendOp: 'add',
            }
        });


        
        //console.log(smokeViewProjectionMatrix);

        
        const sampler = this.device.createSampler({
            magFilter: 'linear',  // Kvalitetno povečanje
            minFilter: 'linear',  // Kvalitetno zmanjšanje
            mipmapFilter: 'linear',  // Filter za mipmape
            addressModeU: 'clamp-to-edge', // Koordinate zunaj [0, 1] se bodo obrezale
            addressModeV: 'clamp-to-edge',
            addressModeW: 'clamp-to-edge',
        });
        
        //console.log(this.SmokeTexture);
        //console.log(sampler);
        // Load the smoke texture and sampler
        this.smokeTextureBindGroup = this.device.createBindGroup({
            layout: this.smokePipeline.getBindGroupLayout(2), // New bind group layout for texture and sampler
            entries: [
                { binding: 0, resource: this.SmokeTexture   },
                { binding: 1, resource:  sampler },
            ],
        });

        this.updateParticles();
        this.device.queue.writeBuffer(this.particleBuffer, 0, this.particleData);

        // Set pipeline and draw smoke particles
        smokeRenderPass.setPipeline(this.smokePipeline);
        smokeRenderPass.setBindGroup(0, this.smokeUniformBindGroup);
        smokeRenderPass.setBindGroup(1, this.particleBindGroup);
        smokeRenderPass.setBindGroup(2, this.smokeTextureBindGroup);
        smokeRenderPass.setBindGroup(3, smokeTextureBindGroup2);


        //console.log(camera.getComponentOfType(Transform).translation);

        


        //smokeRenderPass.draw(6, this.particleCount, 0, 0); // Instanced draw

        smokeRenderPass.draw(6, this.particleCount, 0, 0);

        smokeRenderPass.end();



        this.device.queue.submit([encoder.finish()]);

    }

    updateParticles() {
        const deltaTime = 0.016; // Assuming 60 FPS (~16ms per frame)
    
        for (let i = 0; i < this.particleCount; i++) {
            const baseIndex = i * 8;
    
            // Update position based on velocity
            this.particleData[baseIndex] += this.particleData[baseIndex + 3] * deltaTime; // X position
            this.particleData[baseIndex + 1] += this.particleData[baseIndex + 4] * deltaTime; // Y position
            this.particleData[baseIndex + 2] += this.particleData[baseIndex + 5] * deltaTime; // Z position
    
            // Decrease lifetime
            this.particleData[baseIndex + 6] -= deltaTime;
    
            // Reset particle if its lifetime expires
            if (this.particleData[baseIndex + 6] <= 0) {
                this.particleData[baseIndex] = 110 + Math.random() * 0.5 - 0.25; // Reset X position
                this.particleData[baseIndex + 1] = 2 + Math.random() * 0.5;       // Reset Y position
                this.particleData[baseIndex + 2] = 1.7 + Math.random() * 0.5 - 0.25; // Reset Z position
                this.particleData[baseIndex + 3] = Math.random() * 0.2 - 0.1; // Reset X velocity
                this.particleData[baseIndex + 4] = Math.random() * 0.5;       // Reset Y velocity
                this.particleData[baseIndex + 5] = Math.random() * 0.2 - 0.1; // Reset Z velocity
                this.particleData[baseIndex + 6] = Math.random() * 5; // Reset lifetime
            }
        }
    }
    
    
    
    renderNode(node, modelMatrix = mat4.create()) {
        const localMatrix = getLocalModelMatrix(node);
        modelMatrix = mat4.multiply(mat4.create(), modelMatrix, localMatrix);
        const normalMatrix = mat4.normalFromMat4(mat4.create(), modelMatrix);

        const { modelUniformBuffer, modelBindGroup } = this.prepareNode(node);
        this.device.queue.writeBuffer(modelUniformBuffer, 0, modelMatrix);
        this.device.queue.writeBuffer(modelUniformBuffer, 64, normalMatrix);
        this.renderPass.setBindGroup(2, modelBindGroup);

        for (const model of getModels(node)) {
            this.renderModel(model);
        }

        for (const child of node.children) {
            this.renderNode(child, modelMatrix);
        }
    }

    renderModel(model) {
        for (const primitive of model.primitives) {
            this.renderPrimitive(primitive);
        }
    }

    renderPrimitive(primitive) {

        const material = primitive.material;
        const { materialUniformBuffer, materialBindGroup } = this.prepareMaterial(primitive.material);

        if (primitive && primitive.material && !primitive.material.baseFactor) {
            //this.device.queue.writeBuffer(materialUniformBuffer, 0, new Float32Array([1,1,1,1]));
            this.device.queue.writeBuffer(materialUniformBuffer, 0, new Float32Array([
                ...material.baseFactor,
                material.diffuse,
                material.specular,
                material.shininess
            ]));
        }
        else{

            //console.log(primitive.);
            //this.device.queue.writeBuffer(materialUniformBuffer, 0, new Float32Array(primitive.material.baseFactor));
           // this.device.queue.writeBuffer(materialUniformBuffer, 0, new Float32Array([0.1,0.1,0.1,1]));
           this.device.queue.writeBuffer(materialUniformBuffer, 0, new Float32Array([
            ...material.baseFactor,
            material.diffuse,
            material.specular,
            material.shininess
        ]));   
        }
        
        //this.device.queue.writeBuffer(materialUniformBuffer, 0, new Float32Array(primitive.material.baseFactor));
        this.renderPass.setBindGroup(3, materialBindGroup);

        const { vertexBuffer, indexBuffer } = this.prepareMesh(primitive.mesh, vertexBufferLayout);
        this.renderPass.setVertexBuffer(0, vertexBuffer);
        this.renderPass.setIndexBuffer(indexBuffer, 'uint32');


        this.renderPass.drawIndexed(primitive.mesh.indices.length);
    }
    
}
