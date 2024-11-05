export const vertexShader = `
uniform sampler2D u_map_tex;
uniform float u_dot_size;
uniform float u_time_since_click;
uniform vec3 u_pointer;

#define PI 3.14159265359

varying float vOpacity;
varying vec2 vUv;
varying float vIsLand;

void main() {
    vUv = uv;
    
    // Determine if it's land or water
    float landWaterMask = texture2D(u_map_tex, uv).r;
    vIsLand = step(0.1, landWaterMask);
    
    // Adjust dot size (slightly smaller for water)
    gl_PointSize = u_dot_size * (landWaterMask * 0.4 + 0.5);
    
    // Calculate view-dependent opacity
    vec3 vNormal = normalize(normalMatrix * normal);
    vec3 vViewPosition = -((modelViewMatrix * vec4(position, 1.0)).xyz);
    vec3 vViewDir = normalize(vViewPosition);
    float facingRatio = dot(vNormal, vViewDir);
    
    // Adjust the facing ratio to make back side more transparent
    facingRatio = smoothstep(-0.3, 0.5, facingRatio);
    
    // Calculate base opacity
    float baseOpacity = (1.0 / length(vViewPosition) - 0.2);
    baseOpacity = clamp(baseOpacity, 0.3, 1.0);
    
    // Combine base opacity with facing ratio
    baseOpacity *= facingRatio;
    
    // Adjust opacity for water and land
    float waterOpacity = baseOpacity * 0.02;
    float landOpacity = baseOpacity * 0.9;
    vOpacity = mix(waterOpacity, landOpacity, vIsLand);
    
    // Add ripple effect
    float t = max(0.0, u_time_since_click - 0.1);
    float max_amp = 0.15;
    float dist = 1.0 - 0.5 * length(position - u_pointer);
    float damping = 1.0 / (1.0 + 20.0 * t);
    float delta = max_amp * damping * sin(5.0 * t * (1.0 + 2.0 * dist) - PI);
    delta *= 1.0 - smoothstep(0.8, 1.0, dist);
    vec3 pos = position * (1.0 + delta);
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;