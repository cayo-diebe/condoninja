# Implementação V2

## Tokens e temas

`brand-tokens.json` é a fonte de verdade. Formato simples e explícito, sem declaração de conformidade DTCG. `variables.css` exporta primitivos, tipografia, espaçamento, bordas, gradientes, sombras, motion e funções semânticas.

```html
<link rel="stylesheet" href="variables.css">
<section data-theme="dark">...</section>
```

Use `var(--cn-text)`, `var(--cn-surface)`, `var(--cn-action)`, `var(--cn-on-action)` e `var(--cn-focus)` em componentes. Não misture `#5AC8FF` com texto branco. Use os estados `positive`, `attention`, `alert` e `verified` com suas superfícies correspondentes e rótulos visíveis.

Goldman Regular 400 é a assinatura. Defina `font-synthesis: none`. SVG carregado como `<img>` não herda fontes do documento: use `02_Logos/SVG/Outlined`.

`tailwind-brand-config.js` é uma extensão ESM para Tailwind v3. `tailwind-brand-v4.css` é um mapeamento para v4. Escolha conforme a versão do seu projeto. Não execute os dois indiscriminadamente. A aplicação existente não depende de Tailwind para usar os tokens.

## Reproduzir a entrega

Executar a partir da raiz do projeto, com Python 3, ReportLab, Pillow e Node com `sharp` disponível:

```sh
python3 V2/12_Developer/build-v2.py
python3 V2/12_Developer/build-templates.py
node V2/12_Developer/render-assets.mjs
python3 V2/12_Developer/render-book.py
python3 V2/12_Developer/package-v2.py
python3 V2/12_Developer/verify-v2.py
```

Use o Python do runtime fornecido se ReportLab não estiver instalado no Python padrão. O gerador de assets usa `sharp` do projeto pai e cria uma configuração local de Fontconfig. Os SVGs editáveis incorporam as fontes para aplicações que suportam `@font-face`. Para reexportar de editores desktop, instale as fontes e confira o PNG de referência.

O índice de hashes é gerado por `package-v2.py`; execute-o novamente após qualquer alteração. `verify-v2.py` não modifica o pacote.

## Fonte editorial

`01_Brand_Book/source/book-content.json` contém o texto das 62 páginas. O arquivo Python é a fonte do layout dos PDFs. Os HTMLs em `source/` são uma versão consultável do mesmo conteúdo, não um segundo master com textos independentes.

## Qualidade e limites

O gráfico usa seis valores fictícios, faixa 1.100–1.500 e cálculo (1800/1500−1)×100. Conferir JSON e tabela ao alterar o exemplo. Confiança limitada não é probabilidade de fraude.

V2 não implementa auditoria operacional, autenticação, banco de dados ou processamento de documentos. É um sistema de marca e demonstração de produto. Integre gradualmente no produto existente.
