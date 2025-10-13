// Debug script to investigate the 150 gold issue
require('dotenv').config({ path: '.env.local' })

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugGold150Issue() {
  console.log('🔍 Debugging 150 gold issue...\n')

  try {
    // 1. Check all users and their gold values
    console.log('1. Checking all users and their gold values:')
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, gold, total_wins, total_losses, created_at, updated_at')
      .order('updated_at', { ascending: false })

    if (usersError) {
      console.error('❌ Error fetching users:', usersError)
      return
    }

    console.log(`Found ${users.length} users:`)
    users.forEach((user, index) => {
      console.log(`  ${index + 1}. User ${user.id}: ${user.gold} gold`)
      console.log(`     Wins: ${user.total_wins}, Losses: ${user.total_losses}`)
      console.log(`     Created: ${user.created_at}`)
      console.log(`     Updated: ${user.updated_at}`)
      console.log('')
    })

    // 2. Check if there are users with exactly 150 gold
    const usersWith150Gold = users.filter(user => user.gold === 150)
    console.log(`2. Users with exactly 150 gold: ${usersWith150Gold.length}`)
    
    if (usersWith150Gold.length > 0) {
      console.log('Users with 150 gold:')
      usersWith150Gold.forEach(user => {
        console.log(`  - ${user.id}: ${user.gold} gold (Updated: ${user.updated_at})`)
      })
    }

    // 3. Check the default value for the gold column
    console.log('\n3. Checking gold column default value:')
    const { data: columnInfo, error: columnError } = await supabase
      .rpc('get_column_default', { 
        table_name: 'users', 
        column_name: 'gold' 
      })

    if (columnError) {
      console.log('Could not check column default (function may not exist)')
    } else {
      console.log('Gold column default:', columnInfo)
    }

    // 4. Check recent combats to see if gold rewards are being applied
    console.log('\n4. Checking recent combats and gold rewards:')
    const { data: combats, error: combatsError } = await supabase
      .from('combats')
      .select('id, player1_id, player2_id, winner_id, gold_reward, created_at')
      .order('created_at', { ascending: false })
      .limit(10)

    if (combatsError) {
      console.error('❌ Error fetching combats:', combatsError)
    } else {
      console.log(`Found ${combats.length} recent combats:`)
      combats.forEach(combat => {
        console.log(`  - Combat ${combat.id}: Winner ${combat.winner_id}, Gold reward: ${combat.gold_reward}`)
        console.log(`    Created: ${combat.created_at}`)
      })
    }

    // 5. Test the exact scenario: user with 150 gold
    if (usersWith150Gold.length > 0) {
      const testUser = usersWith150Gold[0]
      console.log(`\n5. Testing with user ${testUser.id} (has 150 gold):`)
      
      // Simulate a purchase
      const purchasePrice = 133
      const expectedGold = testUser.gold - purchasePrice
      console.log(`   Simulating purchase: ${testUser.gold} - ${purchasePrice} = ${expectedGold}`)
      
      // Update gold
      const { data: updateData, error: updateError } = await supabase
        .from('users')
        .update({ 
          gold: expectedGold,
          updated_at: new Date().toISOString()
        })
        .eq('id', testUser.id)
        .select()

      if (updateError) {
        console.error('❌ Update error:', updateError)
      } else {
        console.log('✅ Update successful:', updateData)
        
        // Verify the update
        const { data: verifyData, error: verifyError } = await supabase
          .from('users')
          .select('id, gold, updated_at')
          .eq('id', testUser.id)
          .single()

        if (verifyError) {
          console.error('❌ Verification error:', verifyError)
        } else {
          console.log('✅ Verification result:', verifyData)
          
          if (verifyData.gold === expectedGold) {
            console.log('✅ Gold update worked correctly!')
            console.log('   The issue might be in the frontend logic, not the database')
          } else {
            console.log(`❌ Gold update failed! Expected: ${expectedGold}, Got: ${verifyData.gold}`)
            console.log('   The issue is in the database update mechanism')
          }
        }
      }
    }

    // 6. Check if there are any triggers or functions that might be affecting gold
    console.log('\n6. Summary of findings:')
    console.log(`   - Total users: ${users.length}`)
    console.log(`   - Users with 150 gold: ${usersWith150Gold.length}`)
    console.log(`   - Recent combats: ${combats.length}`)
    
    if (usersWith150Gold.length > 0) {
      console.log('   - The 150 gold value is coming from the database')
      console.log('   - This suggests the frontend is loading this value correctly')
      console.log('   - The issue might be in the timing of when loadUserData() is called')
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

debugGold150Issue()
