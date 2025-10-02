// Debug script to identify the exact equipment issue
// Run this in the browser console after logging in

console.log('🔧 Debugging equipment issue...');

async function debugEquipmentIssue() {
  try {
    // Get current user
    const storedUser = localStorage.getItem('rpg-game-user');
    if (!storedUser) {
      console.error('❌ No user logged in');
      return;
    }
    
    const user = JSON.parse(storedUser);
    console.log('👤 Current user:', user);

    // Import the functions
    const { 
      getPlayerInventory, 
      getUserEquipment, 
      canEquipItem, 
      equipItem,
      getItemCatalog 
    } = await import('./lib/combat-system.js');

    // Step 1: Check player inventory
    console.log('📦 Step 1: Checking player inventory...');
    const inventory = await getPlayerInventory(user.id);
    console.log('Inventory items:', inventory.length);
    inventory.forEach((item, index) => {
      console.log(`  ${index + 1}. ${item.item.name} (${item.item.itemType}) - Level: ${item.item.levelRequired || 'undefined'}`);
    });

    // Step 2: Check user equipment
    console.log('⚔️ Step 2: Checking user equipment...');
    const equipment = await getUserEquipment(user.id);
    console.log('Current equipment:', equipment);

    // Step 3: Check item catalog
    console.log('🛍️ Step 3: Checking item catalog...');
    const catalog = await getItemCatalog();
    console.log('Catalog items:', catalog.length);
    
    // Show first few items from catalog
    catalog.slice(0, 5).forEach((item, index) => {
      console.log(`  ${index + 1}. ${item.name} - Level: ${item.levelRequired || 'undefined'} - Slot: ${item.equipmentSlot || 'undefined'}`);
    });

    // Step 4: Test canEquipItem for each inventory item
    console.log('🔍 Step 4: Testing canEquipItem for each inventory item...');
    for (const inventoryItem of inventory) {
      console.log(`\nTesting item: ${inventoryItem.item.name}`);
      console.log('Item details:', {
        id: inventoryItem.item.id,
        name: inventoryItem.item.name,
        itemType: inventoryItem.item.itemType,
        equipmentSlot: inventoryItem.item.equipmentSlot,
        levelRequired: inventoryItem.item.levelRequired
      });
      
      const canEquip = await canEquipItem(user.id, inventoryItem.item.id);
      console.log('Can equip result:', canEquip);
    }

    // Step 5: Try to equip the first equippable item
    console.log('\n⚔️ Step 5: Trying to equip first equippable item...');
    const equippableItem = inventory.find(item => 
      item.item.itemType !== 'consumable' && 
      item.item.equipmentSlot !== 'consumable' &&
      item.item.equipmentSlot !== undefined
    );
    
    if (equippableItem) {
      console.log('Found equippable item:', equippableItem.item.name);
      console.log('Attempting to equip...');
      
      const equipResult = await equipItem(user.id, equippableItem.item.id);
      console.log('Equip result:', equipResult);
      
      if (equipResult) {
        // Check equipment after equipping
        const equipmentAfter = await getUserEquipment(user.id);
        console.log('Equipment after equipping:', equipmentAfter);
      }
    } else {
      console.log('❌ No equippable items found in inventory');
      console.log('Available items:');
      inventory.forEach(item => {
        console.log(`  - ${item.item.name}: type=${item.item.itemType}, slot=${item.item.equipmentSlot}`);
      });
    }

  } catch (error) {
    console.error('❌ Error debugging equipment issue:', error);
    console.error('Error details:', error.message, error.stack);
  }
}

// Run the debug
debugEquipmentIssue();
