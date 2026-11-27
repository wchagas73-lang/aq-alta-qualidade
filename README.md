# AQ Alta Qualidade

Projeto de e-commerce da AQ Alta Qualidade. A vitrine e o painel administrativo estão preparados em código, mas a loja ainda não está habilitada para vendas reais.

## Publicação na Cloudflare Pages

Projeto estático, sem etapa de build:
- Framework preset: None
- Build command: deixar vazio
- Build output directory: `/`
- Root directory: `/`

## Estrutura atual

- `index.html`, vitrine pública, categorias, busca, favoritos, carrinho e checkout demonstrativo.
- `styles.css`, identidade visual preta com detalhes dourados e textos claros, incluindo ajustes responsivos.
- `app.js`, interações da vitrine, persistência local do carrinho/favoritos e leitura do catálogo quando a integração for configurada.
- `admin.html`, `admin.css` e `admin.js`, painel administrativo com autenticação Supabase, controle de acesso por função e gestão de produtos, categorias, pedidos, cupons e configurações.
- `admin-config.js`, configuração pública ainda vazia.
- `supabase/schema.sql`, estrutura inicial do banco, políticas RLS e bucket de imagens.
- `supabase/README.md`, instruções de ativação pelo proprietário.

## Propriedade e segurança do Supabase

O Supabase deverá ser criado na conta do proprietário da AQ Alta Qualidade. Nenhuma conta ou projeto Supabase do desenvolvedor deve ser utilizado. O SQL ainda não foi executado em nenhum projeto.

A chave configurada no navegador deverá ser somente a publishable/anon key, protegida por RLS. Nunca inserir `service_role`, secret keys ou credenciais privadas no frontend. O proprietário cria a primeira conta administrativa e autoriza os demais usuários.

## Limites atuais

- Produtos, preços e estoques locais são apenas demonstrativos até a conexão com o catálogo real.
- Não há fotos oficiais, catálogo comercial, dados legais ou contatos oficiais cadastrados.
- O checkout apenas coleta dados no navegador e apresenta uma revisão demonstrativa. Não cria pedidos, não reserva estoque e não recebe pagamentos.
- Mercado Pago, cálculo de frete, transportadora, notificações e domínio próprio ainda não foram configurados.
- O SQL está preparado, mas precisa ser revisado e executado no projeto Supabase do proprietário antes de qualquer teste integrado.

**Não utilizar esta versão para receber compras reais.**

## Próximas etapas

1. O proprietário cria seu próprio projeto Supabase e fornece acesso autorizado para a configuração.
2. Revisar e executar o SQL no projeto do proprietário.
3. Configurar URL e publishable key em `admin-config.js`.
4. Criar o primeiro administrador, testar permissões e validar o CRUD.
5. Inserir catálogo, imagens, preços, variações e estoque oficiais.
6. Definir pagamento, frete, políticas comerciais e dados de atendimento.
7. Implementar criação segura de pedidos no servidor, validar o fluxo ponta a ponta e só então habilitar vendas.
