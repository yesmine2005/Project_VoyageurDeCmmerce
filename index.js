

const canvas = document.getElementById('map');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
}
window.addEventListener('resize', () => { resizeCanvas(); draw(); });
resizeCanvas();

// UI
const nRange = document.getElementById('nRange');
const nLabel = document.getElementById('nLabel');
const algoSelect = document.getElementById('algoSelect');
const runBtn = document.getElementById('runBtn');
const rerunBtn = document.getElementById('rerunBtn');
const bubble = document.getElementById('bubble');
const bestDistEl = document.getElementById('bestDist');
const timeMs = document.getElementById('timeMs');
const pointStyle = document.getElementById('pointStyle');

// Params
const paramsGA = document.getElementById('paramsGA');
const paramsSA = document.getElementById('paramsSA');
const paramsTABU = document.getElementById('paramsTABU');

nLabel.textContent = nRange.value;
nRange.oninput = () => { nLabel.textContent = nRange.value; generateCities(); draw(); };

// UI visibility
algoSelect.onchange = () => {
  paramsGA.classList.add('hidden');
  paramsSA.classList.add('hidden');
  paramsTABU.classList.add('hidden');
  if (algoSelect.value === 'ga') paramsGA.classList.remove('hidden');
  if (algoSelect.value === 'sa') paramsSA.classList.remove('hidden');
  if (algoSelect.value === 'tabu') paramsTABU.classList.remove('hidden');
};

// Generate cities
let cities = [];
function generateCities() {
  const n = parseInt(nRange.value);
  cities = [];
  const m = 40;
  for (let i = 0; i < n; i++) {
    cities.push({
      x: m + Math.random() * (canvas.width - 2*m),
      y: m + Math.random() * (canvas.height - 2*m)
    });
  }
}
generateCities();

// Drawing
function draw(path = null) {
  ctx.clearRect(0,0,canvas.width,canvas.height);

  if (path) {
    ctx.beginPath();
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(155,91,255,0.95)';
    ctx.moveTo(cities[path[0]].x, cities[path[0]].y);
    for (let i = 1; i < path.length; i++) {
      ctx.lineTo(cities[path[i]].x, cities[path[i]].y);
    }
    ctx.closePath();
    ctx.stroke();
  }

  cities.forEach((c,i)=>{
    drawPoint(c.x, c.y, pointStyle.value);
    ctx.fillStyle = 'white';
    ctx.font = '12px Quicksand';
    ctx.fillText(i, c.x+8, c.y-8);
  });
}

function drawPoint(x,y,s) {
  ctx.save();
  if (s==='paw') {
    ctx.fillStyle = '#ff6fb5';
    ctx.beginPath(); ctx.ellipse(x,y+4,8,6,0,0,2*Math.PI); ctx.fill();
    ctx.fillStyle = '#ffd9ee';
    for (let dx of [-6,0,6]) {
      ctx.beginPath(); ctx.ellipse(x+dx,y-2,3.5,4,0,0,2*Math.PI); ctx.fill();
    }
  } else if (s==='heart') {
    ctx.fillStyle = '#ff4da6';
    drawHeart(x,y,8);
  } else if (s==='star') {
    ctx.fillStyle = '#ffd86b';
    drawStar(x,y,7,5);
  } else {
    ctx.fillStyle = '#ff9ad6';
    drawFlower(x,y,7);
  }
  ctx.restore();
}

function drawHeart(x,y,r){
  ctx.beginPath();
  ctx.moveTo(x,y);
  ctx.bezierCurveTo(x,y-r/2,x-r,y-r/2,x-r,y+r/6);
  ctx.bezierCurveTo(x-r,y+r,x,y+r,x,y+r*1.4);
  ctx.bezierCurveTo(x,y+r,x+r,y+r,x+r,y+r/6);
  ctx.bezierCurveTo(x+r,y-r/2,x,y-r/2,x,y);
  ctx.fill();
}
function drawStar(x,y,r,p){
  let rot = Math.PI/2*3, step = Math.PI/p;
  ctx.beginPath(); ctx.moveTo(x,y-r);
  for(let i=0;i<p;i++){
    ctx.lineTo(x+Math.cos(rot)*r, y+Math.sin(rot)*r);
    rot += step;
    ctx.lineTo(x+Math.cos(rot)*(r/2), y+Math.sin(rot)*(r/2));
    rot += step;
  }
  ctx.closePath(); ctx.fill();
}
function drawFlower(x,y,r){
  for(let i=0;i<6;i++){
    ctx.beginPath();
    ctx.ellipse(x+Math.cos(i*Math.PI/3)*r,y+Math.sin(i*Math.PI/3)*r,r*0.6,r,0,0,2*Math.PI);
    ctx.fill();
  }
  ctx.fillStyle='#fff';
  ctx.beginPath(); ctx.arc(x,y, r*0.5,0,2*Math.PI); ctx.fill();
}

// TSP Utilities
function dist(a,b){ return Math.hypot(a.x-b.x, a.y-b.y); }
function totalDistance(arr){
  let d=0;
  for(let i=0;i<arr.length-1;i++) d+=dist(cities[arr[i]], cities[arr[i+1]]);
  return d + dist(cities[arr.at(-1)], cities[arr[0]]);
}

// Simulated Annealing
function randomPair(n){
  let i=Math.floor(Math.random()*n), j;
  do j=Math.floor(Math.random()*n); while(j===i);
  return [i,j];
}
function simulatedAnnealing(T0,alpha,Tmin){
  let n=cities.length;
  let sol=[...Array(n).keys()].sort(()=>Math.random()-0.5);
  let best=sol.slice(), bestD=totalDistance(sol), T=T0;
  while(T>Tmin){
    let [i,j]=randomPair(n);
    let nb=sol.slice();
    [nb[i],nb[j]]=[nb[j],nb[i]];
    let dS=totalDistance(sol), dN=totalDistance(nb);
    if(dN<dS || Math.random()<Math.exp((dS-dN)/T)) sol=nb;
    if(totalDistance(sol)<bestD){ best=sol.slice(); bestD=totalDistance(sol); }
    T*=alpha;
  }
  return {best,bestD};
}

// Tabu
function tabuSearch(iter,size){
  const n=cities.length;
  let sol=[...Array(n).keys()].sort(()=>Math.random()-0.5);
  let best=sol.slice(), bestD=totalDistance(sol);
  let tabu=[];
  for(let t=0;t<iter;t++){
    let cand=[];
    for(let i=0;i<n;i++)for(let j=i+1;j<n;j++){
      let nb=sol.slice(); [nb[i],nb[j]]=[nb[j],nb[i]];
      cand.push({sol:nb, move:[i,j], d:totalDistance(nb)});
    }
    cand.sort((a,b)=>a.d-b.d);
    let c=cand.find(x=>!tabu.includes(x.move.join('-')) || x.d<bestD) || cand[0];
    sol=c.sol.slice();
    tabu.push(c.move.join('-'));
    if(tabu.length>size) tabu.shift();
    if(c.d<bestD){best=sol.slice(); bestD=c.d;}
  }
  return {best,bestD};
}

// GA components
function tournament(pop,k){
  let best=null;
  for(let i=0;i<k;i++){
    let ind=pop[Math.floor(Math.random()*pop.length)];
    if(!best || totalDistance(ind)<totalDistance(best)) best=ind;
  }
  return best;
}
function roulette(pop){
  let fit=pop.map(p=>1/(totalDistance(p)+1e-9));
  let sum=fit.reduce((a,b)=>a+b,0), r=Math.random(), cum=0;
  for(let i=0;i<fit.length;i++){
    cum+=fit[i]/sum; if(r<=cum) return pop[i];
  }
  return pop.at(-1);
}


function crossover(p1,p2,mode){
  const n=p1.length;
  if(mode==='1point'){
    let cut=Math.floor(Math.random()*n);
    let child=Array(n).fill(null);
    for(let i=0;i<cut;i++) child[i]=p1[i];
    let idx=cut;
    for(let i=0;i<n;i++){
      if(!child.includes(p2[i])) child[idx++]=p2[i];
    }
    return child;
  }
  if(mode==='2points'){
    let a=Math.floor(Math.random()*n), b=Math.floor(Math.random()*n);
    if(a>b)[a,b]=[b,a];
    let child=p1.slice(a,b);
    for(let i=0;i<n;i++){
      if(!child.includes(p2[i])) child.push(p2[i]);
    }
    return child;
  }
  // Uniform
  let child=[];
  for(let i=0;i<n;i++){
    child.push(Math.random()<0.5?p1[i]:p2[i]);
  }
  return repair(child);
}
function repair(c){
  const n=c.length, seen=new Set(), miss=[];
  for(let i=0;i<n;i++){
    if(seen.has(c[i])) c[i]=null;
    else seen.add(c[i]);
  }
  for(let i=0;i<n;i++) if(!seen.has(i)) miss.push(i);
  let k=0;
  for(let i=0;i<n;i++) if(c[i]===null) c[i]=miss[k++];
  return c;
}
function mutateSwap(c){
  let i=Math.floor(Math.random()*c.length), j;
  do j=Math.floor(Math.random()*c.length); while(i===j);
  [c[i],c[j]]=[c[j],c[i]];
  return c;
}
function geneticAlgorithm(o){
  const n=cities.length;
  let pop=[...Array(o.pop).keys()].map(()=>[...Array(n).keys()].sort(()=>Math.random()-0.5));
  let best=pop[0], bestD=totalDistance(best);
  for(let g=0;g<o.gens;g++){
    pop.sort((a,b)=>totalDistance(a)-totalDistance(b));
    if(totalDistance(pop[0])<bestD){best=pop[0].slice();bestD=totalDistance(best);}
    let newPop=pop.slice(0,o.elit).map(x=>x.slice());
    while(newPop.length<o.pop){
      let p1=(o.sel==='tournoi')?tournament(pop,3):roulette(pop);
      let p2=(o.sel==='tournoi')?tournament(pop,3):roulette(pop);
      let c=crossover(p1,p2,o.xover);
      if(Math.random()<o.mut) c=mutateSwap(c);
      newPop.push(c);
    }
    pop=newPop;
  }
  return {best,bestD};
}

// Run
runBtn.onclick = ()=> run();
rerunBtn.onclick = ()=>{ generateCities(); draw(); };

function run(){
  bestDistEl.textContent='...';
  timeMs.textContent='...';
  bubble.textContent='⏳ Je cherche le meilleur chemin...';

  const t0=performance.now();
  let res;
  const alg=algoSelect.value;

  if(alg==='sa'){
    res=simulatedAnnealing(
      +document.getElementById('saT0').value,
      +document.getElementById('saAlpha').value,
      +document.getElementById('saTmin').value
    );
  }
  else if(alg==='tabu'){
    res=tabuSearch(
      +document.getElementById('tabuIter').value,
      +document.getElementById('tabuSize').value
    );
  }
  else {
    res=geneticAlgorithm({
      pop:+document.getElementById('gaPop').value,
      gens:+document.getElementById('gaGen').value,
      mut:+document.getElementById('gaMut').value,
      elit:+document.getElementById('gaElite').value,
      sel:document.getElementById('gaSelect').value,
      xover:document.getElementById('gaXover').value
    });
  }

  const dt=Math.round(performance.now()-t0);
  draw(res.best);
  bestDistEl.textContent=res.bestD.toFixed(1);
  timeMs.textContent=dt;
  bubble.textContent='✨ Terminé ! C EST BIEN';
}

draw();
