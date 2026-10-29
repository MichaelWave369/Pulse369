export const STAGE_LIMITS:Readonly<{width:number;height:number;depth:number;centerY:number;centerZ:number}>;
export function fitWorldBackdrop(bounds:{min:number[];max:number[]}):{
  scale:number;offset:[number,number,number];maxZ:number;width:number;height:number;depth:number;
};
