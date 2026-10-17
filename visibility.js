// One visibility owner for static placed assets. Checks are throttled and use hysteresis.
export function buildSceneryVisibility(items){
 const records=items.filter(a=>!a.root.isDisposed()).map(a=>{for(const n of [a.root,...a.root.getDescendants()]){n.computeWorldMatrix?.(true);n.freezeWorldMatrix?.();}return{...a,small:/grass|fern|flower|moss|periwinkle|nettle|weed|iceplant/.test(a.id),tree:/tree|sapling/.test(a.id)};});let next=0;
 return{update(eye,quality){if(performance.now()<next)return;next=performance.now()+250;for(const r of records){const range=r.root.metadata?.distantScenery?620:r.small?(quality===2?32:72):r.tree?245:420,enabled=r.root.isEnabled(),visible=Math.hypot(eye.x-r.x,eye.z-r.z)<range+(enabled?18:0);if(visible!==enabled)r.root.setEnabled(visible);}},report:{count:records.length,treeRange:245,detailRange:72,interval:250}};
}
