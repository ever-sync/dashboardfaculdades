TRUNCATE TABLE transferencias_setores CASCADE;
TRUNCATE TABLE metricas_diarias CASCADE;
TRUNCATE TABLE mensagens CASCADE;
TRUNCATE TABLE prospects_academicos CASCADE;
TRUNCATE TABLE conversas_whatsapp CASCADE;
TRUNCATE TABLE faculdades CASCADE;

INSERT INTO faculdades (id, nome, cnpj, telefone, email, plano, status) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'UniFatecie', '12.345.678/0001-90', '(41) 3333-4444', 'contato@unifatecie.edu.br', 'enterprise', 'ativo'),
('550e8400-e29b-41d4-a716-446655440002', 'Faculdade Nova Era', '98.765.432/0001-10', '(11) 9999-8888', 'contato@novaera.edu.br', 'pro', 'ativo'),
('550e8400-e29b-41d4-a716-446655440003', 'Instituto de Tecnologia', '11.222.333/0001-44', '(21) 8888-7777', 'ti@institutotech.edu.br', 'basico', 'ativo');

INSERT INTO conversas_whatsapp (faculdade_id, telefone, nome, status, ultima_mensagem, data_ultima_mensagem, nao_lidas, departamento, atendente) VALUES
('550e8400-e29b-41d4-a716-446655440001', '41987654321', 'Maria Silva', 'ativo', 'Gostaria de informações sobre o curso de Engenharia', NOW() - INTERVAL '2 hours', 0, 'Admissões', 'Elisangela'),
('550e8400-e29b-41d4-a716-446655440001', '41987654322', 'João Santos', 'pendente', 'Qual o valor da mensalidade?', NOW() - INTERVAL '5 hours', 2, 'Financeiro', NULL),
('550e8400-e29b-41d4-a716-446655440001', '41987654323', 'Ana Paula', 'ativo', 'Preciso de informações sobre bolsas', NOW() - INTERVAL '1 day', 0, 'Financeiro', 'Carlos'),
('550e8400-e29b-41d4-a716-446655440001', '41987654324', 'Pedro Costa', 'encerrado', 'Obrigado pela atenção!', NOW() - INTERVAL '3 days', 0, 'Admissões', 'Elisangela'),
('550e8400-e29b-41d4-a716-446655440001', '41987654325', 'Carla Lima', 'ativo', 'Quando começam as aulas?', NOW() - INTERVAL '30 minutes', 1, 'Secretaria', NULL),
('550e8400-e29b-41d4-a716-446655440002', '11912345678', 'Roberto Alves', 'ativo', 'Interesse em Administração', NOW() - INTERVAL '1 hour', 0, 'Admissões', 'Julia'),
('550e8400-e29b-41d4-a716-446655440002', '11912345679', 'Fernanda Souza', 'pendente', 'Documentos necessários?', NOW() - INTERVAL '4 hours', 3, 'Secretaria', NULL),
('550e8400-e29b-41d4-a716-446655440003', '21998877665', 'Lucas Martins', 'ativo', 'Curso de Ciência da Computação', NOW() - INTERVAL '45 minutes', 0, 'Admissões', 'Marcos');

INSERT INTO mensagens (conversa_id, conteudo, remetente, tipo_mensagem, timestamp)
SELECT 
    c.id,
    CASE WHEN random() < 0.5 THEN 'Olá! Como posso ajudar?' ELSE 'Obrigado pelo contato!' END,
    CASE WHEN random() < 0.3 THEN 'bot' WHEN random() < 0.6 THEN 'agente' ELSE 'usuario' END,
    'texto',
    NOW() - (random() * INTERVAL '7 days')
FROM conversas_whatsapp c
CROSS JOIN generate_series(1, 5);

INSERT INTO prospects_academicos (faculdade_id, nome, telefone, email, status_academico, curso, turno, nota_qualificacao, origem, valor_mensalidade) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Maria Silva', '41987654321', 'maria.silva@email.com', 'qualificado', 'Engenharia Civil', 'noite', 85, 'WhatsApp', 1200.00),
('550e8400-e29b-41d4-a716-446655440001', 'João Santos', '41987654322', 'joao.santos@email.com', 'contatado', 'Administração', 'noite', 60, 'WhatsApp', 850.00),
('550e8400-e29b-41d4-a716-446655440001', 'Ana Paula', '41987654323', 'ana.paula@email.com', 'qualificado', 'Direito', 'tarde', 90, 'Site', 1500.00),
('550e8400-e29b-41d4-a716-446655440001', 'Pedro Costa', '41987654324', 'pedro.costa@email.com', 'matriculado', 'Medicina', 'manha', 95, 'Indicação', 8000.00),
('550e8400-e29b-41d4-a716-446655440001', 'Carla Lima', '41987654325', 'carla.lima@email.com', 'novo', 'Psicologia', 'tarde', 70, 'Facebook', 950.00),
('550e8400-e29b-41d4-a716-446655440001', 'Bruno Dias', '41987654326', 'bruno.dias@email.com', 'matriculado', 'Engenharia Civil', 'noite', 88, 'WhatsApp', 1200.00),
('550e8400-e29b-41d4-a716-446655440001', 'Julia Mendes', '41987654327', 'julia.mendes@email.com', 'perdido', 'Enfermagem', 'manha', 45, 'Instagram', 1100.00),
('550e8400-e29b-41d4-a716-446655440002', 'Roberto Alves', '11912345678', 'roberto.alves@email.com', 'qualificado', 'Administração', 'noite', 75, 'WhatsApp', 800.00),
('550e8400-e29b-41d4-a716-446655440002', 'Fernanda Souza', '11912345679', 'fernanda.souza@email.com', 'novo', 'Marketing', 'ead', 55, 'Site', 450.00),
('550e8400-e29b-41d4-a716-446655440002', 'Gustavo Lima', '11912345680', 'gustavo.lima@email.com', 'matriculado', 'Gestão de RH', 'noite', 82, 'WhatsApp', 700.00),
('550e8400-e29b-41d4-a716-446655440003', 'Lucas Martins', '21998877665', 'lucas.martins@email.com', 'contatado', 'Ciência da Computação', 'noite', 92, 'WhatsApp', 1300.00);

INSERT INTO metricas_diarias (faculdade_id, data, total_conversas, conversas_ativas, novos_prospects, prospects_convertidos, mensagens_enviadas, mensagens_recebidas, taxa_automacao_percentual, tempo_medio_primeira_resposta_segundos, nota_media, departamento)
SELECT 
    f.id,
    current_date - (g * INTERVAL '1 day'),
    floor(random() * 50 + 20)::INTEGER,
    floor(random() * 30 + 10)::INTEGER,
    floor(random() * 15 + 5)::INTEGER,
    floor(random() * 8 + 1)::INTEGER,
    floor(random() * 200 + 50)::INTEGER,
    floor(random() * 180 + 40)::INTEGER,
    (random() * 30 + 60)::DECIMAL(5,2),
    floor(random() * 120 + 30)::INTEGER,
    (random() * 2 + 3)::DECIMAL(3,2),
    CASE WHEN random() < 0.33 THEN 'Admissões' WHEN random() < 0.66 THEN 'Financeiro' ELSE 'Secretaria' END
FROM faculdades f
CROSS JOIN generate_series(0, 29) g;

INSERT INTO transferencias_setores (faculdade_id, conversa_id, setor_origem, setor_destino, motivo, timestamp)
SELECT 
    c.faculdade_id,
    c.id,
    'Admissões',
    'Financeiro',
    'Cliente solicitou informações sobre bolsas e financiamento',
    NOW() - (random() * INTERVAL '7 days')
FROM conversas_whatsapp c
WHERE random() < 0.3
LIMIT 5;