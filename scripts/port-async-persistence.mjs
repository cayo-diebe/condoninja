// One-time mechanical migration of persistence call sites; no UI text changes.
import ts from "typescript";
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import path from "node:path";

const dbText = readFileSync("lib/db.ts", "utf8");
const start = dbText.indexOf("const categorySeeds = [");
const end = dbText.indexOf("\n];", start) + 3;
if (start >= 0) {
  writeFileSync("lib/document-categories.ts", dbText.slice(start, end).replace("const categorySeeds", "export const categorySeeds") + "\n");
  writeFileSync("lib/db.ts", dbText.slice(0, start) + 'import { categorySeeds } from "./document-categories.ts";\n' + dbText.slice(end));
}
const repo = readFileSync("lib/repository.ts", "utf8");
const names = new Set([...repo.matchAll(/export function (\w+)/g)].map(m=>m[1]).filter(n=>!["normalizeEmail", "hashToken"].includes(n)));
["saveSignupLead", "saveAvatar", "getAvatar", "removeAvatar"].forEach(n=>names.add(n));
const walk = dir => readdirSync(dir, {withFileTypes:true}).flatMap(e => e.isDirectory() ? walk(path.join(dir,e.name)) : /\.tsx?$/.test(e.name) ? [path.join(dir,e.name)] : []);
for (const file of [...walk("lib"), ...walk("app"), ...walk("tests")]) {
  if (["lib/db.ts", "lib/document-categories.ts"].includes(file)) continue;
  const text = readFileSync(file,"utf8");
  const ast = ts.createSourceFile(file,text,ts.ScriptTarget.Latest,true,file.endsWith("tsx")?ts.ScriptKind.TSX:ts.ScriptKind.TS);
  const edits=[];
  const markAsync = fn => {
    if (fn.modifiers?.some(m=>m.kind===ts.SyntaxKind.AsyncKeyword)) return;
    const token = fn.getChildren(ast).find(c=>c.kind===ts.SyntaxKind.FunctionKeyword);
    const pos=token?token.getStart(ast):fn.getStart(ast);
    if (!edits.some(e=>e.start===pos&&e.value==="async ")) edits.push({start:pos,end:pos,value:"async "});
  };
  const visit = node => {
    if (ts.isFunctionDeclaration(node)&&names.has(node.name?.text)) {
      markAsync(node);
      if(node.type) edits.push({start:node.type.getStart(ast),end:node.type.end,value:`Promise<${node.type.getText(ast)}>`});
    }
    if(ts.isCallExpression(node)) {
      const expr=node.expression;
      const named=ts.isIdentifier(expr)&&names.has(expr.text);
      const dynamic=ts.isPropertyAccessExpression(expr)&&names.has(expr.name.text)&&expr.expression.getText(ast).includes("import(");
      const sql=ts.isPropertyAccessExpression(expr)&&["get","all","run"].includes(expr.name.text)&&expr.expression.getText(ast).includes(".prepare(");
      if((named||dynamic||sql)&&!ts.isAwaitExpression(node.parent)) {
        edits.push({start:node.getStart(ast),end:node.getStart(ast),value:"(await "},{start:node.end,end:node.end,value:")"});
        let fn=node.parent;
        while(fn&&!ts.isFunctionLike(fn)) fn=fn.parent;
        if(fn) markAsync(fn);
      }
    }
    ts.forEachChild(node,visit);
  };
  visit(ast);
  let result=text;
  for(const e of edits.sort((a,b)=>b.start-a.start||b.end-a.end)) result=result.slice(0,e.start)+e.value+result.slice(e.end);
  writeFileSync(file,result);
}
