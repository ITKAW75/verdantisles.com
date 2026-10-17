import {geometry} from './geometry.js';
export function assetURL(name){return window.VERDANT_ASSETS?.[name]||'assets/'+name;}
export function createRenderer(canvas){
 const B=BABYLON;
 const engine=new B.Engine(canvas,true,{stencil:true,preserveDrawingBuffer:false,powerPreference:'high-performance',adaptToDeviceRatio:false},false);
 const scene=new B.Scene(engine);scene.useRightHandedSystem=true;scene.clearColor=new B.Color4(.57,.72,.76,1);scene.fogMode=B.Scene.FOGMODE_EXP2;scene.fogDensity=.0024;scene.fogColor=new B.Color3(.64,.73,.72);scene.skipPointerMovePicking=true;
 const camera=new B.FreeCamera('visitor',new B.Vector3(3,3.4,43),scene);camera.minZ=.15;camera.maxZ=1800;camera.inputs.clear();scene.activeCamera=camera;
 const skyFill=new B.HemisphericLight('sky-fill',new B.Vector3(0,1,0),scene);skyFill.intensity=.36;skyFill.diffuse=new B.Color3(.71,.85,1);skyFill.groundColor=new B.Color3(.27,.33,.19);
 const sun=new B.DirectionalLight('afternoon-sun',new B.Vector3(-.55,-.7,-.6).normalize(),scene);sun.position=new B.Vector3(50,90,75);sun.diffuse=new B.Color3(1,.91,.78);sun.intensity=2.35;sun.autoCalcShadowZBounds=true;sun.shadowMinZ=1;sun.shadowMaxZ=230;sun.orthoLeft=-70;sun.orthoRight=70;sun.orthoBottom=-95;sun.orthoTop=95;
 const shadows=new B.ShadowGenerator(2048,sun);shadows.usePercentageCloserFiltering=true;shadows.filteringQuality=B.ShadowGenerator.QUALITY_MEDIUM;shadows.bias=.00025;shadows.normalBias=.035;shadows.darkness=.12;
 scene.environmentTexture=new B.HDRCubeTexture(assetURL('cove-sky.hdr'),scene,256,false,true,false,true);scene.environmentIntensity=.65;
 const pipeline=new B.DefaultRenderingPipeline('clarity',true,scene,[camera]);pipeline.samples=2;pipeline.fxaaEnabled=true;pipeline.bloomEnabled=true;pipeline.bloomThreshold=1.05;pipeline.bloomWeight=.14;pipeline.bloomKernel=48;
 scene.imageProcessingConfiguration.toneMappingEnabled=true;scene.imageProcessingConfiguration.toneMappingType=B.ImageProcessingConfiguration.TONEMAPPING_ACES;scene.imageProcessingConfiguration.exposure=1.0;scene.imageProcessingConfiguration.contrast=1.15;
 const textures=new Map(),materials=new Map(),wrappers=[];let tick=0,quality=0;
 function texture(file){if(!textures.has(file)){const t=new B.Texture(assetURL(file),scene,false,true,B.Texture.TRILINEAR_SAMPLINGMODE);t.anisotropicFilteringLevel=8;textures.set(file,t);}return textures.get(file);}
 function material(name,color=[1,1,1],file=null,rough=.9){const m=new B.PBRMaterial(name,scene);m.albedoColor=B.Color3.FromArray(color);m.metallic=0;m.roughness=rough;m.backFaceCulling=false;m.useSpecularOverAlpha=false;m.enableSpecularAntiAliasing=true;if(file)m.albedoTexture=texture(file);return m;}
 function legacyMaterial(id){if(materials.has(id))return materials.get(id);const m=material('golf-material-'+id);if(id===8)m.roughness=1;if(id===5)m.roughness=.65;if(id===16)m.roughness=.32;materials.set(id,m);return m;}
 function mesh(data){const groups=new Map();for(let i=0;i<data.length;i+=30){const id=data[i+9]||0;if(!groups.has(id))groups.set(id,{positions:[],normals:[],colors:[],indices:[]});const g=groups.get(id);for(let v=0;v<3;v++){const k=i+v*10;g.positions.push(...data.slice(k,k+3));g.normals.push(...data.slice(k+3,k+6));g.colors.push(...data.slice(k+6,k+9),1);g.indices.push(g.indices.length);}}
  const templates=[];for(const [id,g]of groups){const m=new B.Mesh('golf-part',scene),vd=new B.VertexData();Object.assign(vd,g);vd.applyToMesh(m);m.material=legacyMaterial(id);m.isPickable=false;m.setEnabled(false);templates.push(m);}const w={templates,pool:[],used:0,count:data.length/10};wrappers.push(w);return w;
 }
 function draw(w,offset=[0,0,0],scale=[1,1,1],glow=0,rotation=null,opacity=1){if(!w||w.static)return;const index=w.used++;if(!w.pool[index]){const root=new B.TransformNode('actor',scene);const parts=w.templates.map(t=>{const m=t.clone('actor-part',root);m.material=t.material.clone('actor-material');m.receiveShadows=true;m.isPickable=false;return m;});w.pool[index]={root,parts};}const {root,parts}=w.pool[index];root.position.copyFromFloats(...offset);root.scaling.copyFromFloats(...scale);root.rotation.copyFromFloats(...(rotation||[0,0,0]));for(const m of parts){m.setEnabled(true);m.material.alpha=opacity;m.material.transparencyMode=opacity<1?B.PBRMaterial.PBRMATERIAL_ALPHABLEND:B.PBRMaterial.PBRMATERIAL_OPAQUE;m.material.emissiveColor.copyFromFloats(glow,glow,glow);}}
 function frame(eye,target,fov,time){engine._drawCalls?.fetchNewFrame();engine.beginFrame();for(const w of wrappers)w.used=0;camera.position.copyFromFloats(...eye);camera.setTarget(B.Vector3.FromArray(target));camera.fov=fov*Math.PI/180;tick=time;}
 function finishFrame(){for(const w of wrappers)for(let i=w.used;i<w.pool.length;i++)for(const m of w.pool[i].parts)m.setEnabled(false);scene.render();engine.endFrame();}
 function resize(ratio=1.4){engine.setHardwareScalingLevel(1/ratio);engine.resize();}
 function setQuality(q){quality=q;pipeline.samples=q===1?4:q===2?1:2;pipeline.bloomEnabled=q!==2;sun.shadowEnabled=q!==2;scene.environmentIntensity=q===2?.5:.65;}
 const allShadowCasters=new Set();
 function localShadowCasters(eye){return [...allShadowCasters].filter(m=>{if(m.isDisposed()||!m.isEnabled())return false;const b=m.getBoundingInfo().boundingSphere;return Math.hypot(b.centerWorld.x-eye.x,b.centerWorld.z-eye.z)<140+Math.min(35,b.radiusWorld);});}
 function removeShadowCaster(m){allShadowCasters.delete(m);shadows.removeShadowCaster(m);}
 function shadowCaster(m){allShadowCasters.add(m);shadows.addShadowCaster(m,false);m.receiveShadows=true;}
 function bakeShadow(){shadows.getShadowMap().refreshRate=B.RenderTargetTexture.REFRESHRATE_RENDER_ONCE;scene.executeWhenReady(()=>shadows.getShadowMap().resetRefreshCounter());}
 return{engine,scene,camera,B,material,texture,shadowCaster,removeShadowCaster,localShadowCasters,shadows,mesh,draw,frame,finishFrame,resize,bakeShadow,setQuality,setShadows:on=>setQuality(on?0:2),get time(){return tick},get quality(){return quality},get shadowOK(){return sun.shadowEnabled!==false},get stats(){return{engine:'Babylon.js '+B.Engine.Version,webGL:engine.webGLVersion,drawCalls:engine._drawCalls?.current??0,activeMeshes:scene.getActiveMeshes().length,totalVertices:scene.getTotalVertices()}}};
}
