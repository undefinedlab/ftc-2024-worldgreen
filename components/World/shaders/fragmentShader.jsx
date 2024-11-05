export const fragmentShader = `
uniform sampler2D u_map_tex;

varying float vOpacity;
varying vec2 vUv;

void main() {
    vec3 color = texture2D(u_map_tex, vUv).rgb;
    float gray = dot(color, vec3(0.299, 0.587, 0.114));
    color = vec3(gray);
    color -= 0.2 * length(gl_PointCoord.xy - vec2(0.5));
    float dot = 1.0 - smoothstep(0.38, 0.4, length(gl_PointCoord.xy - vec2(0.5)));
    if (dot < 0.5) discard;
    gl_FragColor = vec4(color, dot * vOpacity);
}
`;