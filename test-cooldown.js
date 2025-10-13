// Test script for department cooldown functionality
// Run this in the browser console after logging in

async function testDepartmentCooldown() {
  try {
    console.log("Testing department cooldown functionality...");
    
    // First, check current cooldown status
    const cooldownStatus = await window.$convex.query(window.api.profiles.checkDepartmentCooldown, {
      userId: "your-user-id-here" // Replace with actual user ID
    });
    
    console.log("Current cooldown status:", cooldownStatus);
    
    // Try to update department
    const result = await window.$convex.mutation(window.api.profiles.updateDepartment, {
      userId: "your-user-id-here", // Replace with actual user ID
      department: "College of Computer Studies"
    });
    
    console.log("Update result:", result);
    
    // Check cooldown status after update
    const newCooldownStatus = await window.$convex.query(window.api.profiles.checkDepartmentCooldown, {
      userId: "your-user-id-here" // Replace with actual user ID
    });
    
    console.log("New cooldown status:", newCooldownStatus);
    
  } catch (error) {
    console.error("Error testing cooldown:", error);
  }
}

// Instructions:
console.log("To test department cooldown:");
console.log("1. Replace 'your-user-id-here' with your actual user ID");
console.log("2. Call testDepartmentCooldown()");
