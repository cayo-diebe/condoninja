import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const require=createRequire(path.join(root,'../package.json'));
const config=path.join(root,'12_Developer/fontconfig.xml');
await fs.writeFile(config,`<?xml version="1.0"?><!DOCTYPE fontconfig SYSTEM "urn:fontconfig:fonts.dtd"><fontconfig><dir>${root}/04_Typography/fonts</dir><dir>/usr/share/fonts</dir><cachedir>/tmp/condo-ninja-v2-fontcache</cachedir></fontconfig>`);
process.env.FONTCONFIG_FILE=config;
const sharp=require('sharp');
const files=JSON.parse(await fs.readFile(path.join(root,'12_Developer/template-renders.json'),'utf8'));
for(const file of files){await sharp(path.join(root,file)).png().toFile(path.join(root,file.replace(/\.svg$/,'.png')));}
console.log(`Rendered ${files.length} templates and seals.`);
const icons=path.join(root,'05_Iconography/individual-icons');
const previews=path.join(root,'05_Iconography/preview');
await fs.mkdir(previews,{recursive:true});
for(const file of await fs.readdir(icons)){
  if(file.endsWith('.svg')) await sharp(path.join(icons,file)).resize(96,96).png().toFile(path.join(previews,file.replace(/\.svg$/,'.png')));
}
