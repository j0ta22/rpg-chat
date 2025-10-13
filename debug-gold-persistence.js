// Debug script to check gold persistence issues
require('dotenv').config({ path: '.env.local' })

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugGoldPersistence() {
  console.log('🔍 Debugging gold persistence issues...\n')

  try {
    // 1. Check current users table structure
    console.log('1. Checking users table structure:')
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, column_default, is_nullable')
      .eq('table_name', 'users')
      .eq('table_schema', 'public')
      .in('column_name', ['gold', 'total_wins', 'total_losses'])

    if (columnsError) {
      console.error('❌ Error checking table structure:', columnsError)
    } else {
      console.log('Users table columns:')
      columns.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (default: ${col.column_default}, nullable: ${col.is_nullable})`)
      })
    }

    // 2. Check current users and their gold
    console.log('\n2. Checking current users and their gold:')
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, gold, total_wins, total_losses, created_at, updated_at')
      .order('created_at', { ascending: false })
      .limit(10)

    if (usersError) {
      console.error('❌ Error fetching users:', usersError)
    } else {
      console.log(`Found ${users.length} users:`)
      users.forEach(user => {
        console.log(`  - User ${user.id}: ${user.gold} gold, ${user.total_wins} wins, ${user.total_losses} losses`)
        console.log(`    Created: ${user.created_at}, Updated: ${user.updated_at}`)
      })
    }

    // 3. Check if there are any recent gold updates
    console.log('\n3. Checking for recent gold updates in combats table:')
    const { data: combats, error: combatsError } = await supabase
      .from('combats')
      .select('id, player1_id, player2_id, winner_id, gold_reward, created_at')
      .order('created_at', { ascending: false })
      .limit(5)

    if (combatsError) {
      console.error('❌ Error fetching combats:', combatsError)
    } else {
      console.log(`Found ${combats.length} recent combats:`)
      combats.forEach(combat => {
        console.log(`  - Combat ${combat.id}: Winner ${combat.winner_id}, Gold reward: ${combat.gold_reward}`)
        console.log(`    Created: ${combat.created_at}`)
      })
    }

    // 4. Test gold update functionality
    console.log('\n4. Testing gold update functionality:')
    if (users.length > 0) {
      const testUser = users[0]
      const originalGold = testUser.gold
      const newGold = originalGold + 10
      
      console.log(`Testing with user ${testUser.id}:`)
      console.log(`  Original gold: ${originalGold}`)
      console.log(`  Attempting to update to: ${newGold}`)
      
      const { data: updateData, error: updateError } = await supabase
        .from('users')
        .update({ gold: newGold })
        .eq('id', testUser.id)
        .select()

      if (updateError) {
        console.error('❌ Error updating gold:', updateError)
      } else {
        console.log('✅ Gold update successful:', updateData)
        
        // Verify the update
        const { data: verifyData, error: verifyError } = await supabase
          .from('users')
          .select('gold')
          .eq('id', testUser.id)
          .single()

        if (verifyError) {
          console.error('❌ Error verifying gold update:', verifyError)
        } else {
          console.log(`✅ Verification: Gold is now ${verifyData.gold}`)
          
          // Restore original gold
          const { error: restoreError } = await supabase
            .from('users')
            .update({ gold: originalGold })
            .eq('id', testUser.id)

          if (restoreError) {
            console.error('❌ Error restoring original gold:', restoreError)
          } else {
            console.log(`✅ Restored original gold: ${originalGold}`)
          }
        }
      }
    }

    // 5. Check for any RLS policies that might be interfering
    console.log('\n5. Checking RLS policies on users table:')
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'users')

    if (policiesError) {
      console.error('❌ Error checking RLS policies:', policiesError)
    } else {
      console.log(`Found ${policies.length} RLS policies on users table:`)
      policies.forEach(policy => {
        console.log(`  - ${policy.policyname}: ${policy.cmd} (${policy.qual})`)
      })
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

debugGoldPersistence()
