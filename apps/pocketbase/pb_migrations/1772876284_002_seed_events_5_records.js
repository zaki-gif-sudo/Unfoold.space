/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("events");

  const record0 = new Record(collection);
    record0.set("title", "Coffee Tasting Masterclass");
    record0.set("description", "Join our expert baristas for an interactive coffee tasting session. Learn about different origins, roasts, and brewing methods. Perfect for coffee enthusiasts of all levels!");
    record0.set("date", "2025-02-15");
    record0.set("time", "14:00");
    record0.set("capacity", 30);
    record0.set("registeredUsers", []);
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
    record1.set("title", "Latte Art Workshop");
    record1.set("description", "Master the art of creating beautiful latte designs! This hands-on workshop teaches you the techniques to create hearts, rosettas, and tulips. All materials provided.");
    record1.set("date", "2025-02-22");
    record1.set("time", "15:00");
    record1.set("capacity", 20);
    record1.set("registeredUsers", []);
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
    record2.set("title", "Community Coffee Social");
    record2.set("description", "A casual gathering for coffee lovers to meet, chat, and enjoy great coffee together. Bring your friends and make new connections over your favorite brew!");
    record2.set("date", "2025-03-01");
    record2.set("time", "10:00");
    record2.set("capacity", 50);
    record2.set("registeredUsers", []);
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
    record3.set("title", "Sustainable Coffee Sourcing Talk");
    record3.set("description", "Learn about ethical coffee sourcing and sustainability practices. Our guest speaker will discuss fair trade, environmental impact, and supporting coffee farmers worldwide.");
    record3.set("date", "2025-03-08");
    record3.set("time", "16:00");
    record3.set("capacity", 40);
    record3.set("registeredUsers", []);
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
    record4.set("title", "Home Brewing Essentials");
    record4.set("description", "Everything you need to know about brewing excellent coffee at home! We'll cover equipment, techniques, and tips to elevate your daily coffee routine.");
    record4.set("date", "2025-03-15");
    record4.set("time", "13:00");
    record4.set("capacity", 35);
    record4.set("registeredUsers", []);
  try {
    app.save(record4);
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