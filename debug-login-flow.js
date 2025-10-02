// Debug script to test the login flow
// Run this in the browser console after logging in

console.log('🔍 Debugging login flow...');

// Check if user is stored in localStorage
const storedUser = localStorage.getItem('rpg-game-user');
console.log('👤 Stored user:', storedUser ? JSON.parse(storedUser) : 'No user found');

// Test the listSavedPlayers function directly
async function testListSavedPlayers() {
  try {
    console.log('🔍 Testing listSavedPlayers...');
    
    // Import the function (you might need to adjust this based on your setup)
    const { listSavedPlayers } = await import('./lib/player-persistence.js');
    
    const players = await listSavedPlayers();
    console.log('📋 Players found:', players);
    console.log('📊 Number of players:', players.length);
    
    return players;
  } catch (error) {
    console.error('❌ Error testing listSavedPlayers:', error);
    return [];
  }
}

// Test the database connection directly
async function testDatabaseConnection() {
  try {
    console.log('🔍 Testing database connection...');
    
    // Import supabase
    const { supabase } = await import('./lib/supabase.js');
    
    // Test users table
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(5);
    
    console.log('👥 Users query result:', { users, usersError });
    
    // Test players table
    const { data: players, error: playersError } = await supabase
      .from('players')
      .select('*')
      .limit(5);
    
    console.log('🎮 Players query result:', { players, playersError });
    
    // Test with specific user ID if available
    const storedUser = localStorage.getItem('rpg-game-user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      console.log('🔍 Testing with user ID:', user.id);
      
      const { data: userPlayers, error: userPlayersError } = await supabase
        .from('players')
        .select('*')
        .eq('user_id', user.id);
      
      console.log('🎮 User players query result:', { userPlayers, userPlayersError });
    }
    
  } catch (error) {
    console.error('❌ Error testing database connection:', error);
  }
}

// Run the tests
testListSavedPlayers();
testDatabaseConnection();
