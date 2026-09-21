# Estado de desenvolvimento — Kondo Ninja MVP

## Checkpoint estável

`mvp-cep-first-address-flow` — identificação com CEP opcional em primeiro lugar, endereço editável e número/complemento persistidos, além de autenticação, onboarding e upload verificados em desktop e mobile Chromium.

## Critérios concluídos

- QA multi-condomínio: regressão inicial 13/16; cancelamentos esperados de RSC durante navegação completa separados de falhas HTTP/API e disputa de foco do menu corrigida. Reteste dos seis cenários conta/menu/jornada passou em desktop/mobile; build e lint aprovados. Cartão de adição sem subtítulo verificado em captura mobile.

- Conta lista jornadas independentes e permite adicionar/selecionar condomínios. Migração 5 preserva o progresso existente como primeira jornada; troca transacional arquiva/restaura progresso e rascunho sem remover cadastros ou documentos. A seleção pertence à conta; upload em andamento mantém o condomínio capturado no início da requisição. Testes unitários verificam retomada de rascunho, conclusão, isolamento de documentos e rejeição de seleção entre contas. Fluxo completo de criação e retorno aprovado em desktop/mobile; 16 testes unitários aprovados.
- Menu: indicador amarelo Pendente apenas enquanto onboarding incompleto, sem selos Em breve; identidade mostra usuário e condomínio. Seleção de sugestão de condomínio salva nome e número automaticamente, preservando número quando ausente. Conta oferece cartão Adicionar novo condomínio sem subtítulo.

- Mobile até 720px usa gaveta lateral esquerda com botão Menu fixo inferior, fundo bloqueado, rolagem própria, animação curta/reduced-motion, fechamento por destino/Esc/fundo/X e retorno de foco. Desktop mantém barra lateral. QA: seis cenários conta/cadastro/jornada passaram; teste específico de foco corrigido aguardando fim da transição e aprovado em desktop/mobile.

- Sair da conta removido do menu lateral e disponível como botão vermelho no topo da página Conta. Falhas de logout exibem aviso e permitem tentar novamente. QA: 6 testes E2E desktop/mobile passaram, incluindo saída, proteção da página após logout, novo login e onboarding.

- Avatar padrão branco com contorno cinza enquanto há documentos obrigatórios pendentes; verde quando todas as categorias obrigatórias atingem seu mínimo persistido. Estado derivado no servidor, atualizado após upload/remoção e mantido após refresh; foto pessoal tem prioridade. QA: 4 E2E desktop/mobile (conta e jornada completa), 15 testes unitários e lint aprovados.

- Conta acessível pelo bloco nome/e-mail (sem item no menu), com avatar circular e iniciais como fallback, inclusive mobile. Upload privado JPG/PNG/WebP até 2 MB e 16 MP, normalizado para WebP 256 × 256 sem metadados; migração 4 adiciona tabela sem alterar dados existentes. QA desktop/mobile: navegação por teclado, upload, limite de tamanho, persistência após refresh, rejeição de conteúdo inválido preservando a foto e isolamento entre contas; 15 testes unitários passaram.

- Selecionar sugestão de nome salva automaticamente apenas o nome no rascunho do onboarding ou no condomínio associado ao usuário, sem avançar etapa. Falha mostra aviso; navegação de etapas aguarda confirmação. Verificado em desktop/mobile ao voltar sem salvar, recarregar e manter alterações de endereço não salvas fora do autosave; 14 testes unitários passaram.

- Página Condomínio pós-onboarding verificada em desktop/mobile com ViaCEP real: CEP, sugestões de nome e endereço, troca de UF/cidade, número, edição manual e persistência de relação/CNPJ/unidades/tipo. Usa o mesmo formulário do onboarding, agora com “Salvar alterações”, confirmação de sucesso e mensagens próprias da edição de perfil.

- Documentos apresentados em cards próprios por grupo, com cartões compactos e ajuda expansível. Seleção de arquivos ao lado do título em telas maiores; card inteiro recebe drop e destaque verde. QA: 4 cenários desktop/mobile passaram (jornada completa, upload inválido, drop real, duplicidade), com revisão de screenshots em 867px e mobile.

- Campo Nome do condomínio consulta sugestões pelo logradouro/cidade/UF do passo anterior, sem enviar o nome digitado como busca. Selecionar um edifício altera somente o nome. Teste real em desktop/mobile confirmou os parâmetros enviados e preservação de endereço, CEP, número e complemento após salvar.

- Sugestões ViaCEP com número individual e nome explícito de edifício/condomínio preenchem o número e sugerem o nome na próxima etapa. Rascunho persiste o nome; intervalos de numeração e nomes de empresas não são interpretados como prédio. Teste real Ourinvest/1728 passou em desktop/mobile, incluindo refresh e correção manual do nome; 14 testes unitários passaram.

- Onboarding dividido em Começo → Endereço → Condomínio → Documentos → Revisão. Endereço salva rascunho privado antes de nome/relação/dados opcionais; refresh retoma em Condomínio. Migração 3 preserva registros e etapas existentes; etapa antiga de identificação abre Endereço.
- QA desta divisão: 13 testes unitários; 11/12 E2E na execução completa, com o cenário de cadastro restante aprovado na repetição isolada após erro transitório do roteador Next dev. Fluxos de onboarding passaram em desktop/mobile.

- Estado antes de cidade; lista completa de municípios via IBGE por UF, capital primeiro e demais cidades em ordem alfabética. Trocar UF limpa a cidade; CEP preserva o par preenchido. Falha de consulta oferece digitação manual e retry. Teste real confirmou SP (645 municípios) e RS em desktop/mobile.

- Cadastro, login, logout e proteção de `/app`.
- Tentativa de cadastro com e-mail existente abre o login com e-mail preenchido e foco na senha; o e-mail fica temporariamente na aba, fora da URL.
- Primeiro acesso direcionado ao onboarding, com retomada após refresh e relogin.
- Etapas anteriores já desbloqueadas podem ser reabertas pelo stepper; avanço para etapas futuras permanece bloqueado no cliente e no servidor.
- Identificação do condomínio com dados essenciais e campos complementares.
- Sugestões de endereço com debounce, teclado e ARIA quando cidade/UF estão disponíveis; seleção preenche logradouro, CEP, cidade e estado, com consulta por CEP como fallback.
- CEP apresentado primeiro e opcional: quando válido, preenche logradouro, cidade e estado; sem CEP, o usuário pode completar o endereço manualmente.
- Número e complemento/unidade/apartamento são campos obrigatórios separados e persistentes; os demais dados preenchidos automaticamente permanecem editáveis.
- Checklist extensível por categorias: governança, financeiro, bancário, contratos/fornecedores e apoio.
- Upload múltiplo por categoria, drag-and-drop, progresso, validação de extensão/tamanho/conteúdo, duplicidade e retry. Botão e rota de download removidos da área do cliente; arquivos preservados. Visualização administrativa fica para uma etapa futura.
- Feedback de sucesso somente após persistência; falhas não são apresentadas como uploads concluídos.
- Bloqueio da remoção do único documento obrigatório e suporte seguro a substituição.
- Conclusão condicionada aos três documentos mínimos: convenção, prestação de contas/balancetes e boleto/recibo.
- Dashboard inicial com progresso, completude por categoria e navegação restrita com módulos futuros desabilitados.
- Layout verificado em viewport desktop e mobile.

## Evidência mais recente

- `pnpm typecheck` — passou.
- `pnpm lint` — passou.
- `pnpm test` — 13 testes passaram.
- `pnpm test:e2e` — 12 cenários passaram em desktop/mobile, incluindo busca real sem mocks por “Av Paulista”, seleção de CEP, busca vazia, CEP, endereço manual, cadastro duplicado e persistência.
- Busca expande abreviações de logradouro, exibe trechos de CEP e distingue resultados vazios de indisponibilidade. O teste real depende de conectividade com ViaCEP.
- `pnpm build` — passou.

## Limitações conhecidas

- Storage, banco e sessões são locais; não há ainda provedor gerenciado ou estratégia de escala horizontal.
- O status documental termina em “aguardando análise”; não existe processamento assíncrono de conteúdo nesta fatia.
- A busca de rua do MVP usa ViaCEP com contexto de cidade/UF; para autocomplete nacional sem contexto será necessário configurar um provedor de Places/geocoding com chave e política de produção. A digitação manual e o fluxo sem CEP continuam disponíveis.
- Ainda faltam rate limiting, recuperação de senha, convite de membros e observabilidade de produção.

## Próxima prioridade

Escolher o adaptador de produção para autenticação/storage e, em seguida, conectar processamento documental assíncrono sem alterar o contrato do checklist/upload local.

## Decisão humana necessária

Nenhuma para o MVP local. Antes de produção, é necessário decidir o provedor de autenticação, armazenamento e processamento de documentos.
