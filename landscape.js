import {ground} from './physics.js';
const coastSmooth=(a,b,v)=>{const t=Math.max(0,Math.min(1,(v-a)/(b-a)));return t*t*(3-2*t);};
export function coastRadius(x,z){const a=Math.atan2((z+10)/76,x/39);return Math.hypot(x/39,(z+10)/76)/(1+.035*Math.sin(a*5));}
export function shoreHeight(x,z){return ground(x,z);}
export function walkableCoast(x,z){return shoreHeight(x,z)>-4.85;}
export function landscapeMaterial(renderer,offset=null){
 const {B,scene}=renderer,m=renderer.material('living-fairway',[1,1,1],null,1);
 m.bumpTexture=renderer.texture('cove-grass-normal.jpg');m.bumpTexture.level=.16;
 class CourseSurface extends B.MaterialPluginBase{getClassName(){return "VerdantCourseSurface";}
  constructor(){super(m,offset?'SanctuarySurface':'CourseSurface',200,{SANCTUARY_SURFACE:false});this._enable(true);}
  prepareDefines(defines){defines.SANCTUARY_SURFACE=!!offset;}
  getSamplers(s){s.push('courseGrass','courseSand','roughNormal','sandNormal','forestColor','forestNormal','mossColor','mossNormal');}
  getActiveTextures(a){a.push(...['cove-grass.jpg','cove-sand.jpg','cove-grass-normal.jpg','cove-sand-normal.jpg','coastal-atlas-Diffuse.jpg','coastal-atlas-nor_gl.jpg','aerial_grass_rock-Diffuse.jpg','aerial_grass_rock-nor_gl.jpg'].map(f=>renderer.texture(f)));}
  isReadyForSubMesh(){return ['cove-grass.jpg','cove-sand.jpg','cove-grass-normal.jpg','cove-sand-normal.jpg','coastal-atlas-Diffuse.jpg','coastal-atlas-nor_gl.jpg','aerial_grass_rock-Diffuse.jpg','aerial_grass_rock-nor_gl.jpg'].every(f=>renderer.texture(f).isReady());}
  bindForSubMesh(uniformBuffer){for(const [name,file]of [['courseGrass','cove-grass.jpg'],['courseSand','cove-sand.jpg'],['roughNormal','cove-grass-normal.jpg'],['sandNormal','cove-sand-normal.jpg'],['forestColor','coastal-atlas-Diffuse.jpg'],['forestNormal','coastal-atlas-nor_gl.jpg'],['mossColor','aerial_grass_rock-Diffuse.jpg'],['mossNormal','aerial_grass_rock-nor_gl.jpg']])uniformBuffer.setTexture(name,renderer.texture(file));}
  getCustomCode(type){if(type!=='fragment')return null;return{
   CUSTOM_FRAGMENT_DEFINITIONS:`uniform sampler2D courseGrass;uniform sampler2D courseSand;uniform sampler2D roughNormal;uniform sampler2D sandNormal;uniform sampler2D forestColor;uniform sampler2D forestNormal;uniform sampler2D mossColor;uniform sampler2D mossNormal; vec2 coverUV(vec2 p,float tile){return ((1.-abs(mod(p,2.)-1.))*.90+.05+vec2(mod(tile,3.),floor(tile/3.)))/vec2(3.,2.);} vec3 coverColor(vec2 p,float tile){return texture2D(forestColor,coverUV(p,tile)).rgb;}`,
   CUSTOM_FRAGMENT_BEFORE_LIGHTS:`
    vec2 detailP=${offset?'vec2(vPositionW.x-'+offset.x.toFixed(3)+',(vPositionW.z-('+offset.z.toFixed(3)+'))/'+offset.stretch.toFixed(3)+')':'vPositionW.xz'};
    float detailFair=1.-smoothstep(8.7,11.3,abs(detailP.x-6.*sin(detailP.y*.045))+sin(detailP.y*.19)*.3);
    vec2 detailG=(detailP-vec2(3.,-51.))/vec2(13.,11.);
    float detailCollar=1.-smoothstep(1.1,1.24,length(detailG)/(1.+.06*sin(atan(detailG.y,detailG.x)*3.)));
    float detailAngle=atan((detailP.y+10.)/76.,detailP.x/39.);
    float detailSand=smoothstep(.79,.92,length(vec2(detailP.x/39.,(detailP.y+10.)/76.))/(1.+.035*sin(detailAngle*5.)));
    detailSand=max(detailSand,max(1.-smoothstep(.75,1.08,length((detailP-vec2(14.,-7.))/vec2(3.5,8.))),1.-smoothstep(.75,1.08,length((detailP-vec2(-14.,-42.))/vec2(4.,6.)))));
    float detailMix=smoothstep(.24,.62,texture2D(courseGrass,detailP*.035).r);
    vec3 roughN=mix(texture2D(forestNormal,coverUV(detailP*.40,0.)).xyz,texture2D(mossNormal,detailP*.12).xyz,detailMix*.65)*2.-1.;
    vec3 sandN=texture2D(sandNormal,detailP*.5).xyz*2.-1.;
    float roughWeight=(1.-detailFair)*(1.-detailCollar)*(1.-detailSand)*${offset?'.64':'.56'};
    normalW=normalize(normalW+vec3(roughN.x,0.,roughN.y)*roughWeight+vec3(sandN.x,0.,sandN.y)*detailSand*.20);
   `,
   CUSTOM_FRAGMENT_UPDATE_ALBEDO:`
    vec2 p=${offset?'vec2(vPositionW.x-'+offset.x.toFixed(3)+',(vPositionW.z-('+offset.z.toFixed(3)+'))/'+offset.stretch.toFixed(3)+')':'vPositionW.xz'};
    float grain=dot(texture2D(courseGrass,p*.23).rgb,vec3(.299,.587,.114));
    float broad=dot(texture2D(courseGrass,p*.043).rgb,vec3(.299,.587,.114));
    float fw=abs(p.x-6.*sin(p.y*.045));
    float fair=1.-smoothstep(8.7,11.3,fw+sin(p.y*.19)*.3);
    vec2 g=(p-vec2(3.,-51.))/vec2(13.,11.);
    float gr=length(g)/(1.+.06*sin(atan(g.y,g.x)*3.));
    float green=1.-smoothstep(.985,1.025,gr);
    float collar=1.-smoothstep(1.1,1.24,gr);
    float stripe=smoothstep(-.13,.13,sin((p.y+p.x*.32)*.70));
    float undergrowth=dot(texture2D(courseGrass,p*.63+vec2(.13,.41)).rgb,vec3(.299,.587,.114));
    vec3 forestSample=coverColor(p*.40,0.);
    vec3 mossSample=texture2D(mossColor,p*.12).rgb;
    float forestLuma=dot(forestSample,vec3(.299,.587,.114)),mossLuma=dot(mossSample,vec3(.299,.587,.114));
    float cover=smoothstep(.24,.62,texture2D(courseGrass,p*.035).r);
    vec3 livingLeaf=forestSample*vec3(.66,.91,.46); livingLeaf=mix(livingLeaf,vec3(.075,.145,.030),.14);
    vec3 livingMoss=mix(vec3(.033,.068,.014),vec3(.12,.24,.038),clamp(mossLuma*1.7,0.,1.));
    vec3 rough=mix(livingLeaf,livingMoss,cover*.18)*(.91+grain*.20);
    ${offset?'rough=mix(rough,coverColor(p*.63,0.)*vec3(.58,.88,.38),.22);':''}
    float trail=(1.-smoothstep(.5,2.2,abs(p.y-(22.+sin(p.x*.17)*1.6))))*smoothstep(13.,18.,p.x)*(1.-smoothstep(36.,43.,p.x));
    vec3 pathColor=mix(coverColor(p*.30,1.),coverColor(p*.30,2.),smoothstep(.2,.7,broad));
    rough=mix(rough,pathColor*vec3(.70,.80,.49),trail*.60);
    float woods=smoothstep(18.,25.,abs(p.x-6.*sin(p.y*.045)))*(1.-smoothstep(25.,33.,p.x));
    float mottling=smoothstep(.35,.60,texture2D(courseGrass,p*.08).r);
    rough=mix(rough,coverColor(p*.32,3.)*vec3(.67,.86,.47),woods*mottling*.27);
    float rockEdge=exp(-length((p-vec2(-30.,-5.))/vec2(4.,3.)))+exp(-length((p-vec2(34.,35.))/vec2(3.,2.)));
    rough=mix(rough,coverColor(p*.40,4.)*vec3(.65,.85,.50),clamp(rockEdge*.34,0.,.34));
    float coastalDetail=smoothstep(28.,36.,p.x)*(1.-smoothstep(33.,40.,p.y))*smoothstep(20.,25.,p.y);
    rough=mix(rough,coverColor(p*.40,5.)*vec3(.75,.82,.59),coastalDetail*.22);
    vec3 fairway=mix(vec3(.075,.235,.032),vec3(.115,.30,.047),stripe)*(.78+grain*.48);
    vec3 putting=vec3(.18,.38,.064)*(.91+grain*.18)*(1.+.035*sin((vPositionW.x*.7+vPositionW.z)*1.35));
    surfaceAlbedo=mix(rough,fairway,fair);
    surfaceAlbedo=mix(surfaceAlbedo,vec3(.10,.25,.026),collar);
    surfaceAlbedo=mix(surfaceAlbedo,putting,green);
    float angle=atan((p.y+10.)/76.,p.x/39.);
    float coast=length(vec2(p.x/39.,(p.y+10.)/76.))/(1.+.035*sin(angle*5.));
    float shore=smoothstep(.79,.92,coast);
    float bunker=max(1.-smoothstep(.75,1.08,length((p-vec2(14.,-7.))/vec2(3.5,8.))),1.-smoothstep(.75,1.08,length((p-vec2(-14.,-42.))/vec2(4.,6.))));
    shore=max(shore,bunker);
    vec3 sand=texture2D(courseSand,p*.17).rgb;
    sand=mix(vec3(.55,.40,.22),vec3(.78,.65,.43),dot(sand,vec3(.299,.587,.114)));
    sand*=(.87+.24*dot(texture2D(courseSand,p*.83).rgb,vec3(.299,.587,.114)))*mix(.59,1.,smoothstep(-5.3,-3.9,vPositionW.y));
    surfaceAlbedo=mix(surfaceAlbedo,sand,shore);
   `};}
 }
 new CourseSurface();return m;
}
