export function fillOpticalMapSettings(e,t,n,r){e[t]=n?.width??0,e[t+1]=n?.height??0;let i=r?.addressModeU===`repeat`?1:r?.addressModeU===`mirror-repeat`?2:0,a=r?.addressModeV===`repeat`?1:r?.addressModeV===`mirror-repeat`?2:0;e[t+2]=i+a*3,e[t+3]=(r?.minFilter===`nearest`?0:1)+(r?.magFilter===`nearest`?0:2)}
//# sourceMappingURL=optical-maps.js.map
