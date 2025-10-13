// Test gold update with service role key to bypass RLS
require('dotenv').config({ path: '.env.local' })

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  console.log('Available env vars:')
  console.log('- NEXT_PUBLIC_SUPABASE_URL:', !!process.env.NEXT_PUBLIC_SUPABASE_URL)
  console.log('- SUPABASE_SERVICE_ROLE_KEY:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)
  console.log('\nNote: SUPABASE_SERVICE_ROLE_KEY is required for this test')
  console.log('You can find it in your Supabase project settings under API')
  process.exit(1)
}

// Use service role key for admin access (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function testGoldUpdateWithServiceRole() {
  console.log('🔧 Testing gold update with service role (bypasses RLS)...\n')

  try {
    // Get the user with 150 gold
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, gold, total_wins, total_losses, updated_at')
      .eq('id', 'c5e0e4a4-489f-4646-8216-dd5ff2c21a9d')
      .single()

    if (usersError) {
      console.error('❌ Error fetching user:', usersError)
      return
    }

    const testUser = users
    console.log(`Testing with user: ${testUser.id}`)
    console.log(`Current gold: ${testUser.gold}`)
    console.log(`Wins: ${testUser.total_wins}, Losses: ${testUser.total_losses}`)
    console.log(`Last updated: ${testUser.updated_at}`)

    // Test 1: Simple gold update
    console.log('\n1. Testing simple gold update with service role...')
    const newGold = 17
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
        console.log('   This confirms the issue is with RLS policies, not the database itself')
        
        // Test 3: Try updating back to original value
        console.log('\n3. Testing update back to original value...')
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
        console.log('   This suggests a deeper database issue')
      }
    }

    // Test 4: Check if we can update other users
    console.log('\n4. Testing update on other users...')
    const { data: otherUsers, error: otherUsersError } = await supabase
      .from('users')
      .select('id, gold')
      .neq('id', testUser.id)
      .limit(1)

    if (otherUsersError || !otherUsers || otherUsers.length === 0) {
      console.log('No other users found to test')
    } else {
      const otherUser = otherUsers[0]
      console.log(`Testing update on user: ${otherUser.id} (current gold: ${otherUser.gold})`)
      
      const { error: otherUpdateError } = await supabase
        .from('users')
        .update({ 
          gold: otherUser.gold + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', otherUser.id)

      if (otherUpdateError) {
        console.error('❌ Other user update error:', otherUpdateError)
      } else {
        console.log('✅ Other user update successful')
        
        // Restore original value
        await supabase
          .from('users')
          .update({ 
            gold: otherUser.gold,
            updated_at: new Date().toISOString()
          })
          .eq('id', otherUser.id)
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

testGoldUpdateWithServiceRole()