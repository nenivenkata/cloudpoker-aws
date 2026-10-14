import test from 'node:test';
import assert from 'node:assert/strict';
import {deck,evaluate,compare} from '../app/poker.js';
const hand=s=>s.split(' ').map(x=>({rank:Number(x.slice(0,-1)),suit:x.at(-1)}));
test('shuffle produces 52 unique valid cards',()=>{
  for(let i=0;i<50;i++) {
    const d=deck(); assert.equal(d.length,52); assert.equal(new Set(d.map(c=>`${c.rank}${c.suit}`)).size,52);
  }
});
const examples=[
 ['14S 13S 12S 11S 10S',8,'Royal flush'],
 ['9H 8H 7H 6H 5H',8,'Straight flush'],
 ['9S 9H 9D 9C 14S',7,'Four of a kind'],
 ['9S 9H 9D 8C 8S',6,'Full house'],
 ['14D 11D 8D 5D 2D',5,'Flush'],
 ['14S 5H 4D 3C 2S',4,'Straight'],
 ['9S 9H 9D 5C 2S',3,'Three of a kind'],
 ['9S 9H 5D 5C 2S',2,'Two pair'],
 ['9S 9H 6D 5C 2S',1,'One pair'],
 ['14S 11H 8D 5C 2S',0,'High card']
];
for(const [cards,category,label] of examples) test(label,()=>{
  assert.deepEqual([evaluate(hand(cards)).category,evaluate(hand(cards)).label],[category,label]);
});
test('wheel loses to a six-high straight',()=>assert.equal(compare(hand('14S 5H 4D 3C 2S'),hand('6S 5D 4C 3S 2H')),-1));
test('two pair uses high pair, low pair, then kicker',()=>{
  assert.equal(compare(hand('10S 10H 4D 4C 2S'),hand('9S 9H 8D 8C 14S')),1);
  assert.equal(compare(hand('10S 10H 4D 4C 2S'),hand('10D 10C 3D 3C 14S')),1);
  assert.equal(compare(hand('10S 10H 4D 4C 14S'),hand('10D 10C 4H 4S 13S')),1);
});
test('suits do not break ties',()=>assert.equal(compare(hand('14S 13S 12S 11S 10S'),hand('14H 13H 12H 11H 10H')),0));
test('duplicate and invalid cards are rejected',()=>{
  assert.throws(()=>evaluate(hand('14S 14S 12S 11S 10S')));
  assert.throws(()=>evaluate(hand('15S 13S 12S 11S 10S')));
});
