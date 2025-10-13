// Test gold update with service role key
require('dotenv').config({ path: '.env.local' })

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  console.log('Available env vars:')
  console.log('- NEXT_PUBLIC_SUPABASE_URL:', !!process.env.NEXT_PUBLIC_SUPABASE_URL)
  console.log('- SUPABASE_SERVICE_ROLE_KEY:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)
  process.exit(1)
}

// Use service role key for admin access
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function testGoldUpdateWithServiceRole() {
  console.log('🔧 Testing gold update with service role...\n')

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

    // Test gold update with service role
    console.log('\n1. Testing gold update with service role...')
    const newGold = testUser.gold + 50
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
        console.log('✅ Gold update successful with service role!')
        
        // Restore original gold
        console.log('\n3. Restoring original gold...')
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
      } else {
        console.log(`❌ Gold update failed! Expected: ${newGold}, Got: ${verifyData.gold}`)
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

testGoldUpdateWithServiceRole()
