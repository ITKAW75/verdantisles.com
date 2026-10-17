function normalize(v){const n=Math.hypot(...v)||1;return v.map(x=>x/n);}
function cross(a,b){return[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];}
export function geometry(){const data=[];return{data,material:0,
 tri(a,b,c,color){const n=normalize(cross(b.map((v,i)=>v-a[i]),c.map((v,i)=>v-a[i])));for(const v of[a,b,c])data.push(...v,...n,...color,this.material);},
 smoothTri(a,b,c,na,nb,nc,color){for(const [v,n] of[[a,na],[b,nb],[c,nc]])data.push(...v,...n,...color,this.material);},
 quad(a,b,c,d,color){this.tri(a,b,c,color);this.tri(a,c,d,color);},
 sphere(x,y,z,rx,ry,rz,color,segments=12,rings=8,smooth=true){for(let j=0;j<rings;j++)for(let i=0;i<segments;i++){const point=(u,v)=>{const t=v/rings*Math.PI,p=u/segments*Math.PI*2;return[x+Math.sin(t)*Math.cos(p)*rx,y+Math.cos(t)*ry,z+Math.sin(t)*Math.sin(p)*rz];};const normal=p=>normalize([(p[0]-x)/(rx*rx),(p[1]-y)/(ry*ry),(p[2]-z)/(rz*rz)]);const a=point(i,j),b=point(i+1,j),c=point(i+1,j+1),d=point(i,j+1);if(smooth){this.smoothTri(a,b,c,normal(a),normal(b),normal(c),color);this.smoothTri(a,c,d,normal(a),normal(c),normal(d),color);}else this.quad(a,b,c,d,color);}},
 branch(a,b,r1,r2,color,segments=9){const axis=normalize(b.map((v,i)=>v-a[i])),side=normalize(cross(axis,Math.abs(axis[1])>.9?[1,0,0]:[0,1,0])),up=cross(axis,side);const point=(p,r,i)=>p.map((v,k)=>v+r*(side[k]*Math.cos(i/segments*Math.PI*2)+up[k]*Math.sin(i/segments*Math.PI*2)));for(let i=0;i<segments;i++)this.quad(point(a,r1,i),point(a,r1,i+1),point(b,r2,i+1),point(b,r2,i),color);},
 disk(x,y,z,rx,rz,color,segments=28){for(let i=0;i<segments;i++){const a=i/segments*Math.PI*2,b=(i+1)/segments*Math.PI*2;this.tri([x,y,z],[x+Math.cos(b)*rx,y,z+Math.sin(b)*rz],[x+Math.cos(a)*rx,y,z+Math.sin(a)*rz],color);}},
 box(x,y,z,w,h,d,color){const a=[x-w/2,y,z-d/2],b=[x+w/2,y,z-d/2],c=[x+w/2,y,z+d/2],e=[x-w/2,y,z+d/2],f=a.map((v,i)=>i===1?v+h:v),g=b.map((v,i)=>i===1?v+h:v),k=c.map((v,i)=>i===1?v+h:v),l=e.map((v,i)=>i===1?v+h:v);this.quad(a,f,g,b,color);this.quad(b,g,k,c,color);this.quad(c,k,l,e,color);this.quad(e,l,f,a,color);this.quad(f,l,k,g,color);}
};}
