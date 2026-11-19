const angka=id=>{const v=parseFloat(document.getElementById(id).value.replace(',','.'));if(isNaN(v))throw new Error('Input harus berupa angka.');return v};
const peluang=id=>{const v=angka(id);if(v<0||v>1)throw new Error('Probabilitas harus di antara 0 dan 1.');return v};
const persen=id=>{const v=angka(id);if(v<0||v>100)throw new Error('Persentase harus di antara 0 dan 100.');return v/100};
const f=x=>(Math.round(x*10000)/10000).toString().replace('.',',');
const tampil=(id,html)=>{const e=document.getElementById(id);e.innerHTML=html;e.hidden=false};
function jalankan(galatId,hasilId,fn){
  document.getElementById(galatId).textContent='';document.getElementById(hasilId).hidden=true;
  try{tampil(hasilId,fn())}catch(e){document.getElementById(galatId).textContent=e.message}
}

const menuBtn=document.getElementById('menuBtn'),navLinks=document.getElementById('navLinks');
menuBtn?.addEventListener('click',()=>{const open=navLinks.classList.toggle('open');menuBtn.setAttribute('aria-expanded',open)});
document.querySelectorAll('.nav-links a').forEach(a=>a.addEventListener('click',()=>{navLinks.classList.remove('open');menuBtn.setAttribute('aria-expanded','false')}));
document.querySelectorAll('.hitung').forEach(b=>b.addEventListener('mousedown',()=>b.classList.add('pressed')));
document.querySelectorAll('.hitung').forEach(b=>b.addEventListener('mouseup',()=>b.classList.remove('pressed')));


document.querySelectorAll('.tab button').forEach(b=>b.addEventListener('click',()=>{
  document.querySelectorAll('.tab button').forEach(x=>x.classList.toggle('aktif',x===b));
  ['dasar','bersyarat','bayes'].forEach(t=>document.getElementById(t).hidden=(t!==b.dataset.tab));
}));

function hitungKomplemen(pA,pB){
  return 'P(A) = '+f(pA)+'<br>P(A\') = 1 − P(A) = '+f(1-pA)+'<br>P(B) = '+f(pB)+'; P(B\') = '+f(1-pB);
}

function hitungGabungan(pA,pB,relasi,pAB){
  let irisan;
  if(relasi==='lepas')irisan=0;
  else if(relasi==='independen')irisan=pA*pB;
  else irisan=pAB;
  if(irisan>Math.min(pA,pB)+1e-12)throw new Error('P(A ∩ B) tidak boleh melebihi P(A) atau P(B).');
  const gabungan=pA+pB-irisan;
  if(gabungan>1+1e-12)throw new Error('P(A ∪ B) melebihi 1, periksa kembali input.');
  const lepas=Math.abs(irisan)<1e-12, independen=Math.abs(irisan-pA*pB)<1e-12;
  return 'P(A ∩ B) = '+f(irisan)+'<br>P(A ∪ B) = P(A) + P(B) − P(A ∩ B) = '+f(gabungan)+
    '<br>Saling lepas: <b>'+(lepas?'Ya':'Tidak')+'</b> (P(A ∩ B) = 0)<br>Independen: <b>'+(independen?'Ya':'Tidak')+
    '</b> (P(A ∩ B) = P(A)·P(B) = '+f(pA*pB)+')';
}
document.getElementById('relasi').addEventListener('change',e=>{document.getElementById('kotakIrisan').hidden=e.target.value!=='umum'});
document.getElementById('btnDasar').addEventListener('click',()=>jalankan('galatDasar','hasilDasar',()=>{
  const pA=peluang('pA'),pB=peluang('pB'),r=document.getElementById('relasi').value;
  const pAB=r==='umum'?peluang('pAB'):0;
  return hitungKomplemen(pA,pB)+'<br><br>'+hitungGabungan(pA,pB,r,pAB);
}));

function hitungBersyarat(pAB,pB){
  if(pB===0)throw new Error('P(B) tidak boleh 0.');
  if(pAB>pB)throw new Error('P(A ∩ B) tidak boleh lebih besar dari P(B).');
  const hasil=pAB/pB;
  return 'P(A|B) = P(A ∩ B) / P(B) = '+f(pAB)+' / '+f(pB)+' = <b>'+f(hasil)+'</b> ('+f(hasil*100)+'%)'+
    '<br>Interpretasi: jika B sudah terjadi, peluang A terjadi adalah '+f(hasil*100)+'%.';
}
document.getElementById('btnBersyarat').addEventListener('click',()=>jalankan('galatBersyarat','hasilBersyarat',()=>hitungBersyarat(peluang('cAB'),peluang('cB'))));

function hitungBayes(prev,sens,fp){
  const ditandai=sens*prev+fp*(1-prev);
  if(ditandai===0)throw new Error('P(ditandai) = 0, posterior tidak dapat dihitung.');
  const posterior=sens*prev/ditandai;
  return {ditandai,posterior,prev,sens,fp};
}

function interpretasi(h){
  const sisa=1-h.posterior;
  return 'P(ditandai) = P(T|P)·P(P) + P(T|P\')·P(P\') = '+f(h.sens)+'·'+f(h.prev)+' + '+f(h.fp)+'·'+f(1-h.prev)+' = <b>'+f(h.ditandai)+'</b> ('+f(h.ditandai*100)+'%)'+
    '<br>P(phishing|ditandai) = P(T|P)·P(P) / P(ditandai) = '+f(h.sens*h.prev)+' / '+f(h.ditandai)+' = <b>'+f(h.posterior)+'</b> ('+f(h.posterior*100)+'%)'+
    '<br><br>Interpretasi: dari seluruh email yang ditandai sistem, sekitar '+f(h.posterior*100)+'% benar-benar phishing dan sekitar '+f(sisa*100)+'% adalah email sah yang salah ditandai. '+
    'Meskipun sensitivitas tinggi, hasilnya dipengaruhi prevalensi phishing yang rendah.';
}
document.getElementById('btnBayes').addEventListener('click',()=>jalankan('galatBayes','hasilBayes',()=>interpretasi(hitungBayes(persen('prev'),persen('sens'),persen('fp')))));
function setChart(a,b,ab){[['barA','valA',a],['barB','valB',b],['barAB','valAB',ab]].forEach(([bar,val,n])=>{const pct=Math.max(2,Math.min(100,n*100));document.getElementById(bar).style.height=pct+'%';document.getElementById(val).textContent=Math.round(pct)+'%'})}
document.getElementById('btnDasar').addEventListener('click',()=>{try{const pa=peluang('pA'),pb=peluang('pB'),r=document.getElementById('relasi').value;const ab=r==='lepas'?0:r==='independen'?pa*pb:peluang('pAB');setChart(pa,pb,ab)}catch(e){}});
document.getElementById('btnBersyarat').addEventListener('click',()=>{try{const ab=peluang('cAB'),b=peluang('cB');setChart(ab/b,b,ab)}catch(e){}});
document.getElementById('btnBayes').addEventListener('click',()=>{try{const h=hitungBayes(persen('prev'),persen('sens'),persen('fp'));setChart(h.prev,h.ditandai,h.posterior)}catch(e){}});