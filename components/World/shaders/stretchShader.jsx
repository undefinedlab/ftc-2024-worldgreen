export const StretchShader = {
    uniforms: {
      "tDiffuse": { value: null },
      "amount": { value: 1.2 }
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D tDiffuse;
      uniform float amount;
      varying vec2 vUv;
      void main() {
        vec2 uv = vUv;
        uv.x = (uv.x - 0.5) / amount + 0.5;
        gl_FragColor = texture2D(tDiffuse, uv);
      }
    `
  };