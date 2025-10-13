// Test gold update directly in Supabase
require('dotenv').config({ path: '.env.local' })

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testGoldUpdate() {
  console.log('🧪 Testing gold update functionality...\n')

  try {
    // Get a user with combat wins
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, gold, total_wins, total_losses')
      .gt('total_wins', 0)
      .limit(1)

    if (usersError || !users || users.length === 0) {
      console.log('No users with wins found, using first user...')
      const { data: allUsers, error: allUsersError } = await supabase
        .from('users')
        .select('id, gold, total_wins, total_losses')
        .limit(1)
      
      if (allUsersError || !allUsers || allUsers.length === 0) {
        console.error('❌ No users found')
        return
      }
      users = allUsers
    }

    const testUser = users[0]
    console.log(`Testing with user: ${testUser.id}`)
    console.log(`Current gold: ${testUser.gold}`)
    console.log(`Wins: ${testUser.total_wins}, Losses: ${testUser.total_losses}`)

    // Test 1: Simple gold update
    console.log('\n1. Testing simple gold update...')
    const newGold = testUser.gold + 25
    console.log(`Attempting to update gold from ${testUser.gold} to ${newGold}`)

    const { data: updateData, error: updateError } = await supabase
      .from('users')
      .update({ 
        gold: newGold,
        updated_at: new Date().toISOString()
      })
      .eq('id', testUser.id)
      .select()

    if (updateError) {
      console.error('❌ Update error:', updateError)
    } else {
      console.log('✅ Update successful:', updateData)
    }

    // Verify the update
    console.log('\n2. Verifying the update...')
    const { data: verifyData, error: verifyError } = await supabase
      .from('users')
      .select('id, gold, updated_at')
      .eq('id', testUser.id)
      .single()

    if (verifyError) {
      console.error('❌ Verification error:', verifyError)
    } else {
      console.log('✅ Verification result:', verifyData)
      if (verifyData.gold === newGold) {
        console.log('✅ Gold update successful!')
      } else {
        console.log(`❌ Gold update failed! Expected: ${newGold}, Got: ${verifyData.gold}`)
      }
    }

    // Test 2: Simulate combat gold reward
    console.log('\n3. Testing combat gold reward simulation...')
    const combatGold = 18 // Base 15 + level bonus
    const finalGold = verifyData.gold + combatGold
    console.log(`Simulating combat reward: +${combatGold} gold`)
    console.log(`Attempting to update gold from ${verifyData.gold} to ${finalGold}`)

    const { data: combatUpdateData, error: combatUpdateError } = await supabase
      .from('users')
      .update({ 
        gold: finalGold,
        updated_at: new Date().toISOString()
      })
      .eq('id', testUser.id)
      .select()

    if (combatUpdateError) {
      console.error('❌ Combat update error:', combatUpdateError)
    } else {
      console.log('✅ Combat update successful:', combatUpdateData)
    }

    // Final verification
    console.log('\n4. Final verification...')
    const { data: finalData, error: finalError } = await supabase
      .from('users')
      .select('id, gold, updated_at')
      .eq('id', testUser.id)
      .single()

    if (finalError) {
      console.error('❌ Final verification error:', finalError)
    } else {
      console.log('✅ Final result:', finalData)
      if (finalData.gold === finalGold) {
        console.log('✅ All gold updates successful!')
      } else {
        console.log(`❌ Final gold update failed! Expected: ${finalGold}, Got: ${finalData.gold}`)
      }
    }

    // Restore original gold
    console.log('\n5. Restoring original gold...')
    const { error: restoreError } = await supabase
      .from('users')
      .update({ 
        gold: testUser.gold,
        updated_at: new Date().toISOString()
      })
      .eq('id', testUser.id)

    if (restoreError) {
      console.error('❌ Restore error:', restoreError)
    } else {
      console.log(`✅ Restored original gold: ${testUser.gold}`)
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

testGoldUpdate()
