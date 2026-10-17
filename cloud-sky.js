// Two analytic cloud decks in one sky draw. The HDR remains the lighting probe.
export function buildCloudSky(renderer){
 const {B,scene}=renderer;
 B.Effect.ShadersStore.verdantCloudVertexShader=`precision highp float;
 attribute vec3 position;uniform mat4 worldViewProjection;varying vec3 skyDirection;
 void main(){skyDirection=position;gl_Position=worldViewProjection*vec4(position,1.);}`;
 B.Effect.ShadersStore.verdantCloudFragmentShader=`precision highp float;
 varying vec3 skyDirection;uniform float cloudTime;uniform vec2 cloudEye;
 float chash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 float cnoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(chash(i),chash(i+vec2(1.,0.)),f.x),mix(chash(i+vec2(0.,1.)),chash(i+vec2(1.,1.)),f.x),f.y);}
 float cloudField(vec2 p){float v=0.,a=.55;for(int i=0;i<5;i++){v+=a*cnoise(p);p=mat2(.8,-.6,.6,.8)*p*2.03+7.3;a*=.47;}return v;}
 void main(){vec3 d=normalize(skyDirection);float h=max(d.y,0.);
 vec3 sky=mix(vec3(.70,.79,.80),vec3(.24,.48,.69),pow(h,.45));
 vec3 sun=normalize(vec3(.55,.70,.60));float glow=pow(max(dot(d,sun),0.),18.);sky+=vec3(.17,.12,.06)*glow;
 vec2 upper=(cloudEye+d.xz*340./max(d.y,.065)+vec2(cloudTime*.22,cloudTime*.09))*.0033;
 float high=cloudField(upper);float veil=smoothstep(.46,.66,high)*.37*smoothstep(.02,.18,h);
 sky=mix(sky,vec3(.88,.90,.87),veil);
 vec2 lower=(cloudEye+d.xz*145./max(d.y,.065)+vec2(cloudTime*.75,cloudTime*.19))*.0055;
 lower+=vec2(cnoise(lower*.7+cloudTime*.002),cnoise(lower*.7-cloudTime*.0015))*.35;
 float n=cloudField(lower),density=smoothstep(.43,.66,n)*smoothstep(.025,.16,h);
 float edge=cloudField(lower+vec2(.09,.06))-n;
 vec3 cloud=mix(vec3(.66,.73,.74),vec3(.98,.96,.86),clamp(.56+edge*5.+h*.18,0.,1.));
 sky=mix(sky,cloud,density*.91);gl_FragColor=vec4(sky,1.);}`;
 const sky=B.MeshBuilder.CreateSphere('living-cloud-sky',{diameter:1650,segments:24,sideOrientation:B.Mesh.BACKSIDE},scene);
 const material=new B.ShaderMaterial('layered-drifting-clouds',scene,{vertex:'verdantCloud',fragment:'verdantCloud'},{attributes:['position'],uniforms:['worldViewProjection','cloudTime','cloudEye']});
 material.backFaceCulling=false;material.disableDepthWrite=true;sky.material=material;sky.infiniteDistance=true;sky.isPickable=false;sky.applyFog=false;sky.alwaysSelectAsActiveMesh=true;
 material.setFloat('cloudTime',0);material.setVector2('cloudEye',B.Vector2.Zero());
 return{mesh:sky,update(time,eye){material.setFloat('cloudTime',time);material.setVector2('cloudEye',new B.Vector2(eye.x,eye.z));}};
}
