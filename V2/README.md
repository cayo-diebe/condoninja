# Condo Ninja · Sistema de marca 2.0

Abra **START-HERE.html** para acessar a entrega.

## Ideia central

Clareza independente para quem paga condomínio. A Condo Ninja organiza informação e contextualiza evidências para dar a proprietários e moradores melhores condições de perguntar, colaborar e decidir.

## O que mudou

- Brand Book reescrito em 62 páginas, em versões digital e A4 horizontal.
- Microsite reconstruído com demonstração explorável de evidências, identidade e temas claro/escuro.
- Standalone com imagens, fontes e todos os downloads da página incorporados.
- Tokens semânticos por tema e 20 pares de contraste calculados.
- Doze templates novos em SVG editável e PNG, incluindo carrossel de cinco peças.
- Selos conceituais identificados no próprio desenho, sem relação visual com preço ou pacote.
- Fontes editoriais, scripts de geração, documentação de origem e índice com hashes.

Os assets V1 que continuam úteis foram preservados. O PPTX original permanece editável e não foi redesenhado. Leia `00_Review/REVIEW-V1.md` para diagnóstico, decisões e limites.

## Uso

1. `11_Brand_Site/brand-concept-standalone.html`: arquivo único para abrir ou compartilhar, com downloads embutidos.
2. `01_Brand_Book`: PDFs finais. Os textos ficam em `source/book-content.json` e os PDFs são gerados por `12_Developer/render-book.py`.
3. `07_Templates`: priorize arquivos `v2-*`; as versões anteriores permanecem como referência.
4. `12_Developer`: tokens, integração, scripts e instruções de reprodução.
5. `02_Logos/SVG/Outlined`: prefira curvas em aplicações em que a fonte não pode ser garantida.

V1 fica intacta. V2 não altera o site publicado ou a aplicação principal.
