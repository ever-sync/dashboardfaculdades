-- Create conversations table
CREATE TABLE conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone_number VARCHAR(20) NOT NULL,
  name VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('active', 'pending', 'closed')),
  last_message TEXT,
  last_message_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  unread_count INTEGER DEFAULT 0,
  department VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create messages table
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  sender VARCHAR(10) NOT NULL CHECK (sender IN ('user', 'agent')),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'document')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create prospects table
CREATE TABLE prospects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'enrolled', 'lost')),
  course VARCHAR(255) NOT NULL,
  score INTEGER DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  last_contact TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create analytics_stats table
CREATE TABLE analytics_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  total_conversations INTEGER DEFAULT 0,
  active_conversations INTEGER DEFAULT 0,
  new_prospects INTEGER DEFAULT 0,
  converted_prospects INTEGER DEFAULT 0,
  messages_sent INTEGER DEFAULT 0,
  messages_received INTEGER DEFAULT 0,
  department VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(date, department)
);

-- Create indexes for better performance
CREATE INDEX idx_conversations_status ON conversations(status);
CREATE INDEX idx_conversations_department ON conversations(department);
CREATE INDEX idx_conversations_last_message_date ON conversations(last_message_date);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_timestamp ON messages(timestamp);
CREATE INDEX idx_prospects_status ON prospects(status);
CREATE INDEX idx_prospects_course ON prospects(course);
CREATE INDEX idx_analytics_stats_date ON analytics_stats(date);
CREATE INDEX idx_analytics_stats_department ON analytics_stats(department);

-- Enable Row Level Security
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE prospects ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_stats ENABLE ROW LEVEL SECURITY;

-- Grant permissions to anon and authenticated roles
GRANT SELECT ON conversations TO anon;
GRANT SELECT ON messages TO anon;
GRANT SELECT ON prospects TO anon;
GRANT SELECT ON analytics_stats TO anon;

GRANT ALL ON conversations TO authenticated;
GRANT ALL ON messages TO authenticated;
GRANT ALL ON prospects TO authenticated;
GRANT ALL ON analytics_stats TO authenticated;