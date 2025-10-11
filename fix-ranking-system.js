// Script to fix the ranking system
// This will execute the necessary SQL migrations

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  console.log('Please make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function executeSQLFile(filePath) {
  try {
    console.log(`📄 Reading ${filePath}...`)
    const sql = fs.readFileSync(filePath, 'utf8')
    
    console.log(`🚀 Executing ${filePath}...`)
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql })
    
    if (error) {
      console.error(`❌ Error executing ${filePath}:`, error)
      return false
    }
    
    console.log(`✅ Successfully executed ${filePath}`)
    return true
  } catch (error) {
    console.error(`❌ Exception executing ${filePath}:`, error)
    return false
  }
}

async function fixRankingSystem() {
  console.log('🔧 Fixing Ranking System...\n')

  try {
    // 1. Add missing columns to users table
    console.log('1. Adding ranking columns to users table...')
    const { error: columnsError } = await supabase
      .from('users')
      .select('total_wins, total_losses, win_rate')
      .limit(1)

    if (columnsError && columnsError.message.includes('column "total_wins" does not exist')) {
      console.log('   Adding missing columns...')
      const { error: alterError } = await supabase.rpc('exec_sql', {
        sql_query: `
          ALTER TABLE users 
          ADD COLUMN IF NOT EXISTS total_wins INTEGER DEFAULT 0,
          ADD COLUMN IF NOT EXISTS total_losses INTEGER DEFAULT 0,
          ADD COLUMN IF NOT EXISTS win_rate DECIMAL(5,2) DEFAULT 0.00;
        `
      })

      if (alterError) {
        console.error('❌ Error adding columns:', alterError)
      } else {
        console.log('✅ Columns added successfully')
      }
    } else {
      console.log('✅ Columns already exist')
    }

    // 2. Create indexes for better performance
    console.log('2. Creating indexes...')
    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql_query: `
        CREATE INDEX IF NOT EXISTS idx_users_total_wins ON users(total_wins);
        CREATE INDEX IF NOT EXISTS idx_users_win_rate ON users(win_rate);
        CREATE INDEX IF NOT EXISTS idx_users_ranking ON users(win_rate DESC, total_wins DESC);
      `
    })

    if (indexError) {
      console.error('❌ Error creating indexes:', indexError)
    } else {
      console.log('✅ Indexes created successfully')
    }

    // 3. Update existing users with their actual combat statistics
    console.log('3. Updating user statistics...')
    const { error: updateError } = await supabase.rpc('exec_sql', {
      sql_query: `
        UPDATE users 
        SET 
            total_wins = COALESCE((
                SELECT COUNT(*) 
                FROM combats 
                WHERE winner_id = users.id
            ), 0),
            total_losses = COALESCE((
                SELECT COUNT(*) 
                FROM combats 
                WHERE (player1_id = users.id OR player2_id = users.id) 
                AND winner_id != users.id
            ), 0),
            win_rate = CASE 
                WHEN COALESCE((
                    SELECT COUNT(*) 
                    FROM combats 
                    WHERE (player1_id = users.id OR player2_id = users.id)
                ), 0) > 0 THEN
                    ROUND((
                        COALESCE((
                            SELECT COUNT(*) 
                            FROM combats 
                            WHERE winner_id = users.id
                        ), 0)::decimal / 
                        COALESCE((
                            SELECT COUNT(*) 
                            FROM combats 
                            WHERE (player1_id = users.id OR player2_id = users.id)
                        ), 1)
                    ) * 100, 2)
                ELSE 0.00
            END;
      `
    })

    if (updateError) {
      console.error('❌ Error updating user statistics:', updateError)
    } else {
      console.log('✅ User statistics updated successfully')
    }

    // 4. Create RPC functions
    console.log('4. Creating RPC functions...')
    const rpcFunctions = fs.readFileSync(path.join(__dirname, 'ranking-rpc-functions.sql'), 'utf8')
    const { error: rpcError } = await supabase.rpc('exec_sql', { sql_query: rpcFunctions })

    if (rpcError) {
      console.error('❌ Error creating RPC functions:', rpcError)
    } else {
      console.log('✅ RPC functions created successfully')
    }

    // 5. Verify the fix
    console.log('5. Verifying the fix...')
    const { data: rankings, error: verifyError } = await supabase
      .from('users')
      .select('username, total_wins, total_losses, win_rate')
      .order('win_rate', { ascending: false })
      .order('total_wins', { ascending: false })

    if (verifyError) {
      console.error('❌ Error verifying rankings:', verifyError)
    } else {
      console.log('✅ Rankings verification:')
      rankings?.forEach((player, index) => {
        const totalCombats = (player.total_wins || 0) + (player.total_losses || 0)
        console.log(`   ${index + 1}. ${player.username}`)
        console.log(`      - Wins: ${player.total_wins || 0}`)
        console.log(`      - Losses: ${player.total_losses || 0}`)
        console.log(`      - Win Rate: ${player.win_rate || 0}%`)
        console.log(`      - Total Combats: ${totalCombats}`)
        console.log('')
      })
    }

    console.log('🎉 Ranking system fix completed!')

  } catch (error) {
    console.error('❌ General error:', error)
  }
}

// Execute the fix
fixRankingSystem()
