function ambilData(){
  const teks=document.getElementById('dataManual').value;
  const potongan=teks.split(/[\s,;]+/).filter(x=>x!=='');
  const angka=potongan.map(Number);
  if(!angka.length) throw new Error('Data masih kosong. Masukkan angka terlebih dahulu.');
  if(angka.some(isNaN)) throw new Error('Ada data yang bukan angka. Periksa kembali input.');
  return angka.sort((a,b)=>a-b);
}
document.getElementById('fileCsv').addEventListener('change',e=>{
  const f=e.target.files[0];if(!f)return;
  const pembaca=new FileReader();
  pembaca.onload=()=>document.getElementById('dataManual').value=pembaca.result.replace(/[^\d.\-eE,;\s]/g,' ');
  pembaca.readAsText(f);
});

function hitungDasar(d){
  const n=d.length,total=d.reduce((a,b)=>a+b,0),mean=total/n;
  const median=n%2?d[(n-1)/2]: (d[n/2-1]+d[n/2])/2;
  const frek={};d.forEach(x=>frek[x]=(frek[x]||0)+1);
  const fmaks=Math.max(...Object.values(frek));
  const modus=fmaks===1?'Tidak ada modus':Object.keys(frek).filter(k=>frek[k]===fmaks).join(', ')+' (muncul '+fmaks+'x)';
  return{n,total,mean,median,modus,min:d[0],maks:d[n-1]};
}

function hitungDispersi(d,mean){
  const n=d.length,jk=d.reduce((a,x)=>a+(x-mean)**2,0),varians=n>1?jk/(n-1):0;
  return{range:d[n-1]-d[0],varians,sd:Math.sqrt(varians)};
}

function medianDari(a){const m=a.length;return m%2?a[(m-1)/2]: (a[m/2-1]+a[m/2])/2}
function hitungKuartil(d){
  const tengah=Math.floor(d.length/2),bawah=d.slice(0,tengah),atas=d.slice(d.length%2?tengah+1:tengah);
  const q1=bawah.length?medianDari(bawah):d[0],q3=atas.length?medianDari(atas):d[d.length-1];
  const iqr=q3-q1,batasBawah=q1-1.5*iqr,batasAtas=q3+1.5*iqr;
  const outlier=d.filter(x=>x<batasBawah||x>batasAtas);
  return{q1,q3,iqr,batasBawah,batasAtas,outlier};
}

function gambarHistogram(d){
  const c=document.getElementById('grafik');if(!c)return;
  const g=c.getContext('2d'),rect=c.parentElement.getBoundingClientRect(),dpr=window.devicePixelRatio||1;
  c.width=Math.max(300,rect.width)*dpr;c.height=Math.round(rect.height)*dpr;g.setTransform(dpr,0,0,dpr,0,0);
  const w=c.width/dpr,h=c.height/dpr,gutter=w<500?34:48,bottom=h-34,plotH=h-58;
  g.clearRect(0,0,w,h);g.textBaseline='middle';
  const k=Math.max(1,Math.ceil(1+3.322*Math.log10(d.length))),mn=d[0],mx=d[d.length-1],lebar=(mx-mn)/k||1;
  const bin=new Array(k).fill(0);d.forEach(x=>bin[Math.min(k-1,Math.floor((x-mn)/lebar))]++);
  const fm=Math.max(...bin),bw=(w-gutter-10)/k;
  g.font=(w<500?9:11)+'px Segoe UI';g.textAlign='center';
  bin.forEach((f,i)=>{
    const bh=f/fm*plotH,x=gutter+i*bw,grad=g.createLinearGradient(0,bottom-bh,0,bottom);
    grad.addColorStop(0,'#65d8e9');grad.addColorStop(1,'#586fe0');g.fillStyle=grad;
    g.beginPath();g.roundRect(x+2,bottom-bh,Math.max(2,bw-5),bh,Math.min(5,bw/4));g.fill();
    g.fillStyle='#b9c7e6';g.fillText(f,x+bw/2,bottom-bh-9);
    g.fillText((mn+i*lebar).toFixed(1),x+bw/2,bottom+15);
  });
  g.strokeStyle='rgba(169,189,238,.22)';g.beginPath();g.moveTo(gutter,bottom);g.lineTo(w-6,bottom);g.stroke();
  g.fillStyle='#899bbd';g.textAlign='left';g.fillText('Frekuensi',6,12);
}
let dataTerakhir=null;
window.addEventListener('resize',()=>{if(dataTerakhir)gambarHistogram(dataTerakhir)});

const fmt=x=>typeof x==='number'?(Math.round(x*10000)/10000).toString():x;
function tampilkan(baris){
  document.getElementById('isiTabel').innerHTML=baris.map((b,i)=>'<tr><td>'+ (i+1)+'</td><td>'+b[0]+'</td><td>'+fmt(b[1])+'</td></tr>').join('');
  document.getElementById('emptyState').hidden=true;document.getElementById('tabelWrap').hidden=false;
}
document.getElementById('btnHitung').addEventListener('click',()=>{
  const pesan=document.getElementById('pesan');pesan.textContent='';
  try{
    const d=ambilData(),a=hitungDasar(d),b=hitungDispersi(d,a.mean),q=hitungKuartil(d);
    tampilkan([['Jumlah data (n)',a.n],['Total nilai (Σx)',a.total],['Mean (rata-rata)',a.mean],['Median',a.median],['Modus',a.modus],['Nilai minimum',a.min],['Nilai maksimum',a.maks],['Range (jangkauan)',b.range],['Varians (sampel)',b.varians],['Standar deviasi',b.sd],['Kuartil 1 (Q1)',q.q1],['Kuartil 3 (Q3)',q.q3],['Interquartile Range (IQR)',q.iqr],['Outlier '+fmt(q.batasBawah)+' s.d. '+fmt(q.batasAtas),q.outlier.length?q.outlier.join(', '):'Tidak ada outlier']]);
    document.getElementById('quickN').textContent=a.n;document.getElementById('quickMean').textContent=fmt(a.mean);document.getElementById('quickSd').textContent=fmt(b.sd);document.getElementById('quickStatus').textContent='Selesai';
    dataTerakhir=d;gambarHistogram(d);document.getElementById('hasil').scrollIntoView({behavior:'smooth',block:'nearest'});
  }catch(err){pesan.textContent=err.message}
});
document.getElementById('btnContoh').addEventListener('click',()=>document.getElementById('dataManual').value='70 85 90 65 85 100 40 78 82 85 95 20');
document.getElementById('btnReset').addEventListener('click',()=>{
  document.getElementById('dataManual').value='';document.getElementById('fileCsv').value='';document.getElementById('pesan').textContent='';
  document.getElementById('emptyState').hidden=false;document.getElementById('tabelWrap').hidden=true;document.getElementById('isiTabel').innerHTML='';
  document.getElementById('quickN').textContent='—';document.getElementById('quickMean').textContent='—';document.getElementById('quickSd').textContent='—';document.getElementById('quickStatus').textContent='Siap';dataTerakhir=null;
});
const menu=document.getElementById('menuBtn'),nav=document.getElementById('navMenu');
menu.addEventListener('click',()=>{const open=nav.classList.toggle('open');menu.classList.toggle('open',open);menu.setAttribute('aria-expanded',open)});
nav.addEventListener('click',()=>{nav.classList.remove('open');menu.classList.remove('open');menu.setAttribute('aria-expanded','false')});
