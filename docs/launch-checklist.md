# AQ Alta Qualidade | Checklist de integração e lançamento

Este documento separa o que já está preparado no repositório do que depende de contas, credenciais e decisões do proprietário. Nenhuma credencial real deve ser colocada neste arquivo.

## 1. Preparado no código

- Vitrine responsiva com identidade visual preta, dourada e branca.
- Categorias iniciais da AQ.
- Busca, detalhes de produto, favoritos e carrinho local.
- Painel administrativo com login Supabase Auth.
- Controle de acesso por papéis: owner, manager, catalog e orders.
- Cadastro e edição de produtos, categorias e cupons.
- Campos opcionais de peso e dimensões por produto para preparar a integração de frete.
- Upload de imagem para o bucket `aq-products`.
- Consulta e atualização de pedidos no painel.
- Estrutura SQL inicial com RLS e funções administrativas em schema privado.
- Configuração pública do Supabase vazia por segurança.
- Checkout público desabilitado até existir processamento seguro no servidor.

## 2. Acessos e informações que o proprietário deverá disponibilizar

### Supabase
- Criar o projeto na conta do proprietário.
- Preferir convidar o responsável técnico como membro do projeto, com a menor permissão necessária, em vez de compartilhar a senha pessoal da conta.
- Project URL e publishable key.
- Criar usuário proprietário no Supabase Auth.
- Executar o SQL revisado em `supabase/schema.sql` e validar as tabelas, políticas RLS e bucket.
- Autorizar o primeiro usuário na tabela `admin_users`.

A publishable key pode ficar no frontend. Senhas, service_role e secret keys nunca podem ser gravadas no GitHub ou no navegador.

### Catálogo
Para cada produto:
- Nome comercial e categoria.
- Descrição aprovada.
- Preço atual e, se aplicável, preço anterior verdadeiro.
- SKU, se utilizado.
- Estoque inicial.
- Peso em gramas e dimensões da embalagem em centímetros, necessários para cotação de frete.
- Tamanhos, cores e demais variações. O estoque atual é controlado no nível do produto, não individualmente por tamanho/cor; se o proprietário precisar de estoque por variante, isso deve ser definido antes de importar o catálogo.
- Fotos oficiais e autorização de uso.
- Definição de publicado ou rascunho.

Também confirmar quais categorias serão usadas e se haverá produtos sem estoque que devam continuar visíveis.

### Entrega
- Nome da transportadora, plataforma ou serviço de frete.
- Conta comercial e documentação/API oficial.
- CEP de origem e dados de remetente.
- Regras de embalagem, peso e dimensões por produto.
- Regiões atendidas, prazos, modalidades e política de retirada, se houver.
- Regras para frete grátis, se existirem.

Não estimar frete apenas no navegador. O valor final deve ser validado pelo serviço de entrega no servidor.

### Mercado Pago
- Conta Mercado Pago do titular da loja e acesso de desenvolvedor.
- Credenciais de teste para homologação.
- Credenciais de produção somente na etapa de lançamento.
- URL pública HTTPS para retorno e webhook.
- Preferência de pagamento: Checkout Pro ou outra solução oficial aprovada pelo proprietário.
- Regras de cancelamento, reembolso e conciliação.

Access Token e segredo de webhook devem ser cadastrados como variáveis secretas do ambiente Cloudflare, nunca no código público, no GitHub ou em mensagens.

### Dados comerciais e legais
- Razão social/nome empresarial e CNPJ, quando aplicável.
- Endereço de origem e endereço comercial que deve ser exibido.
- E-mail e WhatsApp oficiais de atendimento.
- Instagram e domínio próprio, se houver.
- Política de privacidade, troca/devolução, entrega, cancelamento e termos de compra.
- Horários e canais de atendimento.

## 3. Implementação técnica após receber as definições

1. Conectar ao Supabase do proprietário e executar o SQL revisado.
2. Validar RLS, autenticação, papéis administrativos e Storage.
3. Configurar a integração pública usando apenas Project URL e publishable key.
4. Preparar endpoints server-side no Cloudflare Pages Functions para iniciar pedidos e pagamentos.
5. Validar preço, disponibilidade, variações, cupons e frete no servidor. Nunca confiar em valores enviados pelo navegador.
6. Criar pedido pendente de forma idempotente e iniciar a preferência/sessão de pagamento no Mercado Pago.
7. Receber webhook do Mercado Pago, validar assinatura/origem e atualizar o pagamento de forma idempotente.
8. Confirmar pedido e ajustar estoque somente conforme a regra transacional definida.
9. Integrar cotação, contratação e rastreamento da entrega conforme a API do fornecedor escolhido.
10. Exibir no painel os pedidos, pagamentos, status e dados de rastreio necessários.

## 4. Testes obrigatórios antes de publicar vendas

- Login, logout, sessão e revogação de administradores.
- RLS: visitante não pode ler dados privados nem modificar catálogo.
- Administradores só podem executar ações permitidas pelo seu papel.
- Cadastro, edição, publicação, ocultação e exclusão de produtos.
- Upload, leitura e remoção de imagens.
- Busca, categorias, variações, carrinho e quantidades.
- Preço e estoque revalidados no servidor.
- Cupom válido, expirado, inativo, limite de uso e pedido mínimo.
- Persistência local com dados antigos ou corrompidos sem travar a vitrine.
- CEP válido, CEP não atendido, frete e prazo.
- Pagamento aprovado, recusado, cancelado, expirado e reembolsado em ambiente de teste.
- Webhook duplicado ou fora de ordem sem duplicar pedido ou baixar estoque incorretamente.
- Pedido aparece no painel com dados corretos.
- Testes em Android, iPhone e desktop.
- Verificação de domínio, HTTPS, páginas legais, contatos e mensagens de erro.
- Só então trocar para credenciais de produção e habilitar o checkout.

## 5. Critério de lançamento

A loja só estará pronta para receber compras reais quando o fluxo completo tiver sido testado: catálogo real → carrinho → endereço → frete confirmado → pedido no servidor → pagamento confirmado por webhook → atualização de estoque → pedido visível no painel → entrega rastreável.

Até lá, o checkout deve permanecer desabilitado.
