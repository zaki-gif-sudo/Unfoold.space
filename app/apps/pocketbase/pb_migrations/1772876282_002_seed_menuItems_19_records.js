/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("menuItems");

  const record0 = new Record(collection);
    record0.set("name", "Single Shot Espresso");
    record0.set("category", "Espresso");
    record0.set("description", "Pure, bold espresso shot with rich crema");
    record0.set("basePrice", 3.5);
    record0.set("customizationOptions", "{'shots': ['1', '2', '3'], 'temperature': ['hot', 'iced']}");
  try {
    app.save(record0);
  } catch (e) {
    if (e.message.includes("Value must be unique")) {
      console.log("Record with unique value already exists, skipping");
    } else {
      throw e;
    }
  }

  const record1 = new Record(collection);
    record1.set("name", "Double Shot Espresso");
    record1.set("category", "Espresso");
    record1.set("description", "Two shots of premium espresso for extra strength");
    record1.set("basePrice", 4.0);
    record1.set("customizationOptions", "{'shots': ['2', '3'], 'temperature': ['hot', 'iced']}");
  try {
    app.save(record1);
  } catch (e) {
    if (e.message.includes("Value must be unique")) {
      console.log("Record with unique value already exists, skipping");
    } else {
      throw e;
    }
  }

  const record2 = new Record(collection);
    record2.set("name", "Americano");
    record2.set("category", "Espresso");
    record2.set("description", "Espresso shots topped with hot water for a smooth, full-bodied coffee");
    record2.set("basePrice", 4.0);
    record2.set("customizationOptions", "{'shots': ['1', '2', '3'], 'temperature': ['hot', 'iced']}");
  try {
    app.save(record2);
  } catch (e) {
    if (e.message.includes("Value must be unique")) {
      console.log("Record with unique value already exists, skipping");
    } else {
      throw e;
    }
  }

  const record3 = new Record(collection);
    record3.set("name", "Macchiato");
    record3.set("category", "Milk Based Coffee");
    record3.set("description", "Espresso marked with a small amount of steamed milk");
    record3.set("basePrice", 4.5);
    record3.set("customizationOptions", "{'shots': ['1', '2'], 'milkType': ['whole', 'skim', 'oat', 'almond'], 'temperature': ['hot', 'iced']}");
  try {
    app.save(record3);
  } catch (e) {
    if (e.message.includes("Value must be unique")) {
      console.log("Record with unique value already exists, skipping");
    } else {
      throw e;
    }
  }

  const record4 = new Record(collection);
    record4.set("name", "Cappuccino");
    record4.set("category", "Milk Based Coffee");
    record4.set("description", "Equal parts espresso, steamed milk, and milk foam");
    record4.set("basePrice", 5.0);
    record4.set("customizationOptions", "{'shots': ['1', '2'], 'milkType': ['whole', 'skim', 'oat', 'almond', 'soy'], 'temperature': ['hot', 'iced']}");
  try {
    app.save(record4);
  } catch (e) {
    if (e.message.includes("Value must be unique")) {
      console.log("Record with unique value already exists, skipping");
    } else {
      throw e;
    }
  }

  const record5 = new Record(collection);
    record5.set("name", "Latte");
    record5.set("category", "Milk Based Coffee");
    record5.set("description", "Smooth espresso with steamed milk and a light layer of foam");
    record5.set("basePrice", 5.0);
    record5.set("customizationOptions", "{'shots': ['1', '2'], 'milkType': ['whole', 'skim', 'oat', 'almond', 'soy'], 'temperature': ['hot', 'iced'], 'flavor': ['vanilla', 'caramel', 'hazelnut', 'none']}");
  try {
    app.save(record5);
  } catch (e) {
    if (e.message.includes("Value must be unique")) {
      console.log("Record with unique value already exists, skipping");
    } else {
      throw e;
    }
  }

  const record6 = new Record(collection);
    record6.set("name", "Flat White");
    record6.set("category", "Milk Based Coffee");
    record6.set("description", "Espresso with velvety microfoam milk for a rich, creamy texture");
    record6.set("basePrice", 5.5);
    record6.set("customizationOptions", "{'shots': ['1', '2'], 'milkType': ['whole', 'skim', 'oat', 'almond'], 'temperature': ['hot', 'iced']}");
  try {
    app.save(record6);
  } catch (e) {
    if (e.message.includes("Value must be unique")) {
      console.log("Record with unique value already exists, skipping");
    } else {
      throw e;
    }
  }

  const record7 = new Record(collection);
    record7.set("name", "Mocha");
    record7.set("category", "Signature Drinks");
    record7.set("description", "Rich espresso combined with steamed milk and chocolate");
    record7.set("basePrice", 5.5);
    record7.set("customizationOptions", "{'shots': ['1', '2'], 'milkType': ['whole', 'skim', 'oat', 'almond'], 'chocolateType': ['dark', 'milk', 'white'], 'temperature': ['hot', 'iced']}");
  try {
    app.save(record7);
  } catch (e) {
    if (e.message.includes("Value must be unique")) {
      console.log("Record with unique value already exists, skipping");
    } else {
      throw e;
    }
  }

  const record8 = new Record(collection);
    record8.set("name", "Caramel Macchiato");
    record8.set("category", "Signature Drinks");
    record8.set("description", "Espresso with steamed milk, vanilla, and caramel drizzle");
    record8.set("basePrice", 5.75);
    record8.set("customizationOptions", "{'shots': ['1', '2'], 'milkType': ['whole', 'skim', 'oat', 'almond'], 'caramelAmount': ['light', 'regular', 'extra'], 'temperature': ['hot', 'iced']}");
  try {
    app.save(record8);
  } catch (e) {
    if (e.message.includes("Value must be unique")) {
      console.log("Record with unique value already exists, skipping");
    } else {
      throw e;
    }
  }

  const record9 = new Record(collection);
    record9.set("name", "Hazelnut Dream");
    record9.set("category", "Signature Drinks");
    record9.set("description", "Smooth latte infused with rich hazelnut flavor and topped with whipped cream");
    record9.set("basePrice", 6.0);
    record9.set("customizationOptions", "{'shots': ['1', '2'], 'milkType': ['whole', 'skim', 'oat', 'almond'], 'whippedCream': ['yes', 'no'], 'temperature': ['hot', 'iced']}");
  try {
    app.save(record9);
  } catch (e) {
    if (e.message.includes("Value must be unique")) {
      console.log("Record with unique value already exists, skipping");
    } else {
      throw e;
    }
  }

  const record10 = new Record(collection);
    record10.set("name", "Espresso Con Panna");
    record10.set("category", "Signature Drinks");
    record10.set("description", "Bold espresso topped with a dollop of whipped cream");
    record10.set("basePrice", 4.75);
    record10.set("customizationOptions", "{'shots': ['1', '2', '3'], 'whippedCreamAmount': ['light', 'regular', 'extra'], 'temperature': ['hot']}");
  try {
    app.save(record10);
  } catch (e) {
    if (e.message.includes("Value must be unique")) {
      console.log("Record with unique value already exists, skipping");
    } else {
      throw e;
    }
  }

  const record11 = new Record(collection);
    record11.set("name", "Cold Brew Classic");
    record11.set("category", "Cold Brew");
    record11.set("description", "Smooth, naturally sweet cold brew concentrate with water or milk");
    record11.set("basePrice", 4.5);
    record11.set("customizationOptions", "{'milkType': ['none', 'whole', 'skim', 'oat', 'almond'], 'iceAmount': ['light', 'regular', 'extra']}");
  try {
    app.save(record11);
  } catch (e) {
    if (e.message.includes("Value must be unique")) {
      console.log("Record with unique value already exists, skipping");
    } else {
      throw e;
    }
  }

  const record12 = new Record(collection);
    record12.set("name", "Cold Brew Latte");
    record12.set("category", "Cold Brew");
    record12.set("description", "Creamy cold brew with your choice of milk");
    record12.set("basePrice", 5.0);
    record12.set("customizationOptions", "{'milkType': ['whole', 'skim', 'oat', 'almond', 'soy'], 'flavor': ['vanilla', 'caramel', 'hazelnut', 'none'], 'iceAmount': ['light', 'regular', 'extra']}");
  try {
    app.save(record12);
  } catch (e) {
    if (e.message.includes("Value must be unique")) {
      console.log("Record with unique value already exists, skipping");
    } else {
      throw e;
    }
  }

  const record13 = new Record(collection);
    record13.set("name", "Iced Americano");
    record13.set("category", "Cold Brew");
    record13.set("description", "Refreshing iced espresso with water and ice");
    record13.set("basePrice", 4.25);
    record13.set("customizationOptions", "{'shots': ['1', '2', '3'], 'iceAmount': ['light', 'regular', 'extra']}");
  try {
    app.save(record13);
  } catch (e) {
    if (e.message.includes("Value must be unique")) {
      console.log("Record with unique value already exists, skipping");
    } else {
      throw e;
    }
  }

  const record14 = new Record(collection);
    record14.set("name", "Vanilla Cream Mocktail");
    record14.set("category", "Coffee Mocktails");
    record14.set("description", "Smooth vanilla syrup with steamed milk and whipped cream - no coffee");
    record14.set("basePrice", 4.75);
    record14.set("customizationOptions", "{'milkType': ['whole', 'skim', 'oat', 'almond'], 'whippedCream': ['yes', 'no'], 'temperature': ['hot', 'iced']}");
  try {
    app.save(record14);
  } catch (e) {
    if (e.message.includes("Value must be unique")) {
      console.log("Record with unique value already exists, skipping");
    } else {
      throw e;
    }
  }

  const record15 = new Record(collection);
    record15.set("name", "Chocolate Mint Mocktail");
    record15.set("category", "Coffee Mocktails");
    record15.set("description", "Rich chocolate with refreshing mint and steamed milk");
    record15.set("basePrice", 5.0);
    record15.set("customizationOptions", "{'milkType': ['whole', 'skim', 'oat', 'almond'], 'mintIntensity': ['light', 'regular', 'strong'], 'temperature': ['hot', 'iced']}");
  try {
    app.save(record15);
  } catch (e) {
    if (e.message.includes("Value must be unique")) {
      console.log("Record with unique value already exists, skipping");
    } else {
      throw e;
    }
  }

  const record16 = new Record(collection);
    record16.set("name", "Caramel Cream Mocktail");
    record16.set("category", "Coffee Mocktails");
    record16.set("description", "Sweet caramel with creamy milk and a touch of vanilla");
    record16.set("basePrice", 5.25);
    record16.set("customizationOptions", "{'milkType': ['whole', 'skim', 'oat', 'almond'], 'caramelAmount': ['light', 'regular', 'extra'], 'temperature': ['hot', 'iced']}");
  try {
    app.save(record16);
  } catch (e) {
    if (e.message.includes("Value must be unique")) {
      console.log("Record with unique value already exists, skipping");
    } else {
      throw e;
    }
  }

  const record17 = new Record(collection);
    record17.set("name", "Strawberry Bliss Mocktail");
    record17.set("category", "Coffee Mocktails");
    record17.set("description", "Fresh strawberry puree blended with creamy milk and ice");
    record17.set("basePrice", 5.5);
    record17.set("customizationOptions", "{'milkType': ['whole', 'skim', 'oat', 'almond'], 'strawberryIntensity': ['light', 'regular', 'strong'], 'temperature': ['iced']}");
  try {
    app.save(record17);
  } catch (e) {
    if (e.message.includes("Value must be unique")) {
      console.log("Record with unique value already exists, skipping");
    } else {
      throw e;
    }
  }

  const record18 = new Record(collection);
    record18.set("name", "Honey Lavender Mocktail");
    record18.set("category", "Coffee Mocktails");
    record18.set("description", "Delicate lavender infusion with sweet honey and steamed milk");
    record18.set("basePrice", 5.75);
    record18.set("customizationOptions", "{'milkType': ['whole', 'skim', 'oat', 'almond'], 'honeyAmount': ['light', 'regular', 'extra'], 'temperature': ['hot', 'iced']}");
  try {
    app.save(record18);
  } catch (e) {
    if (e.message.includes("Value must be unique")) {
      console.log("Record with unique value already exists, skipping");
    } else {
      throw e;
    }
  }
}, (app) => {
  // Rollback: record IDs not known, manual cleanup needed
})