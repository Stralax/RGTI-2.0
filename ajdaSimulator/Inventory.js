import { updateInventoryGUI } from "./guiController.js"

export class Inventory {
  constructor(maxSlots) {
    this.maxSlots = maxSlots; // Maximum number of items the inventory can hold
    this.items = []; // Array to store items
  }

  // Add an item to the inventory
  async addItem(item) {
    if (this.items.length < this.maxSlots) {
      this.items.push(item);
      console.log(`${item.name} added to the inventory.`);
      updateInventoryGUI(this);
    } else {
      console.log("Inventory is full!");
    }
  }


  isInInventory(item) {
    return this.items.some(inventoryItem => inventoryItem.name === item.name);
  }

  areItemsInInventory(items) {
    return items.every(item => this.isInInventory(item));
  }

  // Remove an item from the inventory
  async removeItem(itemName) {
    const index = this.items.findIndex(item => item.name === itemName);
    if (index !== -1) {
      const removedItem = this.items.splice(index, 1)[0];
      console.log(`${removedItem.name} removed from the inventory.`);
      updateInventoryGUI(this);
      return removedItem;
    } else {
      console.log(`${itemName} not found in the inventory.`);
      return null;
    }
  }

  // Remove the last item in the inventory (using pop)
  async removeLastItem() {
    if (this.items.length > 0) {
      const removedItem = this.items.pop();
      console.log(`${removedItem.name} removed from the inventory.`);
      updateInventoryGUI(this);
      return removedItem;
    } else {
      console.log("No items to remove.");
      return null;
    }
  }

  // Display inventory contents
  async displayInventory() {
    console.log("Inventory:");
    this.items.forEach((item, index) => {
      console.log(`${index + 1}: ${item.name} (x${item.quantity})`);
    });
    if (this.items.length === 0) {
      console.log("Inventory is empty.");
    }
  }
}

export class Item {
  constructor(name, quantity) {
    this.name = name; // Name of the item
    this.quantity = quantity; // Quantity of the item
  }
}


