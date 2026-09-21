# Motion Brand — Condo Ninja

## Princípio

O movimento deve revelar, organizar e conectar. Ele comunica precisão silenciosa: a interface encontra um sinal, relaciona evidências e devolve clareza. Nunca deve sugerir invasão, urgência artificial, jogo ou espetáculo tecnológico.

## Vocabulário de movimento

- **Scan:** uma linha ou máscara percorre o conteúdo para indicar leitura e processamento.
- **Reveal:** informação aparece por recorte, opacidade e deslocamento curto; o conteúdo é descoberto, não “explodido”.
- **Focus:** elementos secundários perdem contraste enquanto a evidência central ganha definição.
- **Connect:** linhas e nós são desenhados em sequência para demonstrar relação entre dados.
- **Organize:** blocos dispersos se alinham em grid ou agrupamentos lógicos.
- **Pulse:** um pulso único e discreto confirma atividade, atualização ou novo sinal.
- **Facet build:** as facetas do símbolo aparecem do centro para as bordas, preservando a leitura do ícone.

## Durações

| Uso | Duração | Observação |
|---|---:|---|
| Feedback imediato | 100–160 ms | Hover, foco, seleção e confirmação local |
| Transição de componente | 180–260 ms | Card, accordion, filtro e estado de módulo |
| Reveal de seção | 360–520 ms | Entrada em viewport ou troca de contexto |
| Construção de gráfico | 600–900 ms | Uma única progressão, sem repetição contínua |
| Sequência narrativa | 900–1.400 ms | Redes, facetas e organização de evidências |

## Easing

- **Standard:** `cubic-bezier(0.2, 0, 0, 1)`
- **Enter:** `cubic-bezier(0.16, 1, 0.3, 1)`
- **Exit:** `cubic-bezier(0.4, 0, 1, 1)`
- **Emphasis:** `cubic-bezier(0.22, 1, 0.36, 1)`

Evitar bounce, elasticidade, overshoot e loops decorativos. Gráficos devem animar uma vez ao entrar; números não devem “rolar” por longos períodos.

## Coreografia

1. Contexto ou estrutura aparece.
2. O sinal é destacado.
3. A evidência associada é conectada.
4. A recomendação ou próximo passo se torna disponível.

Esse encadeamento reforça a lógica **Dado → Sinal → Hipótese → Evidência → Conclusão**.

## Acessibilidade

- Respeitar `prefers-reduced-motion: reduce`.
- Em modo reduzido, remover deslocamentos, parallax, canvas animado e loops; manter apenas mudanças instantâneas de estado ou fades de até 80 ms.
- Nunca usar movimento como única forma de comunicar significado.
- Não piscar mais de três vezes por segundo.
- Pausar movimento contínuo quando a aba estiver invisível.

## Logo

- O símbolo pode ser construído por facetas ou revelado por máscara.
- Não rotacionar, deformar, liquefazer ou fragmentar aleatoriamente.
- Não animar os olhos como personagem ou usar gestos de mascote.
- Lockup completo: símbolo primeiro, wordmark 80–140 ms depois.

## Produto

- Estado bloqueado: transição curta de opacidade e ícone de cadeado; nunca “sacudir”.
- Warning: borda e ícone entram juntos; não usar pulso vermelho contínuo.
- Evidência confirmada: check + rótulo textual; cor é apoio, não conteúdo.
- Loading: linha de scan ou skeleton discreto; evitar spinners agressivos.

## Social e vídeo

- Abrir com pergunta ou dado em até 600 ms.
- Usar no máximo três movimentos coordenados por cena.
- Encerrar com tagline e CTA estáveis por pelo menos 1,5 s.
- Trilha, quando houver: pulso contido, precisão e espaço; evitar linguagem épica, gamer ou ameaçadora.

