import { randomInt } from 'node:crypto';

export function deck() {
  const cards = [];
  for (const suit of ['S', 'H', 'D', 'C'])
    for (let rank = 2; rank <= 14; rank++) cards.push({ rank, suit });
  for (let i = cards.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}

export function evaluate(cards) {
  if (cards.length !== 5 || new Set(cards.map(c => `${c.rank}${c.suit}`)).size !== 5 ||
      cards.some(c => !Number.isInteger(c.rank) || c.rank < 2 || c.rank > 14 || !['S','H','D','C'].includes(c.suit)))
    throw new Error('Expected five unique valid cards');
  const ranks = cards.map(c => c.rank).sort((a,b) => b-a);
  const counts = ranks.reduce((a,r) => { a[r] = (a[r] || 0)+1; return a; }, {});
  const groups = Object.entries(counts).map(([r,n]) => [n,Number(r)]).sort((a,b) => b[0]-a[0] || b[1]-a[1]);
  const flush = cards.every(c => c.suit === cards[0].suit);
  const unique = [...new Set(ranks)];
  const wheel = unique.join(',') === '14,5,4,3,2';
  const straight = unique.length === 5 && (ranks[0]-ranks[4] === 4 || wheel);
  const high = wheel ? 5 : ranks[0];
  let category, label, kickers;
  if (straight && flush) { category=8; label=high===14?'Royal flush':'Straight flush'; kickers=[high]; }
  else if (groups[0][0]===4) { category=7; label='Four of a kind'; }
  else if (groups[0][0]===3 && groups[1][0]===2) { category=6; label='Full house'; }
  else if (flush) { category=5; label='Flush'; kickers=ranks; }
  else if (straight) { category=4; label='Straight'; kickers=[high]; }
  else if (groups[0][0]===3) { category=3; label='Three of a kind'; }
  else if (groups[0][0]===2 && groups[1][0]===2) { category=2; label='Two pair'; }
  else if (groups[0][0]===2) { category=1; label='One pair'; }
  else { category=0; label='High card'; kickers=ranks; }
  return { category, label, kickers: kickers || groups.map(g => g[1]) };
}

export function compare(a,b) {
  const left=evaluate(a), right=evaluate(b);
  const x=[left.category,...left.kickers], y=[right.category,...right.kickers];
  for (let i=0;i<x.length;i++) if (x[i]!==y[i]) return Math.sign(x[i]-y[i]);
  return 0;
}
