import test from 'node:test';
import assert from 'node:assert/strict';
import {guideStep} from '../assets/js/tilt-guide.js';
test('guide only offers calibration after live data and completes after successful calibration',()=>{
 const input={mode:'joystick',tiltPending:false,raw:null,lastValid:0,now:()=>100};
 assert.equal(guideStep(input,false),1);input.tiltPending=true;assert.equal(guideStep(input,false),1);
 input.tiltPending=false;input.mode='tilt';assert.equal(guideStep(input,false),2);
 input.raw={x:0,y:0};assert.equal(guideStep(input,false),3);assert.equal(guideStep(input,true),4);
 input.now=()=>2100;assert.equal(guideStep(input,true),2);
 input.raw=null;assert.equal(guideStep(input,true),2);
});
