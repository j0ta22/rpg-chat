// Test the actual getPlayerRanking function
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://xxdnqqgwqetwgayqjlrm.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4ZG5xcWd3cWV0d2dheXFqbHJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwOTgzMzksImV4cCI6MjA3NDY3NDMzOX0.GNok2n1dhEvJ3xiHT6sS0-HY34WTmQzWJN1gO7-BrLo'

const supabase = createClient(supabaseUrl, supabaseKey)

// Simulate the getPlayerRanking function
async function getPlayerRanking() {
  try {
    console.log('🏆 getPlayerRanking: Starting to fetch rankings...')
    
    // For now, use direct query since RPC function filters out users with no combat data
    // TODO: Fix RPC function to show all users
    const { data: rankings, error } = await supabase
      .from('users')
      .select('username, total_wins, total_losses, win_rate')
      .order('win_rate', { ascending: false })
      .order('total_wins', { ascending: false })
      .limit(50) // Limit to prevent too many results

    if (error) {
      console.error('Error fetching rankings:', error)
      return []
    }

    console.log('Direct query successful, found', rankings?.length || 0, 'users')
    return rankings?.map((player, index) => ({
      username: player.username,
      wins: player.total_wins || 0,
      losses: player.total_losses || 0,
      winRate: player.win_rate || 0,
      totalCombats: (player.total_wins || 0) + (player.total_losses || 0),
      rank: index + 1
    })) || []
  } catch (error) {
    console.error('Error getting player ranking:', error)
    return []
  }
}

async function testRanking() {
  try {
    console.log('🧪 Testing getPlayerRanking function...')
    const rankings = await getPlayerRanking()
    
    console.log('📊 Rankings result:', rankings.length, 'users')
    if (rankings.length > 0) {
      console.log('🏆 Top 5 rankings:')
      rankings.slice(0, 5).forEach((player, index) => {
        console.log(`  ${player.rank}. ${player.username}: ${player.wins}W ${player.losses}L (${player.winRate}% WR) - ${player.totalCombats} fights`)
      })
    } else {
      console.log('❌ No rankings found')
    }
  } catch (error) {
    console.error('❌ Error testing rankings:', error)
  }
}

testRanking()
