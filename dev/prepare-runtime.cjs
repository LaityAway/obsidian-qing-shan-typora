'use strict';
// Prepare only a disposable test vault/profile; never copy user notes or settings.
const fs=require('node:fs');
const path=require('node:path');
const base='/tmp/qs-audit-20261101';
const vault=path.join(base,'vault');
const profile=path.join(base,'profile');
const plugin=path.join(vault,'.obsidian/plugins/qing-shan-typora');
const config=path.join(profile,'obsidian.json');
if(fs.existsSync(config)){
 const current=JSON.parse(fs.readFileSync(config,'utf8'));
 if(Object.values(current.vaults||{}).some(v=>v.path!==vault))throw Error('Test profile contains a different vault; refusing to overwrite it.');
}
fs.mkdirSync(plugin,{recursive:true});fs.mkdirSync(profile,{recursive:true});
for(const name of ['main.js','styles.css','manifest.json'])fs.copyFileSync(path.join(__dirname,'..',name),path.join(plugin,name));
fs.writeFileSync(config,JSON.stringify({vaults:{audit:{path:vault,ts:Date.now(),open:true}}}));
fs.writeFileSync(path.join(vault,'.obsidian/community-plugins.json'),JSON.stringify(['qing-shan-typora']));
console.log('Prepared disposable vault: '+vault);
console.log('Start: /Applications/Obsidian.app/Contents/MacOS/Obsidian --user-data-dir='+profile+' --remote-debugging-port=19352');
console.log('Verify: QS_REQUIRE_RUNTIME=1 node --test dev/*.test.cjs');
