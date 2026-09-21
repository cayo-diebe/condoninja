# QA — Condo Ninja V2

18 de setembro de 2026. Escopo: sistema de marca local, documentação, microsite e novos templates. A aplicação existente não foi alterada.

## Arquivos e consistência

- Os dois Brand Books têm 62 páginas, fontes incorporadas e marcadores. Leitura digital em formato horizontal e impressão A4 horizontal RGB.
- Todas as 124 páginas foram renderizadas com Poppler e revisadas em contact sheets. Páginas alteradas na revisão final foram renderizadas novamente. O gerador verifica a margem inferior do texto; nenhuma ocorrência fora da área segura.
- Os 12 novos templates e quatro conceitos de selo foram renderizados em PNG e inspecionados visualmente. Ajustado espaçamento entre etiqueta, título e subtítulo nas peças horizontais.
- `verify-v2.py` verifica XML dos SVGs, decodificação dos PNGs, abertura dos PDFs, JSON, IDs HTML únicos, destinos locais e âncoras. Também verifica colisões de nomes por caixa, hashes e correspondência das duas cópias dos tokens/CSS.
- Descrições de 10, 30 e 100 palavras conferidas por divisão em espaços. Exemplo numérico: (1800 / 1500 − 1) × 100 = 20%.
- Vinte pares semânticos de contraste passam os limiares declarados: 4,5:1 para texto e 3:1 para foco/controles. Cálculo em `03_Color/contrast-audit.json`. Não é certificação WCAG da interface inteira.
- JavaScript do site, renderizador Node e configuração Tailwind ESM passam a verificação sintática do Node.

## Navegador

Microsite servido localmente em HTTP e verificado no navegador integrado:

- Larguras de 320, 768 e 1440 px sem overflow horizontal de página.
- Menu móvel abre, atualiza `aria-expanded` e fecha ao seguir um link.
- Alternância do logo muda imagem, descrição e `aria-pressed`. A versão standalone também carrega a variante incorporada após o clique.
- Alternância de tema do Raio-X, detalhes de método e tabela de valores funcionam.
- Scan apresenta andamento e termina em “Demonstração concluída. Nenhum dado foi processado.”
- Cabeçalho em Goldman corrigido com SVG em curvas; fontes, imagens e layouts principais revisados em capturas desktop e mobile.
- Standalone incorpora imagens, fontes, CSS, JavaScript, variantes dinâmicas de logo e os nove downloads expostos. Verificação estática rejeita dependências locais remanescentes. Uso isolado foi verificado por inspeção das URLs incorporadas; não houve emulação de rede offline.
- Nenhum erro de console observado na rodada final de navegação e interações.
- Cópia de cor confirmada: clique em Ink 950 apresentou confirmação e o clipboard do navegador retornou `#050B1A`. A interface oferece seleção manual do código quando a API falha ou demora; esse caminho alternativo foi verificado no código.

## Limites da revisão

- Suporte a movimento reduzido e tratamento de Escape verificados no código, sem emulação de sistema ou auditoria completa de teclado/leitor de tela.
- Não houve matriz de testes em Safari, Firefox, dispositivos físicos ou validação de todos os editores de SVG.
- O PPTX original e aplicações sem prefixo `v2-` estão preservados. Não foram redesenhados nem renderizados em PowerPoint nesta revisão.
- Os demais assets herdados passaram verificações de integridade/formato; isso não equivale a revisão visual individual de cada variante.
- As divergências entre o vetor V1 e a referência raster estão documentadas em `00_Review/REVIEW-V1.md`. V2 não certifica fidelidade do vetor à referência.
- PDF de impressão não é PDF/X, CMYK ou prova de cor. Selos são conceitos explícitos, sem certificação emitida. Dados do exemplo são fictícios.

## Repetir a verificação

Após editar, executar `package-v2.py` e `verify-v2.py` com as dependências descritas no README. O empacotador atualiza o standalone, índice e hashes. Conferir novamente os layouts afetados por qualquer alteração.
