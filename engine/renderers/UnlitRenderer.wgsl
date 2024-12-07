struct VertexInput {
    @location(0) position: vec3f,
    @location(1) texcoords: vec2f,
    @location(2) normal: vec3f,
}

struct VertexOutput {
    @builtin(position) clipPosition: vec4f,
    @location(0) position: vec3f,
    @location(1) texcoords: vec2f,
    @location(2) normal: vec3f,
}

struct FragmentInput {
    @location(0) position: vec3f,
    @location(1) texcoords: vec2f,
    @location(2) normal: vec3f,
}

struct FragmentOutput {
    @location(0) color: vec4f,
}

struct CameraUniforms {
    viewMatrix: mat4x4f,
    projectionMatrix: mat4x4f,
    position: vec3f,
}

struct LightUniforms {
    color: vec3f,
    position: vec3f,
    attenuation: vec3f,
    _padding: f32,    // Padding for alignment (vec3f + f32 = 16 bytes)
}

struct ModelUniforms {
    modelMatrix: mat4x4f,
    normalMatrix: mat3x3f,
}

struct MaterialUniforms {
    baseFactor: vec4f,
    diffuse: f32,
    specular: f32,
    shininess: f32,
}

@group(0) @binding(0) var<uniform> camera: CameraUniforms;
@group(1) @binding(0) var<uniform> lights: array<LightUniforms, 2>;
@group(2) @binding(0) var<uniform> model: ModelUniforms;
@group(3) @binding(0) var<uniform> material: MaterialUniforms;
@group(3) @binding(1) var baseTexture: texture_2d<f32>;
@group(3) @binding(2) var baseSampler: sampler;

@vertex
fn vertex(input: VertexInput) -> VertexOutput {
    var output: VertexOutput;
    output.clipPosition = camera.projectionMatrix * camera.viewMatrix * model.modelMatrix * vec4(input.position, 1);
    output.position = (model.modelMatrix * vec4(input.position, 1)).xyz;
    output.texcoords = input.texcoords;
    output.normal = model.normalMatrix * input.normal;
    return output;
}

@fragment
fn fragment(input: FragmentInput) -> FragmentOutput {
    var output: FragmentOutput;

    let surfacePosition = input.position;
    let N = normalize(input.normal);                     // Površinska normala
    let V = normalize(camera.position - surfacePosition); // Vektor opazovalca

    var totalDiffuse: vec3f = vec3(0.0); // Skupna difuzna osvetlitev
    var totalSpecular: vec3f = vec3(0.0); // Skupna spekularna osvetlitev

    // Iteriraj skozi vse luči glede na število aktivnih luči (lightCount)
    for (var i = 0u; i < 2u; i = i + 1u) {
        let light = lights[i]; // Trenutna luč
        let L = normalize(light.position - surfacePosition); // Vektor proti luči
        let R = reflect(-L, N); // Reflektirani vektor

        // Preverjanje material.diffuse
        let diffuseStrength = max(material.diffuse, 1.0); // Privzeta vrednost je 1.0

        // Preverjanje material.specular
        let specularStrength = max(material.specular, 0.5); // Privzeta vrednost je 0.5

        // Preverjanje material.shininess
        let shininessValue = max(material.shininess, 32.0); // Privzeta vrednost je 32.0



        // Izračun oslabitve (attenuation)
        let d = distance(surfacePosition, light.position);
        let attenuation = 1.0 / dot(light.attenuation, vec3(1, d, d * d));

        // Difuzna komponenta (Lambertov zakon)
        let lambert = max(dot(N, L), 0.0) * diffuseStrength;

        // Spekularna komponenta (Phongov model)
        let phong = pow(max(dot(V, R), 0.0), shininessValue) * specularStrength;

        // Prispevek trenutne luči
        totalDiffuse += lambert * attenuation * light.color;
        totalSpecular += phong * attenuation * light.color;
    }

    // Ambientna osvetlitev
    let ambientLight = vec3(0.1, 0.1, 0.1);

    // Osnovna barva površine
    let baseColor = textureSample(baseTexture, baseSampler, input.texcoords).rgb * material.baseFactor.rgb;

    // Končna barva
    let finalColor = (baseColor.rgb * (totalDiffuse + ambientLight) + totalSpecular);

    // Gamma korekcija
    output.color = vec4(pow(finalColor, vec3(1.0 / 2.2)), 1.0);  //pow(vec4(finalColor, 1), vec4(1 / 2.2));

    //output.color = vec4(input.normal * 0.5 + 0.5, 1);

    return output;
}
