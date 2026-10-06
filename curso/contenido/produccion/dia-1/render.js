const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1920,height:1080}});
await p.goto('file://'+__dirname+'/slides.html');await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(800);
const fs=require('fs');fs.mkdirSync(__dirname+'/png',{recursive:true});
for(let i=1;i<=12;i++){await (await p.$('#s'+i)).screenshot({path:`${__dirname}/png/${String(i).padStart(2,'0')}.png`});}
console.log(await p.evaluate(()=>[...document.fonts].filter(f=>f.status==='loaded').map(f=>f.family).join(',')));await b.close();})();
