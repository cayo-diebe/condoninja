# Revisão V1 → V2

18 de setembro de 2026. Fonte: conversa compartilhada, sete entregáveis individuais e o ZIP `Condo-Ninja-Brand-System-v1.0.zip`, fornecidos pelo usuário. O ZIP contém 251 arquivos. V1 foi preservada; a extração está em `V1/extracted`.

## Diagnóstico

V1 cobre amplamente o briefing: 66 páginas, posicionamento independente, sistema de cor, três famílias tipográficas, aplicações e arquivos editáveis. A V2 mantém essa fundação e melhora as regras operacionais, o rigor dos exemplos e a entrega.

| Achado verificável | Evidência em V1 | Resposta da V2 |
|---|---|---|
| O standalone dependia de outros arquivos para downloads | Links `../01_Brand_Book/...`, `../02_Logos/...` no HTML individual | Fonts, imagens, scripts e cada download exposto são incorporados ao standalone |
| SVGs com texto não transportam a fonte por si só | Lockup em `<img>` exibe fonte fallback no navegador, mesmo com Goldman no CSS da página | Site usa os SVGs em curvas recebidos. Mestres originais preservados |
| SVG e raster de referência não são equivalentes | Referência tem facetas adicionais e gradientes diferentes | Comparação documentada, sem declarar “reconstrução extremamente fiel” como fato |
| Alguns renders PDF perdem olhos/gradientes | Inspeção dos contact sheets das páginas 26, 27 e 66 de V1 | Novo livro usa PNGs V1 nos quais os olhos estão presentes. Isso evita o erro de conversão, sem redesenhar o símbolo |
| O gráfico não informa escala numérica | `08_Data_Visualization/examples/benchmark-elevadores.svg` não tem valores de eixo nem períodos nos pontos | Exemplo novo com eixos, unidade, meses, valores, amostra sintética, fórmula e tabela acessível |
| Benchmark parece pronto para concluir sem metadados suficientes | Faixa genérica e linha ilustrativa | Explicação de escopo, lacuna documental e próximo passo junto do gráfico |
| Números dão falsa precisão sem método | “Sábio 70%, Guardião 30%” e `CONFIDENCE: 0.78` | Personalidade qualitativa e confiança acompanhada de motivo. Nenhuma pontuação inventada |
| Descrições rotuladas 10/30/100 não obedecem todas às contagens | Página 21 / elevator pitch | Novos textos têm contagem exata por espaços, validada pelo gerador |
| Tokens não separam todos os estados por tema | `focus: #5AC8FF`, cor única por estado, `$schema` DTCG em JSON não tipado | 20 pares testados, foco específico por tema, tokens simples sem falsa declaração de schema |
| CJS em `.js` conflita com projeto ESM | `module.exports` em tailwind-brand-config.js, projeto com `type: module` | Export ESM para v3 e mapeamento CSS separado para v4 |
| Nível de governança pode parecer certificação já emitida | Selos visuais 0–3, incluindo dourado | Mesma assinatura azul, rótulos “CONCEITO / NÃO CERTIFICA” no próprio asset e ciclo de vida proposto |
| Avisos de fonte apenas resumem licença | `FONT-LICENSES.txt` remete a URLs | Textos OFL completos, com copyright extraído dos metadados das fontes |
| Diretórios diferem apenas por caixa | `SVG/Outlined` e `SVG/outlined` duplicam conteúdo | Uma pasta canônica `Outlined`; duplicatas idênticas removidas e variantes diferentes movidas para `Alternate-Outlined-Exports` somente na cópia V2 |
| Impressão não equivale a pré-impressão certificada | PDF A4 é descrito como para impressão | V2 explicita RGB de escritório, sem prometer PDF/X, CMYK ou prova de cor |

## Direção editorial

A ideia permanece **clareza independente para quem paga condomínio**. O posicionamento é uma segunda opinião do lado de proprietários e moradores. V2 substitui a sequência de recomendações genéricas por regras acompanhadas de exemplos, campos obrigatórios e decisões que um designer ou desenvolvedor consegue aplicar.

O Brand Book foi reescrito em 62 páginas. O site foi reconstruído em HTML/CSS/JS, com tipografia mais legível, fundos claros e escuros, uma demonstração explorável do Raio-X, fontes próximas do achado, tabela de dados e mecanismos de navegação simples. Nenhum conteúdo depende de animação para aparecer.

## O que foi preservado

Os mestres de logo V1, PNGs, versões monocromáticas, ícones, padrões, arquivos de fonte, referências e PPTX editável foram mantidos. Preservar não significa validar toda afirmação da revisão anterior. O índice V2 marca cada arquivo como `preserved`, `modified` ou `new`; lista também as duplicatas retiradas.

O PPTX de sete slides e aplicações antigas permanecem como materiais recebidos. Não foram redesenhados nem tiveram render final de PowerPoint nesta revisão. Os novos templates levam prefixo `v2-`. O microsite e os PDFs usam a nova direção.

## Limites explícitos

- O vetor definitivo ainda exige aprovação de fidelidade frente à referência raster. Não foi criado novo ninja.
- Os PDFs do livro utilizam imagens de marca de alta resolução; não são arquivos mestres de logotipo vetorial. Os vetores recebidos continuam na pasta de logos.
- Dados de produto são sintéticos e não representam condomínio ou preços reais.
- Não existe metodologia de certificação aprovada ou economia garantida.
- Os testes de contraste cobrem os pares documentados; não constituem certificação WCAG integral.
- A aplicação Next.js, dados privados e publicação existente não foram alterados.
