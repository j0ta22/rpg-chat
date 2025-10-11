// Debug script to test getPlayerRanking function
console.log('🔍 Testing getPlayerRanking function...')

// Test the RPC function directly
async function testRankingFunction() {
  try {
    // Import supabase client
    const { createClient } = await import('@supabase/supabase-js')
    
    const supabaseUrl = 'https://xxdnqqgwqetwgayqjlrm.supabase.co'
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4ZG5xcWd3cWV0d2dheXFqbHJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwOTgzMzksImV4cCI6MjA3NDY3NDMzOX0.GNok2n1dhEvJ3xiHT6sS0-HY34WTmQzWJN1gO7-BrLo'
    
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    console.log('1. Testing RPC function get_player_rankings...')
    const { data: rpcData, error: rpcError } = await supabase
      .rpc('get_player_rankings')
    
    if (rpcError) {
      console.error('❌ RPC Error:', rpcError)
    } else {
      console.log('✅ RPC Success:', rpcData)
    }
    
    console.log('2. Testing direct query fallback...')
    const { data: directData, error: directError } = await supabase
      .from('users')
      .select('username, total_wins, total_losses, win_rate')
      .order('win_rate', { ascending: false })
      .order('total_wins', { ascending: false })
      .limit(10)
    
    if (directError) {
      console.error('❌ Direct Query Error:', directError)
    } else {
      console.log('✅ Direct Query Success:', directData)
    }
    
    console.log('3. Testing users table structure...')
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('username, total_wins, total_losses, win_rate')
      .limit(5)
    
    if (usersError) {
      console.error('❌ Users Query Error:', usersError)
    } else {
      console.log('✅ Users Query Success:', usersData)
    }
    
  } catch (error) {
    console.error('❌ General Error:', error)
  }
}

testRankingFunction()