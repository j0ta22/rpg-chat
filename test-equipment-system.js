// Test script for equipment system
// Run this in the browser console after logging in

console.log('🔧 Testing equipment system...');

async function testEquipmentSystem() {
  try {
    // Get current user
    const storedUser = localStorage.getItem('rpg-game-user');
    if (!storedUser) {
      console.error('❌ No user logged in');
      return;
    }
    
    const user = JSON.parse(storedUser);
    console.log('👤 Testing with user:', user);

    // Import the functions
    const { 
      getPlayerInventory, 
      getUserEquipment, 
      canEquipItem, 
      equipItem,
      getItemCatalog 
    } = await import('./lib/combat-system.js');

    // Test 1: Get player inventory
    console.log('📦 Testing getPlayerInventory...');
    const inventory = await getPlayerInventory(user.id);
    console.log('Inventory:', inventory);

    // Test 2: Get user equipment
    console.log('⚔️ Testing getUserEquipment...');
    const equipment = await getUserEquipment(user.id);
    console.log('Equipment:', equipment);

    // Test 3: Get item catalog
    console.log('🛍️ Testing getItemCatalog...');
    const catalog = await getItemCatalog();
    console.log('Catalog items:', catalog.length);

    // Test 4: Test canEquipItem for each item in inventory
    console.log('🔍 Testing canEquipItem for inventory items...');
    for (const inventoryItem of inventory) {
      const canEquip = await canEquipItem(user.id, inventoryItem.item.id);
      console.log(`Item ${inventoryItem.item.name}:`, canEquip);
    }

    // Test 5: Try to equip the first equippable item
    console.log('⚔️ Testing equipItem...');
    const equippableItem = inventory.find(item => 
      item.item.itemType !== 'consumable' && 
      item.item.equipmentSlot !== 'consumable'
    );
    
    if (equippableItem) {
      console.log('Trying to equip:', equippableItem.item.name);
      const equipResult = await equipItem(user.id, equippableItem.item.id);
      console.log('Equip result:', equipResult);
      
      // Check equipment after equipping
      const equipmentAfter = await getUserEquipment(user.id);
      console.log('Equipment after equipping:', equipmentAfter);
    } else {
      console.log('No equippable items found in inventory');
    }

  } catch (error) {
    console.error('❌ Error testing equipment system:', error);
  }
}

// Run the test
testEquipmentSystem();
