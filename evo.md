import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const webhookData = await req.json();
    console.log('Webhook recebido:', JSON.stringify(webhookData, null, 2));

    if (webhookData.event === 'messages.upsert') {
      const messageData = webhookData.data;
      
      if (!messageData || messageData.key.fromMe) {
        return new Response(
          JSON.stringify({ message: 'Mensagem ignorada (enviada por mim)' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const fromNumber = messageData.key.remoteJid.replace('@s.whatsapp.net', '');
      const messageContent = messageData.message?.conversation || 
                            messageData.message?.extendedTextMessage?.text || 
                            'Mensagem não textual';

      const { data: conversations, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .eq('contact_number', fromNumber);

      if (convError) {
        console.error('Erro ao buscar conversa:', convError);
        throw convError;
      }

      let conversationId: string;
      let userId: string;

      if (!conversations || conversations.length === 0) {
        const { data: allSettings } = await supabase
          .from('evolution_settings')
          .select('user_id')
          .limit(1);

        if (!allSettings || allSettings.length === 0) {
          throw new Error('Nenhum usuário configurado');
        }

        userId = allSettings[0].user_id;

        const { data: newConv, error: createError } = await supabase
          .from('conversations')
          .insert({
            user_id: userId,
            contact_name: fromNumber,
            contact_number: fromNumber,
            last_message: messageContent,
            last_message_time: new Date().toISOString(),
            unread_count: 1,
          })
          .select()
          .single();

        if (createError) {
          console.error('Erro ao criar conversa:', createError);
          throw createError;
        }

        conversationId = newConv.id;
      } else {
        conversationId = conversations[0].id;
        userId = conversations[0].user_id;
        
        await supabase
          .from('conversations')
          .update({
            last_message: messageContent,
            last_message_time: new Date().toISOString(),
            unread_count: conversations[0].unread_count + 1,
          })
          .eq('id', conversationId);
      }

      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          user_id: userId,
          content: messageContent,
          is_from_me: false,
          status: 'received',
        });

      if (messageError) {
        console.error('Erro ao salvar mensagem:', messageError);
        throw messageError;
      }

      console.log('Mensagem processada com sucesso');
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro no webhook:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Não autorizado');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Usuário não autenticado');
    }

    const { conversationId, message } = await req.json();

    if (!conversationId || !message) {
      throw new Error('Dados incompletos');
    }

    const { data: settings, error: settingsError } = await supabase
      .from('evolution_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (settingsError || !settings) {
      return new Response(
        JSON.stringify({ error: 'Configurações da API Evolution não encontradas' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      throw new Error('Conversa não encontrada');
    }

    console.log('Enviando mensagem via Evolution API:', {
      apiUrl: settings.api_url,
      instance: settings.instance_name,
      to: conversation.contact_number,
    });

    const evolutionResponse = await fetch(
      `${settings.api_url}/message/sendText/${settings.instance_name}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': settings.api_key,
        },
        body: JSON.stringify({
          number: conversation.contact_number,
          text: message,
        }),
      }
    );

    if (!evolutionResponse.ok) {
      const errorText = await evolutionResponse.text();
      console.error('Erro da API Evolution:', errorText);
      throw new Error(`Erro ao enviar mensagem via Evolution API: ${errorText}`);
    }

    const evolutionData = await evolutionResponse.json();
    console.log('Resposta da Evolution API:', evolutionData);

    const { error: messageError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        user_id: user.id,
        content: message,
        is_from_me: true,
        status: 'sent',
      });

    if (messageError) {
      console.error('Erro ao salvar mensagem:', messageError);
    }

    await supabase
      .from('conversations')
      .update({
        last_message: message,
        last_message_time: new Date().toISOString(),
      })
      .eq('id', conversationId);

    return new Response(
      JSON.stringify({ success: true, data: evolutionData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
