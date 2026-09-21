# Brand Concept Website

## Abrir localmente

Para a experiência completa, sirva esta pasta com qualquer servidor HTTP estático e abra `index.html`. Exemplo:

```bash
python -m http.server 8080
```

Acesse `http://localhost:8080/`.

`brand-concept-standalone.html` é a versão autocontida: CSS, JavaScript, fontes e imagens essenciais estão incorporados em um único arquivo para compartilhamento simples.

## Estrutura

- `index.html`: conteúdo semântico e navegação.
- `styles.css`: tokens, layout responsivo, estados de foco e motion.
- `script.js`: menu mobile, canvas de conexões, reveal e navegação ativa.
- `assets/`: fontes, logos, padrões e aplicações.

## Acessibilidade e performance

- Skip link e landmarks semânticos.
- Navegação por teclado e foco visível.
- Contraste de texto documentado no Brand Book.
- Adaptação para `prefers-reduced-motion`.
- Imagens abaixo da dobra com lazy loading.
- Canvas pausado quando a aba fica invisível.
- Layout fluido sem largura mínima superior a 320 px.

## Produção

Antes de publicar, minifique os arquivos somente se o pipeline mantiver sourcemaps. Configure cache longo para fontes e imagens versionadas e cache curto para HTML. Atualize metadados de domínio e analytics apenas após a definição do ambiente oficial.

