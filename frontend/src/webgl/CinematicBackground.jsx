import React, { useEffect, useRef } from "react";

// Fullscreen raw-WebGL cinematic "nebula" background.
// No external assets, no dependencies. Animated fbm-noise clouds with
// cinematic color grading, drifting light, starfield, vignette and grain.
const FRAG = `
precision highp float;
uniform float u_time;
uniform vec2  u_res;
uniform vec2  u_mouse;

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453123); }

float noise(vec2 p){
  vec2 i=floor(p); vec2 f=fract(p);
  vec2 u=f*f*(3.0-2.0*f);
  return mix(mix(hash(i),hash(i+vec2(1.0,0.0)),u.x),
             mix(hash(i+vec2(0.0,1.0)),hash(i+vec2(1.0,1.0)),u.x),u.y);
}

float fbm(vec2 p){
  float v=0.0; float a=0.5;
  mat2 m=mat2(1.6,1.2,-1.2,1.6);
  for(int i=0;i<6;i++){ v+=a*noise(p); p=m*p; a*=0.5; }
  return v;
}

void main(){
  vec2 p = (gl_FragCoord.xy - 0.5*u_res.xy) / u_res.y;
  float t = u_time*0.04;

  vec2 q = vec2(fbm(p*1.4 + t), fbm(p*1.4 - t + 4.7));
  float f = fbm(p*2.0 + q*1.6 + vec2(t*1.3, -t*0.7));

  vec3 c1 = vec3(0.015,0.02,0.06);
  vec3 c2 = vec3(0.12,0.05,0.32);
  vec3 c3 = vec3(0.85,0.25,0.55);
  vec3 c4 = vec3(1.0,0.62,0.28);

  vec3 col = mix(c1, c2, smoothstep(0.15,0.7,f));
  col = mix(col, c3, smoothstep(0.55,0.95,f)*0.55);
  col += c4 * pow(max(f,0.0),4.0)*0.7;

  vec2 m = (u_mouse - 0.5*u_res.xy)/u_res.y;
  float g = 0.16/(length(p-m)+0.16);
  col += vec3(0.25,0.4,0.95)*g*0.14;

  float sh = hash(floor(gl_FragCoord.xy*0.5));
  float star = step(0.9975, sh);
  float twk = 0.6+0.4*sin(u_time*3.0 + sh*40.0);

  float vig = smoothstep(1.35,0.25,length(p));
  col *= vig;
  col += star*twk*0.7*vig;
  col += (hash(gl_FragCoord.xy + u_time)-0.5)*0.025;

  gl_FragColor = vec4(col,1.0);
}
`;

const VERT = `
attribute vec2 a_pos;
void main(){ gl_Position = vec4(a_pos,0.0,1.0); }
`;

function compile(gl, type, src) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(s));
  }
  return s;
}

export default function CinematicBackground() {
  const canvasRef = useRef(null);
  const mouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (!gl) return;

    const prog = gl.createProgram();
    gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    // Two triangles covering the screen
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW
    );
    const loc = gl.getAttribLocation(prog, "a_pos");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(prog, "u_time");
    const uRes = gl.getUniformLocation(prog, "u_res");
    const uMouse = gl.getUniformLocation(prog, "u_mouse");

    const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    function resize() {
      const w = Math.floor(window.innerWidth * dpr);
      const h = Math.floor(window.innerHeight * dpr);
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
      mouse.current.x = w * 0.5;
      mouse.current.y = h * 0.5;
    }
    resize();
    window.addEventListener("resize", resize);

    function onMove(e) {
      mouse.current.x = e.clientX * dpr;
      mouse.current.y = (window.innerHeight - e.clientY) * dpr;
    }
    window.addEventListener("pointermove", onMove);

    let raf;
    const start = performance.now();
    function render(now) {
      gl.uniform1f(uTime, (now - start) / 1000);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform2f(uMouse, mouse.current.x, mouse.current.y);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      raf = requestAnimationFrame(render);
    }
    raf = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  return <canvas ref={canvasRef} className="cinematic-bg" />;
}
