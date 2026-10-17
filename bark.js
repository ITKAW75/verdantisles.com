// Continuous metre-scaled bark avoids the scan-to-generated-trunk texture seam.
// One texture pair is shared by the wood materials; no duplicated trunk shells.
export function buildContinuousBark(renderer,m){
 const {B}=renderer;
 if(m.continuousBark)return m;m.continuousBark=true;
 m.albedoTexture=null;m.bumpTexture=null;m.metallicTexture=null;m.ambientTexture=null;
 m.metallic=0;m.roughness=.96;
 const color=renderer.texture('pine-bark-Diffuse.jpg'),normal=renderer.texture('pine-bark-nor_gl.jpg');
 m.backFaceCulling=true;
 class Bark extends B.MaterialPluginBase{getClassName(){return "VerdantBark";}
  constructor(){super(m,'ContinuousBark',210,{});this._enable(true);}
  getSamplers(a){a.push('barkColor','barkNormal');}
  getActiveTextures(a){a.push(color,normal);}
  isReadyForSubMesh(){return color.isReady()&&normal.isReady();}
  bindForSubMesh(u){u.setTexture('barkColor',color);u.setTexture('barkNormal',normal);}
  getCustomCode(type){if(type!=='fragment')return null;return{
   CUSTOM_FRAGMENT_DEFINITIONS:`uniform sampler2D barkColor;uniform sampler2D barkNormal;
    vec3 barkWeights(vec3 n){vec3 w=pow(abs(n),vec3(4.));return w/max(dot(w,vec3(1.)),.001);}
    vec3 barkSample(sampler2D map,vec3 p,vec3 w){return texture2D(map,p.zy).rgb*w.x+texture2D(map,p.xz).rgb*w.y+texture2D(map,p.xy).rgb*w.z;}`,
   CUSTOM_FRAGMENT_UPDATE_ALBEDO:`
    vec3 barkP=vPositionW*.72;
    vec3 barkW=barkWeights(vNormalW);
    vec3 barkRGB=barkSample(barkColor,barkP,barkW);
    float barkVariation=.94+.06*sin(vPositionW.y*.43+vPositionW.x*.27+vPositionW.z*.31);
    surfaceAlbedo=pow(barkRGB,vec3(2.2))*vec3(.93,1.04,.87)*barkVariation;
    #ifdef VERTEXCOLOR
     surfaceAlbedo*=vColor.rgb;
    #endif
   `,
   CUSTOM_FRAGMENT_BEFORE_LIGHTS:`
    vec3 bw=barkWeights(vNormalW),bp=vPositionW*.72;
    vec3 bx=texture2D(barkNormal,bp.zy).xyz*2.-1.;
    vec3 by=texture2D(barkNormal,bp.xz).xyz*2.-1.;
    vec3 bz=texture2D(barkNormal,bp.xy).xyz*2.-1.;
    vec3 detail=vec3(0.,bx.y,bx.x)*bw.x+vec3(by.x,0.,by.y)*bw.y+vec3(bz.x,bz.y,0.)*bw.z;
    normalW=normalize(normalW+detail*.28);
   `};}
 }
 new Bark();return m;
}
