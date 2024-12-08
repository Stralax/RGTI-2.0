// Define the Particle structure
struct Particle {
    position: vec3<f32>, // Position of the particle (x, y, z)
    velocity: vec3<f32>, // Velocity of the particle (vx, vy, vz)
    lifetime: f32,       // Lifetime of the particle (duration)
};

// Declare storage buffer and samplers
@group(1) @binding(0) var<storage, read> particles: array<Particle>; // Particle data
@group(2) @binding(0) var smokeTexture: texture_2d<f32>; // Texture for smoke particles
@group(2) @binding(1) var smokeSampler: sampler; // Sampler for the smoke texture
@group(3) @binding(0) var sceneTexture: texture_2d<f32>; // Scene texture
@group(3) @binding(1) var sceneSampler: sampler; // Sampler for the scene texture

// Declare the view-projection matrix (to be passed from the CPU)
@group(0) @binding(0) var<uniform> viewProjectionMatrix: mat4x4<f32>; // View-projection matrix for camera

// Define the vertex output structure
struct VertexOutput {
    @builtin(position) position: vec4<f32>, // Position to pass to the fragment shader
    @location(0) uv: vec2<f32>,             // Texture coordinates (UV)
};

// Vertex shader
@vertex
fn vertex_main(@builtin(vertex_index) vertexIndex: u32, @builtin(instance_index) instanceIndex: u32) -> VertexOutput {
    let particle = particles[instanceIndex]; // Access the particle data based on the instance

    // Calculate the new position of the particle
    //var newPosition = particle.position + particle.velocity * particle.lifetime;
    //newPosition.y += particle.lifetime * 0.1; // Modify Y position based on lifetime for rising effect


    var newPosition = particle.position;
    var output: VertexOutput;
    output.position = vec4(newPosition, 1.0); // Transform position using the view-projection matrix

    // Simple UV mapping based on position (you can adjust this for more complex mapping)
    //output.uv = vec2<f32>(newPosition.x, newPosition.z);  // Example UV mapping

    output.uv = (newPosition.xz + vec2(1.0, 1.0)) * 0.5;

    return output;
}

// Fragment shader
@fragment
fn fragment_main(@location(0) uv: vec2<f32>) -> @location(0) vec4<f32> {
    // // Samo vzorči osnovno teksturo (scene texture)
    // let sceneColor = textureSample(sceneTexture, sceneSampler, uv);

    // // Samo vzorči dimno teksturo (smoke texture)
    // //let smokeColor = textureSample(smokeTexture, smokeSampler, uv);

    // // Preprosto mešanje barve scene in dima (dodajanje barve dima na osnovno sliko)
    // //let outputColor = /*sceneColor + */smokeColor; // Dodaj dim k osnovni sceni

    // // Osnovna barva (prva faza)
    // let baseColor = vec4<f32>(0.8, 0.7, 0.6, 1.0);

    // // Proceduralni dim (lahko temelji na šumu)
    // // let uv = fragCoord.xy / vec2<f32>(canvasWidth, canvasHeight);
    // // let noise = sin(uv.x * 10.0 + uv.y * 15.0 + time) * 0.5 + 0.5;
    // let smokeColor = vec4<f32>(0.5, 0.5, 0.5, 0.2 * 0.3);

    // // Združevanje
    // return mix(baseColor, smokeColor, smokeColor.a);

    // //return outputColor;

     // Ustvari osnovno barvo (npr. rjava barva za sceno)
    let baseColor = vec4<f32>(0.8, 0.7, 0.6, 1.0);

    // Proceduralni šum za dim
    var noise = sin(uv.x * 10.0 + uv.y * 15.0  * 0.5) * 0.5 + 0.5;
    noise += sin(uv.x * 20.0 + uv.y * 10.0 - 0.3) * 0.25;
    noise = smoothstep(0.3, 0.7, noise); // Zmehča robove šuma

    // Dimna barva
    let smokeColor = vec4<f32>(0.5, 0.5, 0.5, 0.3 * noise);

    // Mešanje dima z osnovno barvo
    return mix(baseColor, smokeColor, smokeColor.a);
}
