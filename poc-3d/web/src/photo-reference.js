export function photoReferenceSpec(trial){
 const src=trial?.referenceDataURL,crop=trial?.referenceCrop,size=trial?.photoSize;
 if(typeof src!=='string'||src.length>25_000_000||!/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(src))return null;
 if(!Array.isArray(size)||size.length!==2||!size.every(v=>Number.isFinite(v)&&v>0))return null;
 if(!Array.isArray(crop)||crop.length!==4||!crop.every(Number.isFinite)||crop[0]<0||crop[1]<0||crop[2]<=0||crop[3]<=0||crop[0]+crop[2]>size[0]||crop[1]+crop[3]>size[1])return null;
 return {src,crop,size};
}
