// Final test script for equipment system
// Run this in the browser console after logging in

console.log('🔧 Final equipment system test...');

async function testFinalEquipment() {
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

    // Test 1: Get player inventory with full item data
    console.log('📦 Test 1: Getting player inventory...');
    const inventory = await getPlayerInventory(user.id);
    console.log(`Found ${inventory.length} items in inventory`);
    
    inventory.forEach((item, index) => {
      console.log(`  ${index + 1}. ${item.item.name}`);
      console.log(`     Type: ${item.item.itemType}, Slot: ${item.item.equipmentSlot}, Level: ${item.item.levelRequired}`);
    });

    // Test 2: Get user equipment
    console.log('\n⚔️ Test 2: Getting user equipment...');
    const equipment = await getUserEquipment(user.id);
    console.log('Current equipment:', equipment);

    // Test 3: Test canEquipItem for each inventory item
    console.log('\n🔍 Test 3: Testing canEquipItem for each inventory item...');
    for (const inventoryItem of inventory) {
      console.log(`\nTesting: ${inventoryItem.item.name}`);
      const canEquip = await canEquipItem(user.id, inventoryItem.item.id);
      console.log(`  Can equip: ${canEquip.canEquip}`);
      if (!canEquip.canEquip) {
        console.log(`  Reason: ${canEquip.reason}`);
      }
    }

    // Test 4: Try to equip the first equippable item
    console.log('\n⚔️ Test 4: Attempting to equip first equippable item...');
    const equippableItem = inventory.find(item => 
      item.item.itemType !== 'consumable' && 
      item.item.equipmentSlot !== 'consumable' &&
      item.item.equipmentSlot !== undefined
    );
    
    if (equippableItem) {
      console.log(`Found equippable item: ${equippableItem.item.name}`);
      console.log(`  Type: ${equippableItem.item.itemType}`);
      console.log(`  Slot: ${equippableItem.item.equipmentSlot}`);
      console.log(`  Level Required: ${equippableItem.item.levelRequired}`);
      
      // Check if we can equip it
      const canEquip = await canEquipItem(user.id, equippableItem.item.id);
      console.log(`  Can equip: ${canEquip.canEquip}`);
      
      if (canEquip.canEquip) {
        console.log('  Attempting to equip...');
        const equipResult = await equipItem(user.id, equippableItem.item.id);
        console.log(`  Equip result: ${equipResult}`);
        
        if (equipResult) {
          // Check equipment after equipping
          const equipmentAfter = await getUserEquipment(user.id);
          console.log('  Equipment after equipping:', equipmentAfter);
        }
      } else {
        console.log(`  Cannot equip: ${canEquip.reason}`);
      }
    } else {
      console.log('❌ No equippable items found in inventory');
    }

    console.log('\n✅ Test completed!');

  } catch (error) {
    console.error('❌ Error in final equipment test:', error);
    console.error('Error details:', error.message, error.stack);
  }
}

// Run the test
testFinalEquipment();
