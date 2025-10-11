// Apply the ranking fix to show all users
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://xxdnqqgwqetwgayqjlrm.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4ZG5xcWd3cWV0d2dheXFqbHJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwOTgzMzksImV4cCI6MjA3NDY3NDMzOX0.GNok2n1dhEvJ3xiHT6sS0-HY34WTmQzWJN1gO7-BrLo'

const supabase = createClient(supabaseUrl, supabaseKey)

async function applyRankingFix() {
  try {
    console.log('🔧 Applying ranking fix...')
    
    // Apply the SQL fix
    const { data, error } = await supabase
      .rpc('exec_sql', {
        sql: `
          -- Drop and recreate the get_player_rankings function to show all users
          DROP FUNCTION IF EXISTS get_player_rankings();
          
          CREATE OR REPLACE FUNCTION get_player_rankings()
          RETURNS TABLE (
              username TEXT,
              wins INTEGER,
              losses INTEGER,
              win_rate DECIMAL(5,2),
              total_combats INTEGER,
              rank_position BIGINT
          ) AS $$
          BEGIN
              RETURN QUERY
              SELECT 
                  u.username,
                  u.total_wins,
                  u.total_losses,
                  u.win_rate,
                  (u.total_wins + u.total_losses) as total_combats,
                  ROW_NUMBER() OVER (ORDER BY u.win_rate DESC, u.total_wins DESC) as rank_position
              FROM users u
              -- Removed the filter: WHERE u.total_wins > 0 OR u.total_losses > 0
              -- Now shows all users, including those with 0 combat data
              ORDER BY u.win_rate DESC, u.total_wins DESC;
          END;
          $$ LANGUAGE plpgsql;
        `
      })
    
    if (error) {
      console.error('❌ Error applying fix:', error)
    } else {
      console.log('✅ Fix applied successfully!')
      
      // Test the fix
      console.log('🧪 Testing the fix...')
      const { data: rankings, error: testError } = await supabase
        .rpc('get_player_rankings')
      
      if (testError) {
        console.error('❌ Error testing fix:', testError)
      } else {
        console.log('✅ RPC function now returns:', rankings?.length || 0, 'users')
        if (rankings && rankings.length > 0) {
          console.log('📊 Sample rankings:')
          rankings.slice(0, 5).forEach((player, index) => {
            console.log(`  ${index + 1}. ${player.username}: ${player.wins}W ${player.losses}L (${player.win_rate}% WR)`)
          })
        }
      }
    }
    
  } catch (error) {
    console.error('❌ General error:', error)
  }
}

applyRankingFix()
