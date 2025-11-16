import { supabase } from '../lib/supabase'

async function insertSampleData() {
  try {
    // Insert sample conversations
    const conversations = [
      {
        phone_number: '+5511987654321',
        name: 'João Silva',
        status: 'active',
        last_message: 'Olá, gostaria de saber mais sobre o curso de Engenharia',
        last_message_date: new Date().toISOString(),
        unread_count: 2,
        department: 'Engenharia'
      },
      {
        phone_number: '+5511998765432',
        name: 'Maria Santos',
        status: 'pending',
        last_message: 'Qual é o valor da mensalidade?',
        last_message_date: new Date(Date.now() - 3600000).toISOString(),
        unread_count: 1,
        department: 'Medicina'
      },
      {
        phone_number: '+5511976543210',
        name: 'Pedro Oliveira',
        status: 'closed',
        last_message: 'Obrigado pelas informações!',
        last_message_date: new Date(Date.now() - 7200000).toISOString(),
        unread_count: 0,
        department: 'Direito'
      }
    ]

    const { data: convData, error: convError } = await supabase
      .from('conversations')
      .insert(conversations)
      .select()

    if (convError) throw convError
    console.log('Conversations inserted:', convData)

    // Insert sample messages for the first conversation
    if (convData && convData.length > 0) {
      const messages = [
        {
          conversation_id: convData[0].id,
          content: 'Olá, gostaria de saber mais sobre o curso de Engenharia',
          sender: 'user',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          message_type: 'text'
        },
        {
          conversation_id: convData[0].id,
          content: 'Claro! O curso de Engenharia tem duração de 5 anos. Gostaria de agendar uma visita?',
          sender: 'agent',
          timestamp: new Date(Date.now() - 1800000).toISOString(),
          message_type: 'text'
        },
        {
          conversation_id: convData[0].id,
          content: 'Sim, gostaria de visitar a faculdade esta semana',
          sender: 'user',
          timestamp: new Date().toISOString(),
          message_type: 'text'
        }
      ]

      const { data: msgData, error: msgError } = await supabase
        .from('messages')
        .insert(messages)

      if (msgError) throw msgError
      console.log('Messages inserted:', msgData)
    }

    // Insert sample prospects
    const prospects = [
      {
        name: 'Ana Costa',
        phone: '+5511965432109',
        email: 'ana.costa@email.com',
        status: 'new',
        course: 'Engenharia Civil',
        score: 85,
        last_contact: new Date().toISOString()
      },
      {
        name: 'Carlos Mendes',
        phone: '+5511954321098',
        email: 'carlos.mendes@email.com',
        status: 'contacted',
        course: 'Medicina',
        score: 92,
        last_contact: new Date(Date.now() - 86400000).toISOString()
      },
      {
        name: 'Beatriz Lima',
        phone: '+5511943210987',
        email: 'beatriz.lima@email.com',
        status: 'qualified',
        course: 'Direito',
        score: 78,
        last_contact: new Date(Date.now() - 172800000).toISOString()
      }
    ]

    const { data: prospectData, error: prospectError } = await supabase
      .from('prospects')
      .insert(prospects)

    if (prospectError) throw prospectError
    console.log('Prospects inserted:', prospectData)

    // Insert sample analytics data
    const analyticsData: any[] = []
    const departments = ['Engenharia', 'Medicina', 'Direito', 'Administração']
    
    for (let i = 0; i < 30; i++) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      
      departments.forEach(department => {
        analyticsData.push({
          date: date.toISOString().split('T')[0],
          total_conversations: Math.floor(Math.random() * 50) + 10,
          active_conversations: Math.floor(Math.random() * 20) + 5,
          new_prospects: Math.floor(Math.random() * 15) + 3,
          converted_prospects: Math.floor(Math.random() * 8) + 1,
          messages_sent: Math.floor(Math.random() * 100) + 20,
          messages_received: Math.floor(Math.random() * 120) + 25,
          department: department
        })
      })
    }

    const { data: analyticsResult, error: analyticsError } = await supabase
      .from('analytics_stats')
      .insert(analyticsData)

    if (analyticsError) throw analyticsError
    console.log('Analytics data inserted:', analyticsResult)

    console.log('Sample data inserted successfully!')
  } catch (error) {
    console.error('Error inserting sample data:', error)
  }
}

// Run the script
insertSampleData()