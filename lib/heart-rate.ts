import type { HeartSummary } from './pulse';

// Bluetooth Heart Rate Service 1.0: flags byte followed by an 8- or 16-bit BPM value.
export function parseHeartRate(value:DataView):{bpm:number;contact:boolean|null}|null {
 if(value.byteLength<2)return null;
 const flags=value.getUint8(0),wide=!!(flags&1),contactSupported=!!(flags&4);
 if(wide&&value.byteLength<3)return null;
 let cursor=wide?3:2;
 if(flags&8){if(value.byteLength<cursor+2)return null;cursor+=2;}
 if(flags&16){if(value.byteLength<cursor+2||(value.byteLength-cursor)%2!==0)return null;}
 const bpm=wide?value.getUint16(1,true):value.getUint8(1);
 if(!bpm)return null;
 return {bpm,contact:contactSupported?!!(flags&2):null};
}
export class HeartAccumulator {
 private count=0;private sum=0;private low=Infinity;private high=0;
 add(bpm:number){if(!Number.isInteger(bpm)||bpm<1||bpm>65535||this.count>=72000)return;this.count++;this.sum+=bpm;this.low=Math.min(this.low,bpm);this.high=Math.max(this.high,bpm);}
 reset(){this.count=0;this.sum=0;this.low=Infinity;this.high=0;}
 summary():HeartSummary|null{return this.count?{average:Math.round(this.sum/this.count),min:this.low,max:this.high,samples:this.count}:null;}
}
type Characteristic=EventTarget&{value?:DataView;startNotifications:()=>Promise<Characteristic>;stopNotifications:()=>Promise<Characteristic>};
type Gatt={connected:boolean;connect:()=>Promise<Gatt>;disconnect:()=>void;getPrimaryService:(name:string)=>Promise<{getCharacteristic:(name:string)=>Promise<Characteristic>}>};
type Device=EventTarget&{name?:string;gatt?:Gatt};
type Bluetooth={requestDevice:(options:{filters:{services:string[]}[]})=>Promise<Device>};
export type HeartState={phase:'unsupported'|'off'|'connecting'|'connected'|'stale';bpm:number|null;name:string;message:string};
export function bluetoothAvailable(){return typeof navigator!=='undefined'&&!!(navigator as Navigator&{bluetooth?:Bluetooth}).bluetooth;}
export class HeartMonitor {
 private device:Device|null=null;private characteristic:Characteristic|null=null;private timer:ReturnType<typeof setInterval>|undefined;private lastSample=0;private generation=0;
 state:HeartState={phase:bluetoothAvailable()?'off':'unsupported',bpm:null,name:'',message:''};
 constructor(private onState:(s:HeartState)=>void,private onSample:(bpm:number|null)=>void){}
 private publish(p:Partial<HeartState>){this.state={...this.state,...p};this.onState({...this.state});}
 private notification=()=>{const measurement=this.characteristic?.value&&parseHeartRate(this.characteristic.value);if(!measurement||measurement.contact===false){this.publish({bpm:null,message:measurement?.contact===false?'Adjust the sensor contact.':'Waiting for a valid reading.'});this.onSample(null);return;}this.lastSample=Date.now();this.publish({phase:'connected',bpm:measurement.bpm,message:'Live sensor reading'});this.onSample(measurement.bpm);};
 private lost=()=>{this.disconnect();this.publish({message:'Monitor disconnected. You can reconnect when ready.'});};
 async connect(){
  const bluetooth=(navigator as Navigator&{bluetooth?:Bluetooth}).bluetooth;
  if(!bluetooth){this.publish({phase:'unsupported',message:'This browser does not expose Bluetooth monitors.'});return;}
  this.disconnect();const generation=++this.generation;this.publish({phase:'connecting',message:'Choose a standard Bluetooth heart-rate monitor.'});
  try{
   // Keep requestDevice directly inside the button gesture; do not await before it.
   const device=await bluetooth.requestDevice({filters:[{services:['heart_rate']}]});
   if(generation!==this.generation)return;
   if(!device.gatt)throw new Error('This monitor does not provide a Bluetooth GATT connection.');
   this.device=device;device.addEventListener('gattserverdisconnected',this.lost);
   const server=await device.gatt.connect();if(generation!==this.generation){device.gatt.disconnect();return;}
   const service=await server.getPrimaryService('heart_rate');if(generation!==this.generation)return;
   const characteristic=await service.getCharacteristic('heart_rate_measurement');if(generation!==this.generation)return;
   this.characteristic=characteristic;characteristic.addEventListener('characteristicvaluechanged',this.notification);await characteristic.startNotifications();if(generation!==this.generation){void characteristic.stopNotifications().catch(()=>{});return;}
   this.lastSample=Date.now();this.publish({phase:'connected',name:device.name||'Heart-rate monitor',bpm:null,message:'Waiting for the first reading.'});
   this.timer=setInterval(()=>{if(Date.now()-this.lastSample>10000){this.publish({phase:'stale',bpm:null,message:'No recent reading. Check the monitor connection.'});this.onSample(null);}},2000);
  }catch(e){if(generation!==this.generation)return;this.disconnect();const name=e instanceof Error?e.name:'';this.publish({message:name==='NotFoundError'?'No monitor selected.':name==='SecurityError'?'Open the studio in its own HTTPS tab and allow Bluetooth access.':e instanceof Error?e.message:'The monitor could not connect.'});}
 }
 disconnect(){this.generation++;if(this.timer)clearInterval(this.timer);this.timer=undefined;this.characteristic?.removeEventListener('characteristicvaluechanged',this.notification);if(this.characteristic)void this.characteristic.stopNotifications().catch(()=>{});this.characteristic=null;this.device?.removeEventListener('gattserverdisconnected',this.lost);if(this.device?.gatt?.connected)this.device.gatt.disconnect();this.device=null;this.lastSample=0;this.onSample(null);this.publish({phase:bluetoothAvailable()?'off':'unsupported',bpm:null,name:'',message:''});}
 dispose(){this.disconnect();}
}
