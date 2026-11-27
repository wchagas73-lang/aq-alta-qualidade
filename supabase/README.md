# AQ Alta Qualidade: configuração do Supabase

Este projeto Supabase deve pertencer ao proprietário da AQ Alta Qualidade. Não conecte este painel a uma conta de terceiros.

## O que já está preparado
- Estrutura SQL para categorias, produtos, pedidos, itens, cupons, configurações e usuários administrativos.
- Row Level Security (RLS) ativada nas tabelas.
- Catálogo público com leitura apenas de categorias e produtos ativos.
- Gestão administrativa protegida por usuário autenticado e registro ativo em `admin_users`.
- Papéis: `owner`, `manager`, `catalog`, `orders`.
- Bucket `aq-products` para fotos de produtos, leitura pública e escrita restrita.
- Painel web em `/admin.html`.

## Ativação pelo proprietário
1. Criar um projeto Supabase próprio da AQ.
2. No SQL Editor, executar o arquivo `supabase/schema.sql`.
3. Em Authentication, criar o usuário do proprietário. Desabilitar cadastro público se não for necessário.
4. Copiar o UUID do usuário e executar o INSERT de primeiro administrador no final do SQL.
5. Copiar Project URL e publishable key do projeto.
6. Preencher `admin-config.js` com URL e publishable key.
7. Publicar no Cloudflare Pages e testar login, leitura do catálogo e operações administrativas.

## Segurança
- A publishable key é pública por definição e pode estar no navegador, desde que RLS esteja correta.
- Nunca usar `service_role`, secret key, senha de usuário ou token privado em arquivos públicos, GitHub ou JavaScript de navegador.
- Não habilitar cadastro público de administradores.
- Criar cada pessoa em Authentication com credencial própria e conceder acesso em `admin_users`.
- Remover o registro de `admin_users` ou marcar `is_active = false` para revogar acesso.
- Não conceder papel `owner` a usuários comuns.
- O painel lista administradores, mas a inclusão e promoção de usuários exige procedimento controlado pelo proprietário.

## Limitações ainda intencionais
- O checkout atual é apenas uma etapa de identificação e revisão. Não cria pedidos nem recebe pagamentos.
- Não há integração Mercado Pago, cálculo de frete, transportadora, WhatsApp transacional ou ERP.
- Pedidos só devem ser criados por endpoint/função server-side que valide produtos, preços, estoque, cupom e confirmação do pagamento. Não confiar em totais enviados pelo navegador.
- Não há dados comerciais reais cadastrados. Não publicar preços, estoque, promoções, frete grátis ou políticas sem validação do proprietário.
