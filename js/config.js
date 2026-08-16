/* ===========================================================
   Harmonia Prime · configuração da nuvem
   -----------------------------------------------------------
   Três valores. Enquanto estiverem vazios o app funciona
   exatamente como sempre funcionou, guardando tudo no
   navegador; o botão de sincronizar nem aparece.

   Estas chaves são públicas por natureza. A publishable key do
   Supabase é feita para ficar no navegador: quem protege os
   dados é a Row Level Security da tabela, não o segredo da
   chave. O client secret do Google NÃO entra aqui, ele fica
   só no painel do Supabase.
   =========================================================== */
(function (global) {
  'use strict';

  global.HP_CONFIG = {
    // Supabase · Project Settings › Data API
    supabaseUrl: 'https://ympcwjzrubpfwovyvyhb.supabase.co',
    supabaseKey: 'sb_publishable_OrtihqWcv8NeSQxb86VQNQ_EqFNzQlm',

    // Google Cloud · Credentials › OAuth client ID (Web application)
    googleClientId: '457643745594-eitl775f80mi0dthhor8plki8r8i8sk1.apps.googleusercontent.com'
  };

})(typeof window !== 'undefined' ? window : globalThis);
