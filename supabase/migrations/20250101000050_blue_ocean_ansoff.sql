-- Blue Ocean Strategy 4 Actions Framework
-- Ensure pgcrypto is available for gen_random_uuid
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create table for Blue Ocean items (Eliminate, Reduce, Raise, Create)
CREATE TABLE IF NOT EXISTS blue_ocean_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cycle_id UUID NOT NULL REFERENCES strategic_cycles(id) ON DELETE CASCADE,
    action_type VARCHAR(20) NOT NULL CHECK (action_type IN ('eliminate', 'reduce', 'raise', 'create')),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    impact_level VARCHAR(10) DEFAULT 'medium' CHECK (impact_level IN ('low', 'medium', 'high')),
    priority_rank INTEGER,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_blue_ocean_cycle ON blue_ocean_items(cycle_id);
CREATE INDEX IF NOT EXISTS idx_blue_ocean_type ON blue_ocean_items(action_type);

-- Ansoff Matrix items (Market Penetration, Product Development, Market Development, Diversification)
CREATE TABLE IF NOT EXISTS ansoff_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cycle_id UUID NOT NULL REFERENCES strategic_cycles(id) ON DELETE CASCADE,
    quadrant VARCHAR(30) NOT NULL CHECK (quadrant IN ('market_penetration', 'product_development', 'market_development', 'diversification')),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    risk_level VARCHAR(10) DEFAULT 'medium' CHECK (risk_level IN ('low', 'medium', 'high')),
    priority_rank INTEGER,
    status VARCHAR(20) DEFAULT 'idea' CHECK (status IN ('idea', 'evaluating', 'planned', 'in_progress', 'completed', 'cancelled')),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_ansoff_cycle ON ansoff_items(cycle_id);
CREATE INDEX IF NOT EXISTS idx_ansoff_quadrant ON ansoff_items(quadrant);

-- 3Cs Framework (Company, Customers, Competitors)
CREATE TABLE IF NOT EXISTS three_cs_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cycle_id UUID NOT NULL REFERENCES strategic_cycles(id) ON DELETE CASCADE,
    category VARCHAR(20) NOT NULL CHECK (category IN ('company', 'customers', 'competitors')),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    insights TEXT,
    priority_rank INTEGER,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_three_cs_cycle ON three_cs_items(cycle_id);
CREATE INDEX IF NOT EXISTS idx_three_cs_category ON three_cs_items(category);

-- RLS Policies for blue_ocean_items
ALTER TABLE blue_ocean_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view blue ocean items of their workspaces" ON blue_ocean_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM strategic_cycles sc
            JOIN workspace_members wm ON sc.workspace_id = wm.workspace_id
            JOIN users u ON wm.user_id = u.id
            WHERE sc.id = blue_ocean_items.cycle_id
            AND u.supabase_user_id = auth.uid()::text
        )
    );

CREATE POLICY "Users can insert blue ocean items in their workspaces" ON blue_ocean_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM strategic_cycles sc
            JOIN workspace_members wm ON sc.workspace_id = wm.workspace_id
            JOIN users u ON wm.user_id = u.id
            WHERE sc.id = blue_ocean_items.cycle_id
            AND u.supabase_user_id = auth.uid()::text
        )
    );

CREATE POLICY "Users can update blue ocean items in their workspaces" ON blue_ocean_items
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM strategic_cycles sc
            JOIN workspace_members wm ON sc.workspace_id = wm.workspace_id
            JOIN users u ON wm.user_id = u.id
            WHERE sc.id = blue_ocean_items.cycle_id
            AND u.supabase_user_id = auth.uid()::text
        )
    );

CREATE POLICY "Users can delete blue ocean items in their workspaces" ON blue_ocean_items
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM strategic_cycles sc
            JOIN workspace_members wm ON sc.workspace_id = wm.workspace_id
            JOIN users u ON wm.user_id = u.id
            WHERE sc.id = blue_ocean_items.cycle_id
            AND u.supabase_user_id = auth.uid()::text
        )
    );

-- RLS Policies for ansoff_items
ALTER TABLE ansoff_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view ansoff items of their workspaces" ON ansoff_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM strategic_cycles sc
            JOIN workspace_members wm ON sc.workspace_id = wm.workspace_id
            JOIN users u ON wm.user_id = u.id
            WHERE sc.id = ansoff_items.cycle_id
            AND u.supabase_user_id = auth.uid()::text
        )
    );

CREATE POLICY "Users can insert ansoff items in their workspaces" ON ansoff_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM strategic_cycles sc
            JOIN workspace_members wm ON sc.workspace_id = wm.workspace_id
            JOIN users u ON wm.user_id = u.id
            WHERE sc.id = ansoff_items.cycle_id
            AND u.supabase_user_id = auth.uid()::text
        )
    );

CREATE POLICY "Users can update ansoff items in their workspaces" ON ansoff_items
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM strategic_cycles sc
            JOIN workspace_members wm ON sc.workspace_id = wm.workspace_id
            JOIN users u ON wm.user_id = u.id
            WHERE sc.id = ansoff_items.cycle_id
            AND u.supabase_user_id = auth.uid()::text
        )
    );

CREATE POLICY "Users can delete ansoff items in their workspaces" ON ansoff_items
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM strategic_cycles sc
            JOIN workspace_members wm ON sc.workspace_id = wm.workspace_id
            JOIN users u ON wm.user_id = u.id
            WHERE sc.id = ansoff_items.cycle_id
            AND u.supabase_user_id = auth.uid()::text
        )
    );

-- RLS Policies for three_cs_items
ALTER TABLE three_cs_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view 3cs items of their workspaces" ON three_cs_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM strategic_cycles sc
            JOIN workspace_members wm ON sc.workspace_id = wm.workspace_id
            JOIN users u ON wm.user_id = u.id
            WHERE sc.id = three_cs_items.cycle_id
            AND u.supabase_user_id = auth.uid()::text
        )
    );

CREATE POLICY "Users can insert 3cs items in their workspaces" ON three_cs_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM strategic_cycles sc
            JOIN workspace_members wm ON sc.workspace_id = wm.workspace_id
            JOIN users u ON wm.user_id = u.id
            WHERE sc.id = three_cs_items.cycle_id
            AND u.supabase_user_id = auth.uid()::text
        )
    );

CREATE POLICY "Users can update 3cs items in their workspaces" ON three_cs_items
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM strategic_cycles sc
            JOIN workspace_members wm ON sc.workspace_id = wm.workspace_id
            JOIN users u ON wm.user_id = u.id
            WHERE sc.id = three_cs_items.cycle_id
            AND u.supabase_user_id = auth.uid()::text
        )
    );

CREATE POLICY "Users can delete 3cs items in their workspaces" ON three_cs_items
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM strategic_cycles sc
            JOIN workspace_members wm ON sc.workspace_id = wm.workspace_id
            JOIN users u ON wm.user_id = u.id
            WHERE sc.id = three_cs_items.cycle_id
            AND u.supabase_user_id = auth.uid()::text
        )
    );
