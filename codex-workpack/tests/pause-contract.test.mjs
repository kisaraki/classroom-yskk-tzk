import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const contract=JSON.parse(readFileSync(new URL('../contracts/state-machine.json',import.meta.url),'utf8'));
// Execute the declarative contract only. This is not a game/runtime acceptance test.
function dispatch(context,event) {
  const matches=contract.transitions.filter(t=>t.from===context.state && t.event===event &&
    Object.entries(t.when || {}).every(([key,value])=>context[key]===value));
  assert.ok(matches.length<=1,'ambiguous transition');
  return matches.length ? {...context,...matches[0].set,state:matches[0].to} : context;
}
for (const state of ['READY','PLAYING','IDIOM_CLEAR']) test(`${state}: background freezes and manual resume returns to original state`,()=>{
  const initial={...contract.pausePolicy.context,state,readyCountdownRemaining:1.5,idiomFeedbackRemaining:0.4,
    remainingSeconds:20,nextIndex:2,worldPositions:[10,20],worldVelocities:[3,4]};
  let ctx=dispatch({...initial,pageVisible:false},'PAUSE_OR_BACKGROUND');
  assert.equal(ctx.state,'PAUSED'); assert.equal(ctx.resumeState,state);
  for (const field of contract.pausePolicy.preserved) assert.deepEqual(ctx[field],initial[field]);
  for (const event of ['PAUSE_OR_BACKGROUND','COUNTDOWN_DONE','NEXT_IDIOM','USER_RESUME']) {
    assert.deepEqual(dispatch(ctx,event),ctx);
  }
  ctx={...ctx,pageVisible:true,landscape:false}; assert.deepEqual(dispatch(ctx,'USER_RESUME'),ctx);
  ctx={...ctx,landscape:true}; assert.equal(ctx.state,'PAUSED');
  ctx=dispatch(ctx,'USER_RESUME'); assert.equal(ctx.state,state); assert.equal(ctx.resumeState,null);
  for (const field of contract.pausePolicy.preserved) assert.deepEqual(ctx[field],initial[field]);
});
test('hidden countdown and next-idiom events cannot enter PLAYING before pause is handled',()=>{
  for(const [state,event] of [['READY','COUNTDOWN_DONE'],['IDIOM_CLEAR','NEXT_IDIOM']]) {
    const ctx={...contract.pausePolicy.context,state,pageVisible:false};
    assert.deepEqual(dispatch(ctx,event),ctx);
  }
});
test('reset while paused clears the old return state',()=>{
  const ctx={...contract.pausePolicy.context,state:'PAUSED',resumeState:'IDIOM_CLEAR'};
  for(const event of ['RESTART_R_CONFIRMED','RETRY_A_CONFIRMED_AND_AVAILABLE']) {
    const next=dispatch(ctx,event); assert.equal(next.state,'READY'); assert.equal(next.resumeState,null);
  }
});
