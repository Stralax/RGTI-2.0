// Define the Particle structure
struct Particle {
    position: vec3<f32>, // Position of the particle (x, y, z)
    velocity: vec3<f32>, // Velocity of the particle (vx, vy, vz)
    lifetime: f32,       // Lifetime of the particle (duration)
};

// Declare storage buffer and sampler
@group(1) @binding(0) var<storage, read> particles: array<Particle>; // Particle data
@group(2) @binding(0) var smokeTexture: texture_2d<f32>; // Texture for smoke particles
@group(2) @binding(1) var smokeSampler: sampler; // Sampler for the texture

// Define the vertex output structure
struct VertexOutput {
    @builtin(position) position: vec4f, // Position to pass to the fragment shader
    @location(0) uv: vec2f,             // Texture coordinates (UV)
};

@vertex
fn vertex_main(@builtin(vertex_index) vertexIndex: u32, @builtin(instance_index) instanceIndex: u32) -> VertexOutput {
    let particle = particles[instanceIndex]; // Access the particle data based on the instance

    // Calculate the new position of the particle
    var newPosition = particle.position + particle.velocity * particle.lifetime;
    newPosition.y += particle.lifetime * 0.1; // Modify Y position based on lifetime for rising effect

    // Define the texture coordinates based on the particle's position
    //let uv = vec2f(particle.position.x, particle.position.z); // Simple UV mapping based on position

    var output: VertexOutput;
    var viewProjectionMatrix: mat4x4<f32>;
    output.position = viewProjectionMatrix  * vec4f(newPosition, 1.0); // Set the position in homogeneous coordinates
    //output.uv = uv;                           // Pass UV to the fragment shader

    return output;
}

// Define the fragment function
@fragment
fn fragment_main(@location(0) uv: vec2f) -> @location(0) vec4f {
    // Sample the texture based on UV coordinates
    let color = textureSample(smokeTexture, smokeSampler, uv);

    // Apply the alpha value based on the particle's lifetime (you can modify this as needed)
    let alpha = 1.0; // Assuming the alpha is always 1 for simplicity. Adjust based on your logic

    return vec4f(color.rgb, alpha); // Return the final color with alpha
}
